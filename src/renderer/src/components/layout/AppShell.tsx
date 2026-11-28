import { useEffect } from 'react'
import { useEngine } from '@/stores/engine'
import { usePromises } from '@/stores/promises'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const engineState = useEngine((state) => state.status.state)

  // Load promises once the engine is ready, so the sidebar count is right from launch.
  useEffect(() => {
    const { loaded, loading, load } = usePromises.getState()
    if (engineState === 'ready' && !loaded && !loading) void load()
  }, [engineState])

  return (
    <div className="flex h-full bg-ink py-2 pr-2 text-fg">
      <Sidebar />
      {children}
    </div>
  )
}
