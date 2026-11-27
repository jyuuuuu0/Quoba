import { Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SourceIcon } from '@/components/ui/SourceIcon'
import { formatDateTime } from '@/i18n/format'
import { useSearch } from '@/stores/search'

export function ContextPanel(): React.JSX.Element {
  const { t } = useTranslation()
  const selection = useSearch((state) => state.selection)
  const [copied, setCopied] = useState(false)

  if (!selection) {
    return (
      <aside className="flex w-[288px] shrink-0 items-center justify-center border-l border-line bg-rail p-6 text-center text-sm text-fg-subtle">
        {t('context.empty')}
      </aside>
    )
  }

  const detail =
    selection.kind === 'hit'
      ? {
          sourceId: selection.hit.sourceId,
          title: selection.hit.place ?? t(`sourceNames.${selection.hit.sourceId}`),
          meta: [
            t(`sourceNames.${selection.hit.sourceId}`),
            selection.hit.time && formatDateTime(selection.hit.time)
          ],
          author: selection.hit.isMe ? t('common.me') : selection.hit.author,
          isMe: selection.hit.isMe,
          text: selection.hit.text
        }
      : {
          sourceId: selection.citation.sourceId ?? 'files',
          title: selection.citation.title,
          meta: [selection.citation.sourceId ? t(`sourceNames.${selection.citation.sourceId}`) : undefined],
          author: undefined,
          isMe: false,
          text: selection.citation.excerpt ?? selection.citation.summary
        }

  return (
    <aside
      aria-label={t('context.label')}
      className="flex w-[288px] shrink-0 flex-col gap-4 border-l border-line bg-rail px-4 py-5"
    >
      <div className="flex items-center gap-2.5">
        <SourceIcon source={detail.sourceId} size={22} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{detail.title}</span>
          <span className="truncate text-xs text-fg-subtle">{detail.meta.filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      <div className={`flex flex-col gap-1 ${detail.isMe ? 'items-end' : 'items-start'}`}>
        {detail.author && <span className="text-xs text-fg-subtle">{detail.author}</span>}
        <p
          data-selectable
          className={`m-0 max-w-full rounded-xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap ${
            detail.isMe ? 'rounded-br-sm bg-[#202024] ring-1 ring-mint-line' : 'rounded-bl-sm bg-hover'
          }`}
        >
          {detail.text}
        </p>
      </div>
      {selection.kind === 'citation' && (
        <p className="m-0 text-sm text-fg-subtle">{selection.citation.summary}</p>
      )}
      <div className="mt-auto flex gap-1.5">
        <Button
          size="sm"
          className="flex-1"
          onClick={async () => {
            await navigator.clipboard.writeText(detail.text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          <Copy aria-hidden="true" size={13} />
          {copied ? t('context.copied') : t('context.copy')}
        </Button>
      </div>
    </aside>
  )
}
