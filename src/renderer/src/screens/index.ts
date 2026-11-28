import type { Route } from '@/stores/navigation'
import { SearchScreen } from './search/SearchScreen'
import { SourcesScreen } from './sources/SourcesScreen'

/** Each screen registers here; a route without a screen shows an empty panel. */
export const screens: Partial<Record<Route, () => React.JSX.Element>> = {
  search: SearchScreen,
  sources: SourcesScreen
}
