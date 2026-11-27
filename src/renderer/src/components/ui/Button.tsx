import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-fg text-ink hover:bg-white font-medium',
  secondary: 'border border-line-strong text-fg-muted hover:bg-hover hover:text-fg',
  ghost: 'text-fg-muted hover:bg-hover hover:text-fg'
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-sm',
  md: 'h-8 px-3 text-base'
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-control transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
