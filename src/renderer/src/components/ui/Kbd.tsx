import clsx from 'clsx'

export function Kbd({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <kbd
      className={clsx(
        'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[5px] border border-line-strong bg-hover px-1.5 font-sans text-xs text-fg',
        className
      )}
    >
      {children}
    </kbd>
  )
}

/** Renders an accelerator such as "CommandOrControl+K" as separate keys. */
export function Shortcut({ accelerator }: { accelerator: string }): React.JSX.Element {
  const isMac = window.quoba?.platform === 'darwin'
  const keys = accelerator.split('+').map((key) => {
    switch (key) {
      case 'CommandOrControl':
        return isMac ? '⌘' : 'Ctrl'
      case 'Alt':
        return isMac ? '⌥' : 'Alt'
      case 'Shift':
        return isMac ? '⇧' : 'Shift'
      case 'Control':
        return isMac ? '⌃' : 'Ctrl'
      case 'Enter':
        return '↵'
      default:
        return key
    }
  })
  return (
    <span className="inline-flex gap-1">
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`}>{key}</Kbd>
      ))}
    </span>
  )
}
