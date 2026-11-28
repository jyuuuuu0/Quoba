import clsx from 'clsx'
import { ChevronDown, FolderPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SourceDefinition } from '@shared/sources'
import { Button } from '@/components/ui/Button'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { Switch } from '@/components/ui/Switch'
import { useSettings } from '@/stores/settings'
import { useSources } from '@/stores/sources'

const inputClass =
  'h-[30px] w-full rounded-control border border-line-strong bg-field px-2.5 text-base text-fg outline-none placeholder:text-fg-subtle focus:border-fg-faint'

function Badge({
  tone,
  children
}: {
  tone: 'good' | 'muted' | 'warn'
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs',
        tone === 'good' && 'text-fg-muted',
        tone === 'muted' && 'text-fg-subtle',
        tone === 'warn' && 'text-amber-300/90'
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'size-1.5 rounded-full',
          tone === 'good' && 'bg-mint',
          tone === 'muted' && 'bg-fg-faint',
          tone === 'warn' && 'bg-amber-300/90'
        )}
      />
      {children}
    </span>
  )
}

function FolderList({
  paths,
  onChange,
  multiple
}: {
  paths: string[]
  /** Receives an update that is applied to the latest saved list, not the one shown at click time. */
  onChange: (update: (paths: string[]) => string[]) => void
  multiple: boolean
}): React.JSX.Element {
  const { t } = useTranslation()
  const pickFolder = useSources((state) => state.pickFolder)
  return (
    <div className="flex flex-col gap-1.5">
      {paths.map((path) => (
        <div key={path} className="flex items-center gap-2 rounded-control bg-field px-2.5 py-1.5 text-sm">
          <span data-selectable className="min-w-0 flex-1 truncate text-fg-muted">
            {path}
          </span>
          <button
            type="button"
            aria-label={t('sources.removeFolder')}
            onClick={() => onChange((current) => current.filter((item) => item !== path))}
            className="text-fg-subtle hover:text-fg"
          >
            <X aria-hidden="true" size={13} />
          </button>
        </div>
      ))}
      {(multiple || paths.length === 0) && (
        <Button
          size="sm"
          className="self-start"
          onClick={async () => {
            const folder = await pickFolder()
            if (!folder) return
            onChange((current) =>
              current.includes(folder) ? current : multiple ? [...current, folder] : [folder]
            )
          }}
        >
          <FolderPlus aria-hidden="true" size={13} />
          {t('sources.chooseFolder')}
        </Button>
      )}
    </div>
  )
}

/** Setup fields for sources that need more than a switch. */
function SetupFields({ source }: { source: SourceDefinition }): React.JSX.Element | null {
  const { t } = useTranslation()
  const options = useSettings((state) => state.settings?.sources[source.id]) ?? { enabled: false }
  const save = useSources((state) => state.save)
  const setGithubToken = useSources((state) => state.setGithubToken)
  const [token, setToken] = useState('')
  const [repos, setRepos] = useState((options.repos ?? []).join(', '))
  const [feeds, setFeeds] = useState((options.feeds ?? []).join('\n'))
  const [account, setAccount] = useState(options.account ?? '')

  switch (source.id) {
    case 'files':
    case 'obsidian':
      return (
        <FolderList
          multiple={source.id === 'files'}
          paths={options.paths ?? []}
          onChange={(update) =>
            void save(source.id, (current) => {
              const paths = update(current.paths ?? [])
              return { paths, enabled: paths.length > 0 }
            })
          }
        />
      )
    case 'github':
      return (
        <form
          className="flex flex-col gap-2"
          onSubmit={async (event) => {
            event.preventDefault()
            if (token) await setGithubToken(token)
            setToken('')
            const list = repos.split(/[,\s]+/).filter((repo) => /^[\w.-]+\/[\w.-]+$/.test(repo))
            await save('github', { repos: list, enabled: list.length > 0 })
          }}
        >
          <input
            className={inputClass}
            type="password"
            autoComplete="off"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={t('sources.github.tokenPlaceholder')}
            aria-label={t('sources.github.token')}
          />
          <input
            className={inputClass}
            value={repos}
            onChange={(event) => setRepos(event.target.value)}
            placeholder="owner/repo, owner/another"
            aria-label={t('sources.github.repos')}
          />
          <Button type="submit" size="sm" variant="primary" className="self-start">
            {t('common.save')}
          </Button>
        </form>
      )
    case 'rss':
      return (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const list = feeds.split(/\s+/).filter((url) => /^https?:\/\//.test(url))
            void save('rss', { feeds: list, enabled: list.length > 0 })
          }}
        >
          <textarea
            className={`${inputClass} h-20 py-2`}
            value={feeds}
            onChange={(event) => setFeeds(event.target.value)}
            placeholder="https://example.com/feed.xml"
            aria-label={t('sources.rss.feeds')}
          />
          <Button type="submit" size="sm" variant="primary" className="self-start">
            {t('common.save')}
          </Button>
        </form>
      )
    case 'mail':
      return (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void save('mail', { account: account.trim() || 'default' })
          }}
        >
          <input
            className={inputClass}
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder={t('sources.mail.accountPlaceholder')}
            aria-label={t('sources.mail.account')}
          />
          <Button type="submit" size="sm">
            {t('common.save')}
          </Button>
        </form>
      )
    default:
      return null
  }
}

export function SourceRow({ source }: { source: SourceDefinition }): React.JSX.Element {
  const { t } = useTranslation()
  const options = useSettings((state) => state.settings?.sources[source.id])
  const probe = useSources((state) => state.probes[source.id])
  const save = useSources((state) => state.save)
  const [open, setOpen] = useState(false)
  const enabled = options?.enabled === true

  const needsTool = source.setup === 'cli' && probe?.state === 'missing-tool'
  // The tool is installed but still needs a step of its own (for example signing in).
  const needsSetup = source.setup === 'cli' && probe?.state === 'needs-setup'
  const hasFields = source.setup !== 'cli' || source.id === 'mail'
  // Folder, repo and feed sources can be switched off without losing what was entered.
  const hasConfig =
    (options?.paths?.length ?? 0) + (options?.repos?.length ?? 0) + (options?.feeds?.length ?? 0) > 0
  let badge: React.ReactNode = null
  // A failed check wins over "enabled": the switch only says the source is selected, not that it works.
  if (needsTool) badge = <Badge tone="warn">{t('sources.state.needsTool', { tool: source.cli })}</Badge>
  else if (probe?.state === 'error' || probe?.state === 'needs-setup')
    badge = <Badge tone="warn">{t('sources.state.error')}</Badge>
  else if (enabled) badge = <Badge tone="good">{t('sources.state.connected')}</Badge>
  else if (probe?.state === 'ready') badge = <Badge tone="muted">{t('sources.state.ready')}</Badge>

  return (
    <li className="border-b border-line last:border-b-0">
      <div className="flex items-center gap-3 py-3">
        <SourceIcon source={source.id} size={20} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            {t(`sourceNames.${source.id}`)}
            {badge}
          </span>
          <span className="truncate text-sm text-fg-subtle">{t(`sources.about.${source.id}`)}</span>
        </div>
        {(hasFields || needsTool || needsSetup) && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 rounded-control px-2 py-1 text-sm text-fg-muted hover:bg-hover hover:text-fg"
          >
            {needsTool || needsSetup ? t('sources.howToConnect') : t('sources.configure')}
            <ChevronDown
              aria-hidden="true"
              size={13}
              className={clsx('transition-transform', open && 'rotate-180')}
            />
          </button>
        )}
        {(source.setup === 'cli' || hasConfig) && (
          <Switch
            checked={enabled}
            disabled={!enabled && needsTool}
            label={t('sources.toggle', { name: t(`sourceNames.${source.id}`) })}
            onChange={(checked) => void save(source.id, { enabled: checked })}
          />
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-3 pb-4 pl-8">
          {needsTool && (
            <div className="flex flex-col gap-1.5 text-sm text-fg-muted">
              <p className="m-0">{t('sources.installHelp', { tool: source.cli })}</p>
              {source.cliPackage && (
                <code data-selectable className="self-start rounded-control bg-field px-2 py-1 text-fg">
                  npm install -g {source.cliPackage}
                </code>
              )}
              {probe?.detail && <p className="m-0 text-xs text-fg-subtle">{probe.detail}</p>}
            </div>
          )}
          {needsSetup && (
            <div className="flex flex-col gap-1.5 text-sm text-fg-muted">
              <p className="m-0">{t('sources.setupHelp', { tool: source.cli })}</p>
              {probe?.detail && <p className="m-0 text-xs text-fg-subtle">{probe.detail}</p>}
            </div>
          )}
          {hasFields && <SetupFields source={source} />}
        </div>
      )}
    </li>
  )
}
