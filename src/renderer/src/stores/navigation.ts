import { create } from 'zustand'

export type Route = 'search' | 'promises' | 'timeline' | 'sources' | 'settings'

interface NavigationState {
  route: Route
  contextOpen: boolean
  /** Bumped to ask the search box to take focus. */
  searchFocus: number
  go: (route: Route) => void
  focusSearch: () => void
  toggleContext: (open?: boolean) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  route: 'search',
  contextOpen: true,
  searchFocus: 0,
  go: (route) => set({ route }),
  focusSearch: () => set((state) => ({ route: 'search', searchFocus: state.searchFocus + 1 })),
  toggleContext: (open) => set((state) => ({ contextOpen: open ?? !state.contextOpen }))
}))
