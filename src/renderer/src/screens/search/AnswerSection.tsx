import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useEngine } from '@/stores/engine'
import { useSearch } from '@/stores/search'

/** Renders "[1]" markers in the answer as clickable mint citation numbers. */
function AnswerText({ text }: { text: string }): React.JSX.Element {
  const { t } = useTranslation()
  const citations = useSearch((state) => state.answer.citations)
  const select = useSearch((state) => state.select)
  const parts = text.split(/\[(\d+)\]/)
  return (
    <p data-selectable className="m-0 text-md leading-[1.7] whitespace-pre-wrap text-[#e4e4e7]">
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>
        const citation = citations.find((item) => item.number === Number(part))
        return (
          <button
            key={index}
            type="button"
            disabled={!citation}
            onClick={() => citation && select({ kind: 'citation', citation })}
            aria-label={t('search.openSource', { number: part })}
            className="mx-px align-super text-[10px] font-semibold text-mint hover:underline"
          >
            {part}
          </button>
        )
      })}
    </p>
  )
}

export function AnswerSection(): React.JSX.Element | null {
  const { t } = useTranslation()
  const answer = useSearch((state) => state.answer)
  const query = useSearch((state) => state.query)
  const signedIn = useEngine((state) => state.auth.signedIn)
  const signingIn = useEngine((state) => state.signingIn)
  const signIn = useEngine((state) => state.signIn)
  const run = useSearch((state) => state.run)

  if (!signedIn) {
    if (!query) return null
    return (
      <section className="flex items-center gap-3 rounded-card border border-line px-4 py-3">
        <div className="flex flex-1 flex-col">
          <span>{t('answer.signInTitle')}</span>
          <span className="text-sm text-fg-subtle">{t('answer.signInBody')}</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={signingIn}
          onClick={async () => {
            await signIn()
            void run()
          }}
        >
          {signingIn ? t('answer.waitingForBrowser') : t('answer.signIn')}
        </Button>
      </section>
    )
  }

  if (answer.phase === 'idle') return null

  return (
    <section aria-label={t('answer.label')} aria-live="polite" className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-xs font-medium text-fg-subtle">
        {t('answer.label')}
        {(answer.phase === 'thinking' || answer.phase === 'preliminary') && (
          <>
            <Spinner label={t('answer.thinking')} className="size-3" />
            <span className="font-normal">
              {answer.phase === 'preliminary'
                ? t('answer.verifying')
                : (answer.progress ?? t('answer.thinking'))}
            </span>
          </>
        )}
      </span>
      {answer.phase === 'error' ? (
        <p className="m-0 text-fg-muted">{t(`answer.errors.${answer.error ?? 'unknown'}`)}</p>
      ) : (
        answer.text && <AnswerText text={answer.text} />
      )}
    </section>
  )
}
