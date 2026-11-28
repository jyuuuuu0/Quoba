import type { Route } from '@/stores/navigation'
import { PromisesScreen } from './promises/PromisesScreen'
import { SearchScreen } from './search/SearchScreen'
import { SettingsScreen } from './settings/SettingsScreen'
import { SourcesScreen } from './sources/SourcesScreen'
import { TimelineScreen } from './timeline/TimelineScreen'

/** Each screen registers here; a route without a screen shows an empty panel. */
export const screens: Partial<Record<Route, () => React.JSX.Element | null>> = {
  search: SearchScreen,
  sources: SourcesScreen,
  promises: PromisesScreen,
  timeline: TimelineScreen,
  settings: SettingsScreen
}
