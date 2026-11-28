import clsx from 'clsx'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_NAMES, LANGUAGES, type Language } from '@shared/i18n'
import {
  DEFAULT_GLOBAL_SHORTCUT,
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTIONS,
  type ShortcutAction
} from '@shared/settings'
import { Panel } from '@/components/layout/Panel'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { SettingRow } from '@/components/ui/SettingRow'
import { Switch } from '@/components/ui/Switch'
import { useEngine } from '@/stores/engine'
import { useSettings } from '@/stores/settings'
import { ShortcutRecorder } from './ShortcutRecorder'

const SECTIONS = ['general', 'account', 'shortcuts', 'privacy'] as const

function Section({
  id,
  title,
  children
}: {
  id: string
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section id={`settings-${id}`} className="flex scroll-mt-6 flex-col">
      <h2 className="m-0 mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

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

export function SettingsScreen(): React.JSX.Element | null {
  const { t } = useTranslation()
  const settings = useSettings((state) => state.settings)
  const update = useSettings((state) => state.update)
  const auth = useEngine((state) => state.auth)
  const signingIn = useEngine((state) => state.signingIn)
  const signIn = useEngine((state) => state.signIn)
  const cancelSignIn = useEngine((state) => state.cancelSignIn)
  const signOut = useEngine((state) => state.signOut)
  const [active, setActive] = useState<(typeof SECTIONS)[number]>('general')
  if (!settings) return null

  const allShortcuts = [...Object.values(settings.shortcuts), settings.globalShortcut].filter(
    (value): value is string => Boolean(value)
  )
  const takenExcept = (current: string | null): string[] => allShortcuts.filter((value) => value !== current)

  return (
    <Panel title={t('nav.settings')}>
      <nav
        aria-label={t('nav.settings')}
        className="flex w-48 shrink-0 flex-col gap-px border-r border-line p-3"
      >
        {SECTIONS.map((section) => (
          <a
            key={section}
            href={`#settings-${section}`}
            onClick={() => setActive(section)}
            className={clsx(
              'flex h-7 items-center rounded-control px-2 no-underline',
              active === section ? 'bg-hover font-medium text-fg' : 'text-fg-muted hover:text-fg'
            )}
          >
            {t(`settings.sections.${section}`)}
          </a>
        ))}
      </nav>
      <main className="scroll-thin flex-1 overflow-y-auto px-10 py-8">
        <div className="flex max-w-[640px] flex-col gap-10">
          <Section id="general" title={t('settings.sections.general')}>
            <SettingRow
              title={t('language.label')}
              description={t('settings.general.languageHelp')}
              htmlFor="settings-language"
              control={
                <Select
                  id="settings-language"
                  value={settings.language}
                  disabled={settings.followSystemLanguage}
                  options={LANGUAGES.map((language) => ({
                    value: language,
                    label: LANGUAGE_NAMES[language]
                  }))}
                  onChange={(language) => void update({ language: language as Language })}
                />
              }
            />
            <SettingRow
              title={t('settings.general.followSystem')}
              description={t('settings.general.followSystemHelp')}
              control={
                <Switch
                  checked={settings.followSystemLanguage}
                  label={t('settings.general.followSystem')}
                  onChange={(followSystemLanguage) => void update({ followSystemLanguage })}
                />
              }
            />
            <SettingRow
              title={t('settings.general.launchAtLogin')}
              description={t('settings.general.launchAtLoginHelp')}
              control={
                <Switch
                  checked={settings.launchAtLogin}
                  label={t('settings.general.launchAtLogin')}
                  onChange={(launchAtLogin) => void update({ launchAtLogin })}
                />
              }
            />
            <div className="flex flex-col gap-2 py-3.5">
              <span>{t('settings.general.names')}</span>
              <span className="text-sm text-fg-subtle">{t('settings.general.namesHelp')}</span>
              <NamesInput />
            </div>
          </Section>

          <Section id="account" title={t('settings.sections.account')}>
            <SettingRow
              title={auth.signedIn ? t('settings.account.signedIn') : t('settings.account.signedOut')}
              description={
                auth.signedIn
                  ? [auth.email, t('settings.account.signedInHelp')].filter(Boolean).join(' · ')
                  : t('settings.account.signedOutHelp')
              }
              control={
                auth.signedIn ? (
                  <Button size="sm" onClick={() => void signOut()}>
                    {t('settings.account.signOut')}
                  </Button>
                ) : signingIn ? (
                  <Button size="sm" onClick={() => void cancelSignIn()}>
                    {t('common.cancel')}
                  </Button>
                ) : (
                  <Button size="sm" variant="primary" onClick={() => void signIn()}>
                    {t('answer.signIn')}
                  </Button>
                )
              }
            />
            <SettingRow
              last
              title={t('settings.account.cli')}
              description={t('settings.account.cliHelp')}
              control={null}
            />
          </Section>

          <Section id="shortcuts" title={t('settings.sections.shortcuts')}>
            <SettingRow
              title={t('settings.shortcuts.global')}
              description={t('settings.shortcuts.globalHelp')}
              control={
                <ShortcutRecorder
                  label={t('settings.shortcuts.global')}
                  value={settings.globalShortcut}
                  taken={takenExcept(settings.globalShortcut)}
                  onChange={(globalShortcut) => update({ globalShortcut })}
                />
              }
            />
            {SHORTCUT_ACTIONS.map((action: ShortcutAction) => (
              <SettingRow
                key={action}
                title={t(`settings.shortcuts.actions.${action}`)}
                control={
                  <ShortcutRecorder
                    label={t(`settings.shortcuts.actions.${action}`)}
                    value={settings.shortcuts[action]}
                    taken={takenExcept(settings.shortcuts[action])}
                    onChange={(accelerator) => void update({ shortcuts: { [action]: accelerator } })}
                  />
                }
              />
            ))}
            <div className="flex items-center gap-3 pt-3 text-sm text-fg-subtle">
              <span className="flex-1">{t('settings.shortcuts.help')}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void update({ shortcuts: DEFAULT_SHORTCUTS, globalShortcut: DEFAULT_GLOBAL_SHORTCUT })
                }
              >
                {t('settings.shortcuts.reset')}
              </Button>
            </div>
          </Section>

          <Section id="privacy" title={t('settings.sections.privacy')}>
            <p className="m-0 text-fg-muted">{t('settings.privacy.local')}</p>
            <p className="m-0 mt-2 text-fg-muted">{t('settings.privacy.ai')}</p>
            <p className="m-0 mt-2 text-fg-muted">{t('settings.privacy.tokens')}</p>
          </Section>
        </div>
      </main>
    </Panel>
  )
}
