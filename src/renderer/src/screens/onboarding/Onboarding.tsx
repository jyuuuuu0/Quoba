import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_NAMES, LANGUAGES, type Language } from '@shared/i18n'
import { SOURCES } from '@shared/sources'
import logo from '@/assets/quoba-logo.png'
import { NamesInput } from '@/components/NamesInput'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useEngine } from '@/stores/engine'
import { useSettings } from '@/stores/settings'
import { useSources } from '@/stores/sources'
import { SourceRow } from '../sources/SourceRow'

const STEPS = ['welcome', 'names', 'sources', 'ai'] as const
type Step = (typeof STEPS)[number]

function Welcome(): React.JSX.Element {
  const { t } = useTranslation()
  const settings = useSettings((state) => state.settings)
  const update = useSettings((state) => state.update)
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <img src={logo} alt="" className="size-14 object-contain" />
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">{t('onboarding.welcome.title')}</h1>
        <p className="m-0 max-w-[420px] text-fg-muted">{t('onboarding.welcome.body')}</p>
      </div>
      <label className="flex items-center gap-3 text-sm text-fg-subtle">
        {t('language.label')}
        <Select
          value={settings?.language ?? 'en'}
          options={LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_NAMES[language] }))}
          onChange={(language) =>
            void update({ language: language as Language, followSystemLanguage: false })
          }
        />
      </label>
    </div>
  )
}

function Names(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 text-xl font-semibold">{t('onboarding.names.title')}</h1>
      <p className="m-0 text-fg-muted">{t('onboarding.names.body')}</p>
      <NamesInput />
    </div>
  )
}

function Sources(): React.JSX.Element {
  const { t } = useTranslation()
  const probe = useSources((state) => state.probe)
  const probing = useSources((state) => state.probing)
  const probeFailed = useSources((state) => state.probeFailed)
  useEffect(() => {
    void probe()
  }, [probe])
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-xl font-semibold">{t('onboarding.sources.title')}</h1>
          {/* After installing a missing tool, check again without leaving this step. */}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            disabled={probing}
            onClick={() => void probe()}
          >
            {t('sources.checkAgain')}
          </Button>
        </div>
        <p className="m-0 text-fg-muted">{t('onboarding.sources.body')}</p>
        {probeFailed && (
          <p role="alert" className="m-0 text-sm text-fg-subtle">
            {t('sources.probeFailed')}
          </p>
        )}
      </div>
      <ul className="scroll-thin m-0 max-h-[340px] list-none overflow-y-auto p-0 pr-1">
        {SOURCES.filter((source) => !source.advanced).map((source) => (
          <SourceRow key={source.id} source={source} />
        ))}
      </ul>
    </div>
  )
}

function Ai(): React.JSX.Element {
  const { t } = useTranslation()
  const auth = useEngine((state) => state.auth)
  const signingIn = useEngine((state) => state.signingIn)
  const signIn = useEngine((state) => state.signIn)
  const cancelSignIn = useEngine((state) => state.cancelSignIn)
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0 text-xl font-semibold">{t('onboarding.ai.title')}</h1>
      <p className="m-0 text-fg-muted">{t('onboarding.ai.body')}</p>
      {auth.signedIn ? (
        <p className="m-0 flex items-center gap-2 text-fg">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-mint" />
          {t('settings.account.signedIn')}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="primary" disabled={signingIn} onClick={() => void signIn()}>
            {signingIn ? t('answer.waitingForBrowser') : t('onboarding.ai.signIn')}
          </Button>
          {signingIn && (
            <Button variant="ghost" onClick={() => void cancelSignIn()}>
              {t('common.cancel')}
            </Button>
          )}
        </div>
      )}
      <p className="m-0 text-sm text-fg-subtle">{t('settings.privacy.ai')}</p>
    </div>
  )
}

/** First run: language, names, sources and optional sign-in. Every step can be skipped. */
export function Onboarding(): React.JSX.Element {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('welcome')
  const update = useSettings((state) => state.update)
  const refresh = useEngine((state) => state.refresh)
  const index = STEPS.indexOf(step)
  const last = index === STEPS.length - 1
  const isMac = window.quoba.platform === 'darwin'

  const finish = async (): Promise<void> => {
    await update({ onboarded: true })
    void refresh()
  }

  return (
    <div
      className="drag flex h-full items-center justify-center bg-ink p-8"
      style={{ paddingTop: isMac ? 48 : 32 }}
    >
      <div className="no-drag flex max-h-full w-full max-w-[560px] flex-col gap-8 rounded-panel border border-line bg-panel p-10">
        <div className="min-h-0 flex-1">
          {step === 'welcome' && <Welcome />}
          {step === 'names' && <Names />}
          {step === 'sources' && <Sources />}
          {step === 'ai' && <Ai />}
        </div>
        <div className="flex items-center gap-3">
          <ol aria-label={t('onboarding.progress')} className="m-0 flex list-none gap-1.5 p-0">
            {STEPS.map((item, position) => (
              <li
                key={item}
                aria-current={item === step ? 'step' : undefined}
                className={clsx('h-1 w-5 rounded-full', position <= index ? 'bg-fg' : 'bg-line-strong')}
              />
            ))}
          </ol>
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <Button variant="ghost" onClick={() => setStep(STEPS[index - 1]!)}>
                {t('common.back')}
              </Button>
            )}
            {index > 0 && !last && (
              <Button variant="ghost" onClick={() => setStep(STEPS[index + 1]!)}>
                {t('onboarding.skip')}
              </Button>
            )}
            <Button variant="primary" onClick={() => (last ? void finish() : setStep(STEPS[index + 1]!))}>
              {last ? t('onboarding.start') : t('common.continue')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
