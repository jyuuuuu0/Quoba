/**
 * Every place Quoba can search, mapped to the AutoRAG datasource that backs it.
 * Shared by the main process (config, probing) and the renderer (labels, icons).
 */

export type SourceKind = 'chat' | 'mail' | 'notes' | 'code' | 'files' | 'web'

/**
 * How a source gets connected:
 * - cli: AutoRAG drives a local companion CLI that owns its own archive and sign-in.
 * - folder: the user picks a folder (Obsidian vault, documents).
 * - token: needs an access token, stored as an environment variable name only.
 * - feeds: a list of feed URLs.
 */
export type SourceSetup = 'cli' | 'folder' | 'token' | 'feeds'

export interface SourceDefinition {
  /** Quoba's id, also used as the AutoRAG datasource key. */
  id: SourceId
  /** AutoRAG built-in datasource template, or `files` for local search paths. */
  template: string
  name: string
  kind: SourceKind
  setup: SourceSetup
  /** Companion CLI that AutoRAG runs for this source. */
  cli?: string
  /** npm package that installs the companion CLI, when there is one. */
  cliPackage?: string
  /** Environment variable that holds the token, for `token` sources. */
  tokenEnv?: string
  /** Shown before the main list only when the user asks for more sources. */
  advanced?: boolean
}

export const SOURCE_IDS = [
  'kakaotalk',
  'discord',
  'slack',
  'telegram',
  'whatsapp',
  'mail',
  'notion',
  'obsidian',
  'github',
  'files',
  'rss',
  'lark',
  'browser'
] as const

export type SourceId = (typeof SOURCE_IDS)[number]

export const SOURCES: readonly SourceDefinition[] = [
  { id: 'kakaotalk', template: 'kakao', name: 'KakaoTalk', kind: 'chat', setup: 'cli', cli: 'lazykatok' },
  { id: 'discord', template: 'discord', name: 'Discord', kind: 'chat', setup: 'cli', cli: 'discrawl' },
  { id: 'slack', template: 'slack', name: 'Slack', kind: 'chat', setup: 'cli', cli: 'slacrawl' },
  { id: 'telegram', template: 'telegram', name: 'Telegram', kind: 'chat', setup: 'cli', cli: 'telecrawl' },
  { id: 'whatsapp', template: 'whatsapp', name: 'WhatsApp', kind: 'chat', setup: 'cli', cli: 'wacrawl' },
  {
    id: 'mail',
    template: 'mailcrawl',
    name: 'Mail',
    kind: 'mail',
    setup: 'cli',
    cli: 'mailcrawl',
    cliPackage: '@nomadamas/mailcrawl'
  },
  { id: 'notion', template: 'notion', name: 'Notion', kind: 'notes', setup: 'cli', cli: 'notcrawl' },
  { id: 'obsidian', template: 'obsidian', name: 'Obsidian', kind: 'notes', setup: 'folder' },
  {
    id: 'github',
    template: 'github',
    name: 'GitHub',
    kind: 'code',
    setup: 'token',
    tokenEnv: 'GITHUB_TOKEN'
  },
  { id: 'files', template: 'files', name: 'Files', kind: 'files', setup: 'folder' },
  { id: 'rss', template: 'rss', name: 'RSS', kind: 'web', setup: 'feeds', advanced: true },
  { id: 'lark', template: 'lark', name: 'Lark', kind: 'chat', setup: 'cli', cli: 'lark-cli', advanced: true },
  {
    id: 'browser',
    template: 'hister',
    name: 'Browser history',
    kind: 'web',
    setup: 'cli',
    cli: 'hister',
    advanced: true
  }
]

export function getSource(id: SourceId): SourceDefinition {
  const source = SOURCES.find((item) => item.id === id)
  if (!source) throw new Error(`Unknown source: ${id}`)
  return source
}

export function isSourceId(value: string): value is SourceId {
  return (SOURCE_IDS as readonly string[]).includes(value)
}
