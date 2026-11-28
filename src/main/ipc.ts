import { randomUUID } from 'node:crypto'
import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { z } from 'zod'
import { LANGUAGES } from '@shared/i18n'
import type { InvokeChannel, QuobaEvents, QuobaInvoke } from '@shared/ipc'
import { SHORTCUT_ACTIONS } from '@shared/settings'
import { SOURCE_IDS } from '@shared/sources'
import type { EngineClient } from './engine'
import type { PromiseStore } from './promise-store'
import type { Secrets } from './secrets'
import type { SettingsStore } from './settings-store'

const sourceId = z.enum(SOURCE_IDS)

const searchRequest = z.object({
  query: z.string().trim().min(1).max(2000),
  limit: z.number().int().min(1).max(200).optional(),
  filters: z
    .object({
      sources: z.array(sourceId).optional(),
      since: z.iso.datetime().optional(),
      until: z.iso.datetime().optional(),
      saidByMe: z.boolean().optional()
    })
    .optional()
})

const sourceSettings = z.object({
  enabled: z.boolean(),
  paths: z.array(z.string()).optional(),
  repos: z.array(z.string().regex(/^[\w.-]+\/[\w.-]+$/)).optional(),
  feeds: z.array(z.url({ protocol: /^https?$/ })).optional(),
  account: z.string().max(200).optional(),
  description: z.string().max(500).optional()
})

const settingsPatch = z
  .object({
    language: z.enum(LANGUAGES),
    followSystemLanguage: z.boolean(),
    launchAtLogin: z.boolean(),
    myNames: z.array(z.string().trim().min(1).max(80)).max(20),
    shortcuts: z.partialRecord(z.enum(SHORTCUT_ACTIONS), z.string().max(60).nullable()),
    globalShortcut: z.string().max(60).nullable(),
    sources: z.partialRecord(sourceId, sourceSettings),
    onboarded: z.boolean()
  })
  .partial()

export function broadcast<C extends keyof QuobaEvents>(channel: C, payload: QuobaEvents[C]): void {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send(channel, payload)
}

function handle<C extends InvokeChannel>(
  channel: C,
  handler: (params: QuobaInvoke[C]['params']) => Promise<QuobaInvoke[C]['result']> | QuobaInvoke[C]['result']
): void {
  ipcMain.handle(channel, (_event, params) => handler(params))
}

export interface IpcDeps {
  store: SettingsStore
  engine: EngineClient
  secrets: Secrets
  promises: PromiseStore
  /** Registers the global shortcut natively; false when another app already owns it. */
  registerGlobalShortcut: (accelerator: string | null) => boolean
  onSettingsChanged: (previous: ReturnType<SettingsStore['get']>) => void
}

export function registerIpc({
  store,
  engine,
  secrets,
  promises,
  registerGlobalShortcut,
  onSettingsChanged
}: IpcDeps): void {
  handle('settings:get', () => store.get())
  handle('settings:update', (params) => {
    const previous = store.get()
    const patch = settingsPatch.parse(params)
    // Register first, so a shortcut another app owns is never saved as if it worked.
    if (patch.globalShortcut !== undefined && !registerGlobalShortcut(patch.globalShortcut)) {
      throw new Error('global-shortcut-unavailable')
    }
    const next = store.update(patch)
    onSettingsChanged(previous)
    broadcast('settings:changed', next)
    return next
  })

  handle('engine:status', () => engine.request('status', {}))
  handle('engine:refresh', (params) => engine.request('refresh', { force: params?.force === true }))

  handle('search:run', (params) =>
    engine.request('search', { ...searchRequest.parse(params), myNames: store.get().myNames })
  )
  handle('answer:start', async (params) => {
    const requestId = randomUUID()
    await engine.request('answer', { ...searchRequest.parse(params), requestId })
    return { requestId }
  })
  handle('answer:cancel', (params) =>
    engine.request('cancelAnswer', { requestId: z.uuid().parse(params.requestId) })
  )

  handle('promises:list', async () => {
    const found = await engine.request('promises', { myNames: store.get().myNames })
    return found.map((item) => ({ ...item, status: promises.status(item.id) }))
  })
  handle('promises:setStatus', (params) => {
    const { id, status } = z
      .object({ id: z.string().min(1).max(500), status: z.enum(['open', 'done', 'dismissed']) })
      .parse(params)
    promises.set(id, status)
  })

  handle('sources:probe', () => engine.request('probeSources', {}))
  handle('sources:pickFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })
  // Each token change finishes saving, restarting and configuring before the next one starts,
  // so a later change cannot kill the engine an earlier one is still configuring.
  let tokenUpdates: Promise<void> = Promise.resolve()
  handle('sources:setToken', (params) => {
    const { token } = z
      .object({ sourceId: z.literal('github'), token: z.string().max(400).nullable() })
      .parse(params)
    const update = tokenUpdates.then(async () => {
      secrets.set('GITHUB_TOKEN', token)
      await engine.restart(secrets.env())
      await engine.request('configure', { settings: store.get() })
    })
    tokenUpdates = update.catch(() => undefined)
    return update
  })

  handle('auth:status', () => engine.request('authStatus', {}))
  handle('auth:login', () => engine.request('login', {}))
  handle('auth:cancel', () => engine.request('cancelLogin', {}))
  handle('auth:logout', () => engine.request('logout', {}))

  handle('app:openExternal', async (params) => {
    const url = z.url({ protocol: /^https$/ }).parse(params.url)
    await shell.openExternal(url)
  })
}
