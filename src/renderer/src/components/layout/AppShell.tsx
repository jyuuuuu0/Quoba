import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex h-full bg-ink py-2 pr-2 text-fg">
      <Sidebar />
      {children}
    </div>
  )
}
