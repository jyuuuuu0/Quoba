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

// Every status change gets a sequence number, so a list fetched before the change cannot undo it.
let editSeq = 0
const edits = new Map<string, { seq: number; status: PromiseStatus }>()

export const usePromises = create<PromisesState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  load: async () => {
    set({ loading: true, error: undefined })
    const startedAt = editSeq
    try {
      const items = await api.invoke('promises:list')
      set({
        items: items.map((item) => {
          const edit = edits.get(item.id)
          return edit && edit.seq > startedAt ? { ...item, status: edit.status } : item
        }),
        loaded: true
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      set({ loading: false })
    }
  },
  setStatus: async (id, status) => {
    const previous = get().items.find((item) => item.id === id)?.status
    const seq = ++editSeq
    edits.set(id, { seq, status })
    const apply = (next: PromiseStatus): void =>
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, status: next } : item))
      }))
    apply(status)
    try {
      await api.invoke('promises:setStatus', { id, status })
    } catch {
      // Not saved: show the old status again, unless a newer change has replaced this one.
      if (edits.get(id)?.seq === seq) {
        edits.delete(id)
        if (previous) apply(previous)
      }
    }
  }
}))

export function openPromiseCount(items: PromiseItem[]): number {
  return items.filter((item) => item.status === 'open').length
}
