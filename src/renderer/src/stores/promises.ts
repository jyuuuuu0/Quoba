import { create } from 'zustand'
import type { PromiseItem, PromiseStatus } from '@shared/engine'
import { api } from '@/lib/api'

interface PromisesState {
  items: PromiseItem[]
  loading: boolean
  loaded: boolean
  error?: string
  load: () => Promise<void>
  setStatus: (id: string, status: PromiseStatus) => Promise<void>
}

export const usePromises = create<PromisesState>((set) => ({
  items: [],
  loading: false,
  loaded: false,
  load: async () => {
    set({ loading: true, error: undefined })
    try {
      set({ items: await api.invoke('promises:list'), loaded: true })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      set({ loading: false })
    }
  },
  setStatus: async (id, status) => {
    set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, status } : item)) }))
    await api.invoke('promises:setStatus', { id, status })
  }
}))

export function openPromiseCount(items: PromiseItem[]): number {
  return items.filter((item) => item.status === 'open').length
}
