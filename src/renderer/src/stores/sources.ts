import { create } from 'zustand'
import type { SourceProbe } from '@shared/engine'
import type { SourceSettings } from '@shared/settings'
import type { SourceId } from '@shared/sources'
import { api } from '@/lib/api'
import { useEngine } from './engine'
import { useSettings } from './settings'

interface SourcesState {
  probes: Partial<Record<SourceId, SourceProbe>>
  probing: boolean
  probe: () => Promise<void>
  save: (id: SourceId, patch: Partial<SourceSettings>) => Promise<void>
  setGithubToken: (token: string | null) => Promise<void>
  pickFolder: () => Promise<string | null>
}

export const useSources = create<SourcesState>((set) => ({
  probes: {},
  probing: false,
  probe: async () => {
    set({ probing: true })
    try {
      const results = await api.invoke('sources:probe')
      set({ probes: Object.fromEntries(results.map((probe) => [probe.id, probe])) })
    } finally {
      set({ probing: false })
    }
  },
  save: async (id, patch) => {
    const current = useSettings.getState().settings?.sources[id] ?? { enabled: false }
    await useSettings.getState().update({ sources: { [id]: { ...current, ...patch } } })
    // Re-index so a newly connected source is searchable right away.
    void useEngine.getState().refresh()
  },
  setGithubToken: async (token) => {
    await api.invoke('sources:setToken', { sourceId: 'github', token })
  },
  pickFolder: () => api.invoke('sources:pickFolder')
}))
