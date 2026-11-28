import { create } from 'zustand'

export type Route = 'search' | 'promises' | 'timeline' | 'sources' | 'settings'

interface NavigationState {
  route: Route
  contextOpen: boolean
  go: (route: Route) => void
  toggleContext: (open?: boolean) => void
}

export const useNavigation = create<NavigationState>((set) => ({
  route: 'search',
  contextOpen: true,
  go: (route) => set({ route }),
  toggleContext: (open) => set((state) => ({ contextOpen: open ?? !state.contextOpen }))
}))
