import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  onChange: (value: string) => void
}

export function Select({ options, onChange, className, ...props }: SelectProps): React.JSX.Element {
  return (
    <span className={clsx('relative inline-flex', className)}>
      <select
        className="h-[30px] w-full min-w-[150px] appearance-none rounded-control border border-line-strong bg-field pr-8 pl-2.5 text-base text-fg outline-none focus-visible:border-fg-faint"
        onChange={(event) => onChange(event.target.value)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-fg-subtle"
      />
    </span>
  )
}
