import { Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SOURCES, type SourceId } from '@shared/sources'
import { Chip } from '@/components/ui/Chip'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { useSearch } from '@/stores/search'
import { useSettings } from '@/stores/settings'

const RANGES = ['any', 'week', 'month', 'year'] as const
type Range = (typeof RANGES)[number]

function sinceFor(range: Range): string | undefined {
  const days = { any: 0, week: 7, month: 31, year: 365 }[range]
  return days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined
}

function rangeOf(since: string | undefined): Range {
  if (!since) return 'any'
  const days = (Date.now() - Date.parse(since)) / 86_400_000
  return days <= 8 ? 'week' : days <= 32 ? 'month' : 'year'
}

/** A small popover menu that closes on outside click or Escape. */
function Menu({ label, children }: { label: React.ReactNode; children: React.ReactNode }): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent): void => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !root.current?.contains(event.target as Node)
      )
        setOpen(false)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', close)
    }
  }, [open])
  return (
    <div ref={root} className="relative">
      <Chip aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {label}
        <ChevronDown aria-hidden="true" size={12} className="text-fg-subtle" />
      </Chip>
      {open && (
        <div
          role="menu"
          className="absolute top-8 left-0 z-20 min-w-[200px] rounded-card border border-line-strong bg-raised p-1 shadow-xl shadow-black/40"
        >
          {children}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  checked,
  onSelect,
  children
}: {
  checked: boolean
  onSelect: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onSelect}
      className="flex h-7 w-full items-center gap-2 rounded-control px-2 text-left text-fg-muted hover:bg-hover hover:text-fg"
    >
      {children}
      {checked && <Check aria-hidden="true" size={13} className="ml-auto text-fg" />}
    </button>
  )
}

export function FilterBar({ count }: { count?: number }): React.JSX.Element {
  const { t } = useTranslation()
  const filters = useSearch((state) => state.filters)
  const setFilters = useSearch((state) => state.setFilters)
  const settings = useSettings((state) => state.settings)
  const connected = SOURCES.filter((source) => settings?.sources[source.id]?.enabled)
  const selected = filters.sources ?? []
  const range = rangeOf(filters.since)

  const toggleSource = (id: SourceId): void => {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]
    setFilters({ ...filters, sources: next.length > 0 ? next : undefined })
  }

  const sourceLabel =
    selected.length === 0
      ? t('search.allSources')
      : selected.length === 1
        ? t(`sourceNames.${selected[0]!}`)
        : t('search.nSources', { count: selected.length })

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Menu label={sourceLabel}>
        <MenuItem
          checked={selected.length === 0}
          onSelect={() => setFilters({ ...filters, sources: undefined })}
        >
          {t('search.allSources')}
        </MenuItem>
        {connected.map((source) => (
          <MenuItem
            key={source.id}
            checked={selected.includes(source.id)}
            onSelect={() => toggleSource(source.id)}
          >
            <SourceIcon source={source.id} />
            {t(`sourceNames.${source.id}`)}
          </MenuItem>
        ))}
      </Menu>
      <Menu label={t(`search.range.${range}`)}>
        {RANGES.map((item) => (
          <MenuItem
            key={item}
            checked={range === item}
            onSelect={() => setFilters({ ...filters, since: sinceFor(item) })}
          >
            {t(`search.range.${item}`)}
          </MenuItem>
        ))}
      </Menu>
      <Chip active={filters.saidByMe} onClick={() => setFilters({ ...filters, saidByMe: !filters.saidByMe })}>
        {t('search.saidByMe')}
        {filters.saidByMe && <X aria-hidden="true" size={12} />}
      </Chip>
      {count !== undefined && (
        <span className="ml-auto text-xs text-fg-subtle">{t('search.resultCount', { count })}</span>
      )}
    </div>
  )
}
