import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SOURCES, type SourceKind } from '@shared/sources'
import { Panel } from '@/components/layout/Panel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useEngine } from '@/stores/engine'
import { useSources } from '@/stores/sources'
import { SourceRow } from './SourceRow'

const GROUPS: SourceKind[] = ['chat', 'mail', 'notes', 'files', 'code', 'web']

export function SourcesScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const probe = useSources((state) => state.probe)
  const probing = useSources((state) => state.probing)
  const probeFailed = useSources((state) => state.probeFailed)
  const status = useEngine((state) => state.status)
  const refresh = useEngine((state) => state.refresh)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    void probe()
  }, [probe])

  const visible = SOURCES.filter((source) => showMore || !source.advanced)

  return (
    <Panel
      title={t('nav.sources')}
      actions={
        <>
          <Button variant="ghost" size="sm" disabled={probing} onClick={() => void probe()}>
            {probing ? <Spinner label={t('sources.checking')} className="size-3" /> : null}
            {t('sources.checkAgain')}
          </Button>
          <Button size="sm" disabled={status.state === 'indexing'} onClick={() => void refresh()}>
            <RefreshCw
              aria-hidden="true"
              size={13}
              className={status.state === 'indexing' ? 'animate-spin' : ''}
            />
            {t('sources.indexNow')}
          </Button>
        </>
      }
    >
      <main className="scroll-thin flex-1 overflow-y-auto px-10 py-8">
        <div className="mx-auto flex max-w-[720px] flex-col gap-8">
          <p className="m-0 text-fg-muted">{t('sources.intro')}</p>
          {probeFailed && (
            <p role="alert" className="m-0 text-sm text-fg-subtle">
              {t('sources.probeFailed')}
            </p>
          )}
          {GROUPS.map((group) => {
            const items = visible.filter((source) => source.kind === group)
            if (items.length === 0) return null
            return (
              <section key={group} className="flex flex-col">
                <h2 className="m-0 mb-1 text-sm font-medium text-fg-subtle">
                  {t(`sources.groups.${group}`)}
                </h2>
                <ul className="m-0 list-none p-0">
                  {items.map((source) => (
                    <SourceRow key={source.id} source={source} />
                  ))}
                </ul>
              </section>
            )
          })}
          {!showMore && (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowMore(true)}>
              {t('sources.showMore')}
            </Button>
          )}
          <p className="m-0 text-xs text-fg-subtle">{t('sources.privacy')}</p>
        </div>
      </main>
    </Panel>
  )
}
