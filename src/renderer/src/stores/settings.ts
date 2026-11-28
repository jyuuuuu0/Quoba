import { create } from 'zustand'
import { matchLanguage } from '@shared/i18n'
import type { Settings, SettingsPatch } from '@shared/settings'
import { setLanguage } from '@/i18n'
import { api } from '@/lib/api'

interface SettingsState {
  settings?: Settings
  load: () => Promise<void>
  update: (patch: SettingsPatch) => Promise<void>
}

function applyLanguage(settings: Settings): void {
  void setLanguage(settings.followSystemLanguage ? matchLanguage(navigator.language) : settings.language)
}

export const useSettings = create<SettingsState>((set) => ({
  settings: undefined,
  load: async () => {
    const settings = await api.invoke('settings:get')
    applyLanguage(settings)
    set({ settings })
  },
  update: async (patch) => {
    const settings = await api.invoke('settings:update', patch)
    applyLanguage(settings)
    set({ settings })
  }
}))

api.on('settings:changed', (settings) => {
  applyLanguage(settings)
  useSettings.setState({ settings })
})
