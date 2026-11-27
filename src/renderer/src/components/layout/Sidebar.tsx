import clsx from 'clsx'
import { CircleCheck, Plus, Search, Settings, Waypoints } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SOURCES } from '@shared/sources'
import logo from '@/assets/quoba-logo.png'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { formatRelative } from '@/i18n/format'
import { useEngine } from '@/stores/engine'
import { useNavigation, type Route } from '@/stores/navigation'
import { openPromiseCount, usePromises } from '@/stores/promises'
import { useSettings } from '@/stores/settings'

interface NavItemProps {
  route: Route
  icon: typeof Search
  label: string
  hint?: React.ReactNode
}

function NavItem({ route, icon: Icon, label, hint }: NavItemProps): React.JSX.Element {
  const active = useNavigation((state) => state.route === route)
  const go = useNavigation((state) => state.go)
  return (
    <button
      type="button"
      onClick={() => go(route)}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'no-drag flex h-7 w-full items-center gap-2.5 rounded-control px-2 text-left transition-colors',
        active ? 'bg-hover font-medium text-fg' : 'text-fg-muted hover:bg-hover/60 hover:text-fg'
      )}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2} />
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
    </button>
  )
}

function IndexStatus(): React.JSX.Element {
  const { t } = useTranslation()
  const status = useEngine((state) => state.status)
  let dot = 'bg-mint'
  let label: string = t('status.upToDate')
  if (status.state === 'indexing') {
    dot = 'bg-fg-subtle animate-pulse'
    label = status.progress
      ? t('status.indexingProgress', { processed: status.progress.processed, total: status.progress.total })
      : t('status.indexing')
  } else if (status.state === 'error') {
    dot = 'bg-red-400'
    label = t('status.error')
  } else if (status.state === 'starting') {
    dot = 'bg-fg-faint'
    label = t('status.starting')
  } else if (status.lastIndexedAt) {
    label = t('status.indexedAt', { time: formatRelative(status.lastIndexedAt) })
  }
  return (
    <div className="flex items-center gap-2 px-2 pb-1 text-xs text-fg-subtle" role="status">
      <span aria-hidden="true" className={clsx('size-1.5 rounded-full', dot)} />
      <span className="truncate">{label}</span>
    </div>
  )
}

export function Sidebar(): React.JSX.Element {
  const { t } = useTranslation()
  const settings = useSettings((state) => state.settings)
  const go = useNavigation((state) => state.go)
  const isMac = window.quoba.platform === 'darwin'
  const connected = SOURCES.filter((source) => settings?.sources[source.id]?.enabled)
  const openPromises = usePromises((state) => openPromiseCount(state.items))

  return (
    <aside
      className="drag flex w-[216px] shrink-0 flex-col gap-5 px-3 pb-2"
      style={{ paddingTop: isMac ? 40 : 12 }}
    >
      <div className="flex h-8 items-center gap-2 px-1.5">
        <img src={logo} alt="" className="size-5 object-contain" />
        <span className="text-md font-semibold tracking-tight">{t('app.name')}</span>
      </div>

      <nav aria-label={t('nav.label')} className="flex flex-col gap-px">
        <NavItem route="search" icon={Search} label={t('nav.search')} hint={isMac ? '⌘K' : 'Ctrl K'} />
        <NavItem
          route="promises"
          icon={CircleCheck}
          label={t('nav.promises')}
          hint={openPromises > 0 ? openPromises : undefined}
        />
        <NavItem route="timeline" icon={Waypoints} label={t('nav.timeline')} />
      </nav>

      <section aria-label={t('nav.sources')} className="flex min-h-0 flex-col gap-px">
        <div className="flex items-center px-2 pb-1.5 text-xs text-fg-subtle">
          <span className="flex-1">{t('nav.sources')}</span>
          <button
            type="button"
            onClick={() => go('sources')}
            aria-label={t('sources.add')}
            className="no-drag rounded p-0.5 hover:bg-hover hover:text-fg"
          >
            <Plus size={12} aria-hidden="true" />
          </button>
        </div>
        <div className="scroll-thin flex flex-col gap-px overflow-y-auto">
          {connected.length === 0 && (
            <button
              type="button"
              onClick={() => go('sources')}
              className="no-drag px-2 py-1 text-left text-sm text-fg-subtle hover:text-fg"
            >
              {t('sources.emptySidebar')}
            </button>
          )}
          {connected.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => go('sources')}
              className="no-drag flex h-[26px] items-center gap-2.5 rounded-control px-2 text-left text-fg-muted hover:bg-hover/60 hover:text-fg"
            >
              <SourceIcon source={source.id} />
              <span className="truncate">{t(`sourceNames.${source.id}`)}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-1">
        <IndexStatus />
        <NavItem route="settings" icon={Settings} label={t('nav.settings')} />
      </div>
    </aside>
  )
}
