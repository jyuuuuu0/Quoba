import clsx from 'clsx'
import { Check, RefreshCw, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { PromiseItem } from '@shared/engine'
import { Panel } from '@/components/layout/Panel'
import { Button } from '@/components/ui/Button'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime, formatDay } from '@/i18n/format'
import { useNavigation } from '@/stores/navigation'
import { usePromises } from '@/stores/promises'
import { useSettings } from '@/stores/settings'

type Group = 'overdue' | 'thisWeek' | 'later' | 'noDate' | 'done'

function groupOf(item: PromiseItem, now: number): Group {
  if (item.status === 'done') return 'done'
  if (!item.due) return 'noDate'
  const due = Date.parse(item.due)
  if (due < now) return 'overdue'
  return due - now <= 7 * 86_400_000 ? 'thisWeek' : 'later'
}

function PromiseRow({ item }: { item: PromiseItem }): React.JSX.Element {
  const { t } = useTranslation()
  const setStatus = usePromises((state) => state.setStatus)
  const done = item.status === 'done'
  return (
    <li className="group flex items-start gap-3 border-b border-line py-3 last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={t('promises.markDone')}
        onClick={() => void setStatus(item.id, done ? 'open' : 'done')}
        className={clsx(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          done ? 'border-mint bg-mint text-ink' : 'border-line-strong hover:border-fg-subtle'
        )}
      >
        {done && <Check aria-hidden="true" size={11} strokeWidth={3} />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p data-selectable className={clsx('m-0', done ? 'text-fg-subtle line-through' : 'text-fg')}>
          {item.hit.text}
        </p>
        <span className="flex items-center gap-1.5 text-sm text-fg-subtle">
          <SourceIcon source={item.hit.sourceId} size={12} />
          <span className="truncate">{item.hit.place ?? t(`sourceNames.${item.hit.sourceId}`)}</span>
          {item.hit.time && <span>· {formatDateTime(item.hit.time)}</span>}
        </span>
      </div>
      {item.due && !done && (
        <span className="shrink-0 rounded-control border border-line px-1.5 text-xs text-fg-muted">
          {t('promises.due', { date: formatDay(item.due) })}
        </span>
      )}
      <button
        type="button"
        onClick={() => void setStatus(item.id, 'dismissed')}
        aria-label={t('promises.dismiss')}
        title={t('promises.dismiss')}
        className="shrink-0 rounded p-0.5 text-fg-subtle opacity-0 group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
      >
        <X aria-hidden="true" size={14} />
      </button>
    </li>
  )
}

export function PromisesScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const { items, loading, loaded, error, load } = usePromises()
  const hasNames = useSettings((state) => (state.settings?.myNames.length ?? 0) > 0)
  const go = useNavigation((state) => state.go)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const now = Date.now()
  const visible = items.filter((item) => item.status !== 'dismissed')
  const groups: Group[] = ['overdue', 'thisWeek', 'later', 'noDate', 'done']

  return (
    <Panel
      title={t('nav.promises')}
      actions={
        <Button size="sm" variant="ghost" disabled={loading} onClick={() => void load()}>
          <RefreshCw aria-hidden="true" size={13} className={loading ? 'animate-spin' : ''} />
          {t('promises.scan')}
        </Button>
      }
    >
      <main className="scroll-thin flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto flex max-w-[720px] flex-col gap-7">
          <p className="m-0 text-fg-muted">{t('promises.intro')}</p>
          {!hasNames && (
            <div className="flex items-center gap-3 rounded-card border border-line px-4 py-3">
              <span className="flex-1 text-fg-muted">{t('promises.needNames')}</span>
              <Button size="sm" onClick={() => go('settings')}>
                {t('promises.addNames')}
              </Button>
            </div>
          )}
          {loading && !loaded && <Spinner label={t('common.loading')} />}
          {error && <p className="m-0 text-fg-muted">{t('promises.failed')}</p>}
          {loaded && visible.length === 0 && hasNames && (
            <p className="m-0 text-fg-subtle">{t('promises.empty')}</p>
          )}
          {groups.map((group) => {
            const list = visible
              .filter((item) => groupOf(item, now) === group)
              .sort((a, b) => (a.due ?? a.hit.time ?? '').localeCompare(b.due ?? b.hit.time ?? ''))
            if (list.length === 0) return null
            return (
              <section key={group} className="flex flex-col">
                <h2 className="m-0 mb-1 flex items-center gap-2 text-sm font-medium text-fg-subtle">
                  {t(`promises.groups.${group}`)}
                  <span className="font-normal">{list.length}</span>
                </h2>
                <ul className="m-0 list-none p-0">
                  {list.map((item) => (
                    <PromiseRow key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </main>
    </Panel>
  )
}
