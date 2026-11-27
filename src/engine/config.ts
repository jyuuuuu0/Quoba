import type { Settings, SourceSettings } from '@shared/settings'
import { getSource, SOURCES, type SourceId } from '@shared/sources'

type DatasourceEntry = { type: string; description?: string; connector?: Record<string, unknown> }

function connectorFor(id: SourceId, options: SourceSettings): Record<string, unknown> | undefined {
  switch (id) {
    case 'mail':
      return { account: options.account ?? 'default', mailbox: 'INBOX', binaryPath: 'mailcrawl' }
    case 'obsidian':
      return options.paths?.[0] ? { vaultPath: options.paths[0] } : undefined
    case 'github':
      // Only the variable name is stored; the token itself lives in the OS keychain.
      return options.repos?.length ? { repos: options.repos, tokenEnv: 'GITHUB_TOKEN' } : undefined
    case 'rss':
      return options.feeds?.length ? { feeds: options.feeds.map((url) => ({ url })) } : undefined
    case 'browser':
      return { semantic: true }
    default:
      return {}
  }
}

/** AutoRAG `datasources` entries for every enabled, fully configured source. */
export function buildDatasources(settings: Settings): Record<string, DatasourceEntry> {
  const entries: Record<string, DatasourceEntry> = {}
  for (const source of SOURCES) {
    if (source.id === 'files') continue
    const options = settings.sources[source.id]
    if (!options?.enabled) continue
    const connector = connectorFor(source.id, options)
    if (connector === undefined) continue
    entries[source.id] = {
      type: getSource(source.id).template,
      ...(options.description ? { description: options.description } : {}),
      ...(Object.keys(connector).length > 0 ? { connector } : {})
    }
  }
  return entries
}

/** Folders AutoRAG indexes directly: local documents plus nothing else. */
export function buildSearchPaths(settings: Settings): string[] {
  const files = settings.sources.files
  return files?.enabled ? [...new Set(files.paths ?? [])] : []
}

/** Every datasource template, used to ask AutoRAG which ones this computer can run. */
export function buildProbeDatasources(): Record<string, DatasourceEntry> {
  const entries: Record<string, DatasourceEntry> = {}
  for (const source of SOURCES) {
    if (source.id === 'files' || source.setup !== 'cli') continue
    entries[source.id] = { type: source.template }
  }
  return entries
}
