import { Search } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useShortcut } from '@/lib/shortcuts'
import { useSearch } from '@/stores/search'
import { useSettings } from '@/stores/settings'

export function SearchBar(): React.JSX.Element {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const query = useSearch((state) => state.query)
  const setQuery = useSearch((state) => state.setQuery)
  const run = useSearch((state) => state.run)
  const shortcut = useSettings((state) => state.settings?.shortcuts.search)

  const focus = useCallback(() => {
    input.current?.focus()
    input.current?.select()
  }, [])
  useShortcut(shortcut, focus)

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        void run()
      }}
      className="flex h-[38px] items-center gap-2.5 rounded-lg border border-line-strong bg-field px-3 focus-within:border-fg-faint"
    >
      <Search aria-hidden="true" size={14} className="text-fg-subtle" />
      <input
        ref={input}
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.label')}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-fg outline-none placeholder:text-fg-subtle"
      />
    </form>
  )
}
