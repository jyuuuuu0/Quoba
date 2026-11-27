import clsx from 'clsx'

export interface PanelProps {
  title: React.ReactNode
  /** Secondary text after the title, such as the current query. */
  trail?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** The raised, rounded work area to the right of the sidebar. */
export function Panel({ title, trail, actions, children, className }: PanelProps): React.JSX.Element {
  const isMac = window.quoba.platform === 'darwin'
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel border border-line bg-panel">
      <header
        className="drag flex h-11 shrink-0 items-center gap-2 border-b border-line px-4"
        // Leave room for the Windows and Linux window controls drawn over the top-right corner.
        style={{ paddingRight: isMac ? 16 : 144 }}
      >
        <h1 className="m-0 text-base font-medium">{title}</h1>
        {trail && (
          <>
            <span aria-hidden="true" className="text-fg-faint">
              /
            </span>
            <span className="min-w-0 truncate text-fg-subtle">{trail}</span>
          </>
        )}
        {actions && <div className="no-drag ml-auto flex items-center gap-1">{actions}</div>}
      </header>
      <div className={clsx('flex min-h-0 flex-1', className)}>{children}</div>
    </div>
  )
}
