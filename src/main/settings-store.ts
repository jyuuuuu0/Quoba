import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import { isLanguage, matchLanguage } from '@shared/i18n'
import {
  DEFAULT_SHORTCUTS,
  defaultSettings,
  type Settings,
  type SettingsPatch,
  type ShortcutMap
} from '@shared/settings'

/** Settings live in one JSON file in the app's data folder, written atomically. */
export class SettingsStore {
  private readonly path = join(app.getPath('userData'), 'settings.json')
  private value: Settings

  constructor() {
    this.value = this.load()
  }

  get(): Settings {
    return structuredClone(this.value)
  }

  update(patch: SettingsPatch): Settings {
    const next: Settings = {
      ...this.value,
      ...patch,
      shortcuts: { ...this.value.shortcuts, ...patch.shortcuts } as ShortcutMap,
      sources: { ...this.value.sources, ...patch.sources }
    }
    if (!isLanguage(next.language)) next.language = this.value.language
    // Write first: a failed save must not leave unsaved settings in memory.
    this.save(next)
    this.value = next
    return this.get()
  }

  private load(): Settings {
    const defaults = defaultSettings(matchLanguage(app.getLocale()))
    if (!existsSync(this.path)) return defaults
    try {
      const stored = JSON.parse(readFileSync(this.path, 'utf8')) as Partial<Settings>
      return {
        ...defaults,
        ...stored,
        shortcuts: { ...DEFAULT_SHORTCUTS, ...stored.shortcuts },
        sources: { ...stored.sources }
      }
    } catch {
      return defaults
    }
  }

  private save(value: Settings): void {
    mkdirSync(dirname(this.path), { recursive: true })
    const temp = `${this.path}.tmp`
    writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`)
    renameSync(temp, this.path)
  }
}
