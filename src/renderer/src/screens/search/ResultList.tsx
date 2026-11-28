import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { SearchHit } from '@shared/engine'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { formatDateTime } from '@/i18n/format'
import { Highlight } from '@/lib/highlight'
import { useSearch } from '@/stores/search'

function ResultRow({ hit, active }: { hit: SearchHit; active: boolean }): React.JSX.Element {
  const { t } = useTranslation()
  const query = useSearch((state) => state.query)
  const select = useSearch((state) => state.select)
  return (
    <li>
      <button
        type="button"
        onClick={() => select({ kind: 'hit', hit })}
        aria-current={active ? 'true' : undefined}
        className={clsx(
          'flex w-full gap-3 rounded-lg px-2.5 py-3 text-left transition-colors',
          active ? 'bg-raised' : 'hover:bg-raised/60'
        )}
      >
        <SourceIcon source={hit.sourceId} size={18} className="mt-px" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 gap-1.5 text-sm text-fg-subtle">
            <span className="truncate text-fg-muted">{hit.place ?? t(`sourceNames.${hit.sourceId}`)}</span>
            {hit.author && <span className="shrink-0">· {hit.isMe ? t('common.me') : hit.author}</span>}
            {hit.time && <span className="ml-auto shrink-0 pl-2">{formatDateTime(hit.time)}</span>}
          </span>
          <span className="line-clamp-3 text-fg">
            <Highlight text={hit.text} query={query} />
          </span>
        </span>
      </button>
    </li>
  )
}

export function ResultList(): React.JSX.Element {
  const hits = useSearch((state) => state.hits)
  const selection = useSearch((state) => state.selection)
  const activeId = selection?.kind === 'hit' ? selection.hit.id : undefined
  return (
    <ul className="m-0 -mx-2.5 flex list-none flex-col p-0">
      {hits.map((hit) => (
        <ResultRow key={hit.id} hit={hit} active={hit.id === activeId} />
      ))}
    </ul>
  )
}
