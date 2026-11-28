import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active, className, type = 'button', ...props }: ChipProps): React.JSX.Element {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-6 items-center gap-1 rounded-control border px-2.5 text-sm transition-colors',
        active
          ? 'border-line-strong bg-hover text-fg'
          : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
        className
      )}
      {...props}
    />
  )
}
