import clsx from 'clsx'

export function Spinner({ className, label }: { className?: string; label: string }): React.JSX.Element {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx(
        'inline-block size-3.5 animate-spin rounded-full border-2 border-line-strong border-t-fg-muted',
        className
      )}
    />
  )
}
