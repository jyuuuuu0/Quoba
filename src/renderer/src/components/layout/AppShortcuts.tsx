import { useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { useShortcut } from '@/lib/shortcuts'
import { useNavigation } from '@/stores/navigation'
import { useSearch } from '@/stores/search'
import { useSettings } from '@/stores/settings'

/** In-app keyboard shortcuts from settings, plus the global "open Quoba" shortcut from the main process. */
export function AppShortcuts(): null {
  const shortcuts = useSettings((state) => state.settings?.shortcuts)
  const go = useNavigation((state) => state.go)
  const focusSearch = useNavigation((state) => state.focusSearch)

  const toggleSaidByMe = useCallback(() => {
    const { filters, setFilters } = useSearch.getState()
    setFilters({ ...filters, saidByMe: !filters.saidByMe })
    go('search')
  }, [go])

  useShortcut(shortcuts?.search, focusSearch)
  useShortcut(
    shortcuts?.goPromises,
    useCallback(() => go('promises'), [go])
  )
  useShortcut(
    shortcuts?.goTimeline,
    useCallback(() => go('timeline'), [go])
  )
  useShortcut(
    shortcuts?.goSources,
    useCallback(() => go('sources'), [go])
  )
  useShortcut(shortcuts?.filterSaidByMe, toggleSaidByMe)

  useEffect(
    () =>
      api.on('shortcut', ({ action }) => {
        if (action === 'search') focusSearch()
      }),
    [focusSearch]
  )
  return null
}
