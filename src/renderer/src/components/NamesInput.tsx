import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/stores/settings'

/** Chips for the names the user goes by, with an input to add more. */
export function NamesInput(): React.JSX.Element {
  const { t } = useTranslation()
  const names = useSettings((state) => state.settings?.myNames ?? [])
  const update = useSettings((state) => state.update)
  const [draft, setDraft] = useState('')
  const add = (): void => {
    const name = draft.trim()
    if (name && !names.includes(name)) void update({ myNames: [...names, name] })
    setDraft('')
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-control border border-line-strong bg-field p-1.5">
      {names.map((name) => (
        <span
          key={name}
          className="inline-flex h-6 items-center gap-1 rounded-control bg-hover pr-1 pl-2 text-sm"
        >
          {name}
          <button
            type="button"
            aria-label={t('settings.general.removeName', { name })}
            onClick={() => void update({ myNames: names.filter((item) => item !== name) })}
            className="text-fg-subtle hover:text-fg"
          >
            <X aria-hidden="true" size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter also confirms IME composition (Korean, Japanese); let that finish first.
          if (event.nativeEvent.isComposing) return
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            add()
          }
        }}
        onBlur={add}
        placeholder={names.length === 0 ? t('settings.general.namesPlaceholder') : ''}
        aria-label={t('settings.general.names')}
        className="h-6 min-w-[120px] flex-1 bg-transparent px-1 text-base outline-none placeholder:text-fg-subtle"
      />
    </div>
  )
}
