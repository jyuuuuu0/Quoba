import type { Route } from '@/stores/navigation'

/** Each screen registers here; a route without a screen shows an empty panel. */
export const screens: Partial<Record<Route, () => React.JSX.Element>> = {}
