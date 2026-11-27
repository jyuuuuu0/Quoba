import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SearchHit } from '@shared/engine'
import { Panel } from '@/components/layout/Panel'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { Spinner } from '@/components/ui/Spinner'
import { formatDay, formatTime } from '@/i18n/format'
import { api } from '@/lib/api'
import { Highlight } from '@/lib/highlight'

function dayKey(time: string): string {
  const date = new Date(time)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/** Everything said about one topic, oldest first, grouped by day: who said what, and when it changed. */
export function TimelineScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const run = async (): Promise<void> => {
    const text = query.trim()
    if (!text) return
    setLoading(true)
    setFailed(false)
    setTopic(text)
    try {
      const response = await api.invoke('search:run', { query: text, limit: 120 })
      setHits(response.hits.filter((hit) => hit.time).sort((a, b) => a.time!.localeCompare(b.time!)))
    } catch {
      setFailed(true)
      setHits([])
    } finally {
      setLoading(false)
    }
  }

  const days: { key: string; hits: SearchHit[] }[] = []
  for (const hit of hits) {
    const key = dayKey(hit.time!)
    const last = days.at(-1)
    if (last?.key === key) last.hits.push(hit)
    else days.push({ key, hits: [hit] })
  }

  return (
    <Panel title={t('nav.timeline')} trail={topic || undefined}>
      <main className="scroll-thin flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto flex max-w-[720px] flex-col gap-6">
          <p className="m-0 text-fg-muted">{t('timeline.intro')}</p>
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
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('timeline.placeholder')}
              aria-label={t('timeline.label')}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-fg-subtle"
            />
          </form>
          {loading && <Spinner label={t('common.loading')} />}
          {failed && <p className="m-0 text-fg-muted">{t('search.failed')}</p>}
          {!loading && topic && hits.length === 0 && !failed && (
            <p className="m-0 text-fg-subtle">{t('timeline.empty')}</p>
          )}
          <ol className="m-0 flex list-none flex-col gap-6 p-0">
            {days.map((day) => (
              <li key={day.key} className="flex flex-col gap-2">
                <h2 className="m-0 text-sm font-medium text-fg-subtle">{formatDay(day.hits[0]!.time!)}</h2>
                <ol className="m-0 flex list-none flex-col border-l border-line p-0">
                  {day.hits.map((hit) => (
                    <li key={hit.id} className="relative flex gap-3 py-2 pl-5">
                      <span
                        aria-hidden="true"
                        className={clsx(
                          'absolute top-3.5 -left-[4px] size-[7px] rounded-full',
                          hit.isMe ? 'bg-mint' : 'bg-fg-faint'
                        )}
                      />
                      <span className="w-11 shrink-0 pt-px text-xs text-fg-subtle">
                        {formatTime(hit.time!)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
                          <SourceIcon source={hit.sourceId} size={12} />
                          <span className={hit.isMe ? 'text-fg' : 'text-fg-muted'}>
                            {hit.isMe ? t('common.me') : (hit.author ?? t(`sourceNames.${hit.sourceId}`))}
                          </span>
                          {hit.place && <span className="truncate">· {hit.place}</span>}
                        </span>
                        <p data-selectable className="m-0 line-clamp-4">
                          <Highlight text={hit.text} query={topic} />
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </Panel>
  )
}
