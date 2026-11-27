import { create } from 'zustand'
import type { AnswerCitation, AnswerErrorCode, SearchFilters, SearchHit } from '@shared/engine'
import { api } from '@/lib/api'
import { useEngine } from './engine'

export type Selection = { kind: 'hit'; hit: SearchHit } | { kind: 'citation'; citation: AnswerCitation }

export interface AnswerState {
  requestId?: string
  phase: 'idle' | 'thinking' | 'preliminary' | 'complete' | 'error'
  text: string
  progress?: string
  citations: AnswerCitation[]
  error?: AnswerErrorCode
}

interface SearchState {
  query: string
  filters: SearchFilters
  hits: SearchHit[]
  partial: boolean
  loading: boolean
  error?: string
  answer: AnswerState
  selection?: Selection
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  select: (selection?: Selection) => void
  run: (query?: string) => Promise<void>
}

const idleAnswer: AnswerState = { phase: 'idle', text: '', citations: [] }

export const useSearch = create<SearchState>((set, get) => ({
  query: '',
  filters: {},
  hits: [],
  partial: false,
  loading: false,
  answer: idleAnswer,
  setQuery: (query) => set({ query }),
  setFilters: (filters) => {
    set({ filters })
    if (get().query.trim()) void get().run()
  },
  select: (selection) => set({ selection }),
  run: async (nextQuery) => {
    const query = (nextQuery ?? get().query).trim()
    if (!query) return
    const previous = get().answer.requestId
    if (previous) void api.invoke('answer:cancel', { requestId: previous })
    set({ query, loading: true, error: undefined, selection: undefined, answer: idleAnswer })

    const request = { query, filters: get().filters }
    // Search results never need sign-in; the AI answer starts alongside them when signed in.
    if (useEngine.getState().auth.signedIn) {
      set({ answer: { ...idleAnswer, phase: 'thinking' } })
      api
        .invoke('answer:start', request)
        .then(({ requestId }) => set((state) => ({ answer: { ...state.answer, requestId } })))
        .catch(() => set({ answer: { ...idleAnswer, phase: 'error', error: 'unknown' } }))
    }

    try {
      const response = await api.invoke('search:run', request)
      if (get().query !== query) return
      set({
        hits: response.hits,
        partial: response.unsearched.length > 0,
        loading: false,
        selection: response.hits[0] ? { kind: 'hit', hit: response.hits[0] } : undefined
      })
    } catch (error) {
      set({ loading: false, hits: [], error: error instanceof Error ? error.message : String(error) })
    }
  }
}))

api.on('answer', ({ requestId, event }) => {
  const { answer } = useSearch.getState()
  if (answer.requestId !== requestId) return
  switch (event.type) {
    case 'progress':
      useSearch.setState({ answer: { ...answer, progress: event.text } })
      break
    case 'preliminary':
    case 'complete':
      useSearch.setState({
        answer: {
          ...answer,
          phase: event.type,
          text: event.answer,
          citations: event.citations,
          progress: undefined
        }
      })
      break
    case 'error':
      useSearch.setState({ answer: { ...answer, phase: 'error', error: event.code, progress: undefined } })
      break
  }
})
