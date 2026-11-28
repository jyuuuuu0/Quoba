import { create } from 'zustand'
import type { SourceProbe } from '@shared/engine'
import type { SourceSettings } from '@shared/settings'
import type { SourceId } from '@shared/sources'
import { api } from '@/lib/api'
import { useEngine } from './engine'
import { useSettings } from './settings'

type SourcePatch = Partial<SourceSettings> | ((current: SourceSettings) => Partial<SourceSettings>)

interface SourcesState {
  probes: Partial<Record<SourceId, SourceProbe>>
  probing: boolean
  probeFailed: boolean
  probe: () => Promise<void>
  /** Saves run one after another, each against the latest settings, so quick changes never undo each other. */
  save: (id: SourceId, patch: SourcePatch) => Promise<void>
  setGithubToken: (token: string | null) => Promise<void>
  pickFolder: () => Promise<string | null>
}

let latestProbe = 0
let saveQueue: Promise<void> = Promise.resolve()

export const useSources = create<SourcesState>((set) => ({
  probes: {},
  probing: false,
  probeFailed: false,
  probe: async () => {
    const request = ++latestProbe
    set({ probing: true })
    try {
      const results = await api.invoke('sources:probe')
      if (request !== latestProbe) return
      set({ probes: Object.fromEntries(results.map((probe) => [probe.id, probe])), probeFailed: false })
    } catch {
      if (request === latestProbe) set({ probeFailed: true })
    } finally {
      if (request === latestProbe) set({ probing: false })
    }
  },
  save: (id, patch) => {
    const task = saveQueue.then(async () => {
      const current = useSettings.getState().settings?.sources[id] ?? { enabled: false }
      const changes = typeof patch === 'function' ? patch(current) : patch
      await useSettings.getState().update({ sources: { [id]: { ...current, ...changes } } })
      // Re-index so a newly connected source is searchable right away.
      void useEngine.getState().refresh()
    })
    saveQueue = task.catch(() => undefined)
    return task
  },
  setGithubToken: async (token) => {
    await api.invoke('sources:setToken', { sourceId: 'github', token })
  },
  pickFolder: () => api.invoke('sources:pickFolder')
}))
