import clsx from 'clsx'

export interface SettingRowProps {
  title: React.ReactNode
  description?: React.ReactNode
  control: React.ReactNode
  htmlFor?: string
  last?: boolean
}

/** One row of a settings list: label and description on the left, control on the right. */
export function SettingRow({
  title,
  description,
  control,
  htmlFor,
  last
}: SettingRowProps): React.JSX.Element {
  return (
    <div className={clsx('flex items-center gap-4 py-3.5', !last && 'border-b border-line')}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {htmlFor ? <label htmlFor={htmlFor}>{title}</label> : <span>{title}</span>}
        {description && <span className="text-sm text-fg-subtle">{description}</span>}
      </div>
      {control}
    </div>
  )
}
