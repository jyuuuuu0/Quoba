import { PanelRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Panel } from '@/components/layout/Panel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useShortcut } from '@/lib/shortcuts'
import { useNavigation } from '@/stores/navigation'
import { useSearch } from '@/stores/search'
import { useSettings } from '@/stores/settings'
import { AnswerSection } from './AnswerSection'
import { ContextPanel } from './ContextPanel'
import { FilterBar } from './FilterBar'
import { ResultList } from './ResultList'
import { SearchBar } from './SearchBar'

function Suggestions(): React.JSX.Element {
  const { t } = useTranslation()
  const run = useSearch((state) => state.run)
  const suggestions = t('search.suggestions', { returnObjects: true }) as string[]
  return (
    <div className="mt-6 flex flex-col gap-2">
      <span className="text-xs text-fg-subtle">{t('search.tryAsking')}</span>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              onClick={() => void run(suggestion)}
              className="text-left text-fg-muted hover:text-fg"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Body(): React.JSX.Element {
  const { t } = useTranslation()
  const { hits, loading, error, query, partial } = useSearch()
  const hasSources = useSettings((state) =>
    Object.values(state.settings?.sources ?? {}).some((source) => source?.enabled)
  )
  const go = useNavigation((state) => state.go)

  if (!hasSources) {
    return (
      <div className="mt-6 flex flex-col items-start gap-3">
        <p className="m-0 text-fg-muted">{t('search.noSources')}</p>
        <Button variant="primary" size="sm" onClick={() => go('sources')}>
          {t('sources.add')}
        </Button>
      </div>
    )
  }
  if (loading) return <Spinner label={t('common.loading')} className="mt-6" />
  if (error) return <p className="mt-6 text-fg-muted">{t('search.failed')}</p>
  if (!query) return <Suggestions />
  if (hits.length === 0) return <p className="mt-6 text-fg-muted">{t('search.noResults')}</p>
  return (
    <div className="mt-2 flex flex-col border-t border-line pt-1">
      {partial && <p className="m-0 py-2 text-xs text-fg-subtle">{t('search.partial')}</p>}
      <ResultList />
    </div>
  )
}

export function SearchScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const query = useSearch((state) => state.query)
  const hits = useSearch((state) => state.hits)
  const loading = useSearch((state) => state.loading)
  const contextOpen = useNavigation((state) => state.contextOpen)
  const toggleContext = useNavigation((state) => state.toggleContext)
  const shortcut = useSettings((state) => state.settings?.shortcuts.toggleContext)
  useShortcut(shortcut, toggleContext)

  return (
    <Panel
      title={t('nav.search')}
      trail={query || undefined}
      actions={
        <button
          type="button"
          onClick={() => toggleContext()}
          aria-label={t('context.toggle')}
          aria-pressed={contextOpen}
          className="flex size-7 items-center justify-center rounded-control text-fg-subtle hover:bg-hover hover:text-fg"
        >
          <PanelRight aria-hidden="true" size={15} />
        </button>
      }
    >
      <main className="scroll-thin flex min-w-0 flex-1 flex-col gap-3.5 overflow-y-auto px-7 py-6">
        <SearchBar />
        <FilterBar count={query && !loading ? hits.length : undefined} />
        <AnswerSection />
        <Body />
      </main>
      {contextOpen && <ContextPanel />}
    </Panel>
  )
}
