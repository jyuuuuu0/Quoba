/**
 * Engine process. Runs AutoRAG in an Electron utility process so indexing and search
 * never block the window. The main process talks to it through `EngineRequest` messages.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { AnswerEvent, EngineStatus, SearchResponse, SourceProbe } from '@shared/engine'
import type { Settings } from '@shared/settings'
import { isSourceId } from '@shared/sources'
import { DazziAuth } from './auth'
import { buildDatasources, buildProbeDatasources, buildSearchPaths } from './config'
import { toCitation, toSearchHit, type RawAnswerResult, type RawResult } from './normalize'
import type { EngineEvent, EngineMethod, EngineMethods, EngineRequest, EngineResponse } from './protocol'

type Librarian = typeof import('@autorag/librarian') & typeof import('@autorag/librarian/core')
type Lite = ReturnType<Librarian['createAutoRAGLite']>

const port = process.parentPort
const env: NodeJS.ProcessEnv = { ...process.env }
const autoragHome = env['AUTORAG_HOME'] ?? join(tmpdir(), 'quoba-autorag')
const configPath = join(autoragHome, 'config.json')

let librarianPromise: Promise<Librarian> | undefined
let lite: Lite | undefined
let settings: Settings | undefined
let status: EngineStatus = { state: 'starting' }
let authPromise: Promise<DazziAuth> | undefined
const answers = new Map<string, AbortController>()

function librarian(): Promise<Librarian> {
  librarianPromise ??= Promise.all([import('@autorag/librarian'), import('@autorag/librarian/core')]).then(
    ([main, core]) => ({ ...core, ...main })
  )
  return librarianPromise
}

function emit(message: EngineEvent): void {
  port.postMessage(message)
}

function setStatus(next: EngineStatus): EngineStatus {
  status = next
  emit({ kind: 'event', event: 'status', data: status })
  return status
}

/** Concurrent callers share one instance, so a cancel reaches the sign-in it targets. */
function getAuth(): Promise<DazziAuth> {
  authPromise ??= DazziAuth.create((url) => emit({ kind: 'event', event: 'open-url', data: { url } })).catch(
    (error: unknown) => {
      authPromise = undefined
      throw error
    }
  )
  return authPromise
}

/** Writes AutoRAG's config from Quoba's settings and rebuilds the model-free runtime. */
async function configure(next: Settings): Promise<void> {
  settings = next
  const lib = await librarian()
  // With no folders chosen, point AutoRAG at an empty folder so it indexes chats and mail only.
  const emptyRoot = join(autoragHome, 'empty')
  mkdirSync(emptyRoot, { recursive: true })
  const chosen = buildSearchPaths(next)
  const searchPaths = chosen.length > 0 ? chosen : [emptyRoot]
  if (!existsSync(configPath)) lib.writeDefaultConfig(configPath, { searchPaths }, { env, cwd: autoragHome })
  const raw = lib.readRawConfigObject(configPath)
  lib.writeConfigObject(configPath, { ...raw, searchPaths, datasources: buildDatasources(next) })
  lite = lib.createAutoRAGLite({ env, cwd: autoragHome })
  if (status.state === 'starting') setStatus({ state: 'ready' })
}

function requireLite(): Lite {
  if (!lite) throw new Error('Engine is not configured yet')
  return lite
}

async function refresh(force = false): Promise<EngineStatus> {
  const runtime = requireLite()
  setStatus({ ...status, state: 'indexing', progress: undefined, error: undefined })
  try {
    await runtime.refresh(force, {
      onProgress: (progress) => {
        if ('processed' in progress && 'total' in progress) {
          setStatus({
            ...status,
            state: 'indexing',
            progress: { phase: progress.phase, processed: progress.processed, total: progress.total }
          })
        }
      }
    })
    return setStatus({ state: 'ready', lastIndexedAt: new Date().toISOString() })
  } catch (error) {
    return setStatus({ ...status, state: 'error', progress: undefined, error: String(error) })
  }
}

async function search(params: EngineMethods['search']['params']): Promise<SearchResponse> {
  const runtime = requireLite()
  const filters = params.filters ?? {}
  const limit = params.limit ?? 30
  const sources = filters.sources ?? []
  const selection =
    sources.length > 0
      ? { datasourceIds: sources.filter((id) => id !== 'files'), local: sources.includes('files') }
      : undefined
  const { results, unsearched } = await runtime.searchSelected(params.query, selection, {
    // "Said by me" filters after retrieval, so fetch more to keep enough hits.
    topK: filters.saidByMe ? limit * 3 : limit,
    ...(filters.since ? { since: Date.parse(filters.since) } : {}),
    ...(filters.until ? { until: Date.parse(filters.until) } : {})
  })
  let hits = (results as RawResult[]).map((result) => toSearchHit(result, params.myNames))
  if (filters.saidByMe) hits = hits.filter((hit) => hit.isMe)
  return {
    query: params.query,
    hits: hits.slice(0, limit),
    unsearched: unsearched.map((surface) => surface.surface),
    stale: false
  }
}

function answerError(error: unknown, signedIn: boolean): AnswerEvent {
  const message = error instanceof Error ? error.message : String(error)
  if (!signedIn) return { type: 'error', code: 'signed-out', message }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch failed/i.test(message))
    return { type: 'error', code: 'network', message }
  if (/model|decision/i.test(message)) return { type: 'error', code: 'model-unavailable', message }
  return { type: 'error', code: 'unknown', message }
}

/** Runs AutoRAG's full librarian agent and streams its answer back as events. */
async function answer(params: EngineMethods['answer']['params']): Promise<void> {
  const send = (event: AnswerEvent): void =>
    emit({ kind: 'event', event: 'answer', data: { requestId: params.requestId, event } })
  const abort = new AbortController()
  answers.set(params.requestId, abort)
  const signedIn = (await getAuth()).status().signedIn
  try {
    const lib = await librarian()
    const config = lib.resolveConfig({ flags: {}, env, cwd: autoragHome })
    const resolved = await lib.resolveAgentModel(config, { env, cwd: autoragHome })
    const agent = new lib.AutoRAGAgent({
      ...lib.buildAgentOptions(config),
      model: resolved.model,
      ...(resolved.apiKey !== undefined ? { apiKey: resolved.apiKey } : {}),
      ...(resolved.providerApiKeys !== undefined ? { providerApiKeys: resolved.providerApiKeys } : {})
    })
    const filters = params.filters ?? {}
    const stream = agent.searchDocumentsStream(params.query, {
      signal: abort.signal,
      ...(filters.since ? { since: Date.parse(filters.since) } : {}),
      ...(filters.until ? { until: Date.parse(filters.until) } : {})
    })
    for await (const event of stream) {
      if (abort.signal.aborted) return
      if (event.type === 'progress' && event.text.trim() !== '') send({ type: 'progress', text: event.text })
      if (event.type === 'preliminary' || event.type === 'complete') {
        send({
          type: event.type,
          answer: event.response.answer,
          citations: (event.response.results as readonly RawAnswerResult[]).map(toCitation)
        })
      }
    }
  } catch (error) {
    if (!abort.signal.aborted) send(answerError(error, signedIn))
  } finally {
    answers.delete(params.requestId)
  }
}

function cliPath(): string {
  const require = createRequire(import.meta.url)
  return join(dirname(require.resolve('@autorag/librarian/package.json')), 'dist/cli/index.js')
}

function runCli(args: string[], extraEnv: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    // The Electron binary runs as plain Node with ELECTRON_RUN_AS_NODE.
    const child = spawn(process.execPath, [cliPath(), ...args], {
      env: { ...env, ...extraEnv, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(stdout) : reject(new Error(stderr || `exit ${code}`))))
  })
}

/**
 * Asks AutoRAG which chat and notes sources this computer can run. Runs `autorag setup`
 * against a throwaway home so the probe never edits the user's real configuration.
 */
async function probeSources(): Promise<SourceProbe[]> {
  const lib = await librarian()
  const probeHome = mkdtempSync(join(tmpdir(), 'quoba-probe-'))
  try {
    const probeConfig = join(probeHome, 'config.json')
    lib.writeDefaultConfig(probeConfig, { searchPaths: [probeHome] }, { env, cwd: probeHome })
    const raw = lib.readRawConfigObject(probeConfig)
    writeFileSync(probeConfig, JSON.stringify({ ...raw, datasources: buildProbeDatasources() }))
    const output = await runCli(['setup', '--format', 'json'], { AUTORAG_HOME: probeHome })
    const report = JSON.parse(output.slice(output.indexOf('{'))) as {
      datasources?: { name: string; state: 'configured' | 'skipped' | 'blocked'; reason?: string }[]
    }
    const configured = new Set(Object.keys(settings ? buildDatasources(settings) : {}))
    return (report.datasources ?? []).flatMap((entry): SourceProbe[] => {
      if (!isSourceId(entry.name)) return []
      if (entry.state === 'configured')
        return [{ id: entry.name, state: configured.has(entry.name) ? 'connected' : 'ready' }]
      if (entry.state === 'skipped') return [{ id: entry.name, state: 'missing-tool', detail: entry.reason }]
      return [{ id: entry.name, state: 'error', detail: entry.reason }]
    })
  } finally {
    rmSync(probeHome, { recursive: true, force: true })
  }
}

const handlers: {
  [M in EngineMethod]: (params: EngineMethods[M]['params']) => Promise<EngineMethods[M]['result']>
} = {
  configure: ({ settings: next }) => configure(next),
  refresh: ({ force }) => refresh(force),
  status: async () => status,
  search,
  answer: async (params) => {
    void answer(params)
  },
  cancelAnswer: async ({ requestId }) => {
    answers.get(requestId)?.abort()
    answers.delete(requestId)
  },
  probeSources,
  authStatus: async () => (await getAuth()).status(),
  login: async () => (await getAuth()).login(),
  cancelLogin: async () => (await getAuth()).cancel(),
  logout: async () => (await getAuth()).logout()
}

port.on('message', async ({ data }: { data: EngineRequest }) => {
  if (data?.kind !== 'request') return
  const handler = handlers[data.method] as (params: unknown) => Promise<unknown>
  let response: EngineResponse
  try {
    response = { kind: 'response', id: data.id, ok: true, result: await handler(data.params) }
  } catch (error) {
    response = {
      kind: 'response',
      id: data.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
  port.postMessage(response)
})
