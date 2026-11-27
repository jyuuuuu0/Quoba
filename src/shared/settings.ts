import type { Language } from './i18n'
import type { SourceId } from './sources'

export const SHORTCUT_ACTIONS = [
  'search',
  'goPromises',
  'goTimeline',
  'goSources',
  'toggleContext',
  'filterSaidByMe'
] as const

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]

/** Electron accelerator strings, e.g. `CommandOrControl+K`. `null` means unset. */
export type ShortcutMap = Record<ShortcutAction, string | null>

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  search: 'CommandOrControl+K',
  goPromises: 'CommandOrControl+2',
  goTimeline: 'CommandOrControl+3',
  goSources: 'CommandOrControl+4',
  toggleContext: 'CommandOrControl+.',
  filterSaidByMe: null
}

export const DEFAULT_GLOBAL_SHORTCUT = 'Alt+Space'

export interface SourceSettings {
  enabled: boolean
  /** Folder for Obsidian vaults and local documents. */
  paths?: string[]
  /** GitHub repositories as `owner/repo`. */
  repos?: string[]
  /** RSS feed URLs. */
  feeds?: string[]
  /** Mail account name configured in mailcrawl. */
  account?: string
  /** Short summary of what this source holds; helps AutoRAG decide where to look. */
  description?: string
}

export interface Settings {
  language: Language
  followSystemLanguage: boolean
  launchAtLogin: boolean
  /** Names the user goes by in chats, used for "said by me" and promises. */
  myNames: string[]
  shortcuts: ShortcutMap
  globalShortcut: string | null
  sources: Partial<Record<SourceId, SourceSettings>>
  onboarded: boolean
}

export function defaultSettings(language: Language): Settings {
  return {
    language,
    followSystemLanguage: true,
    launchAtLogin: true,
    myNames: [],
    shortcuts: { ...DEFAULT_SHORTCUTS },
    globalShortcut: DEFAULT_GLOBAL_SHORTCUT,
    sources: {},
    onboarded: false
  }
}

/** A partial update: nested maps are merged key by key. */
export type SettingsPatch = Partial<Omit<Settings, 'shortcuts' | 'sources'>> & {
  shortcuts?: Partial<ShortcutMap>
  sources?: Partial<Record<SourceId, SourceSettings>>
}
