import clsx from 'clsx'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'flex h-[18px] w-[30px] shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50',
        checked ? 'justify-end bg-mint' : 'justify-start bg-line-strong'
      )}
    >
      <span className={clsx('size-3.5 rounded-full', checked ? 'bg-ink' : 'bg-fg-subtle')} />
    </button>
  )
}
