import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shortcut } from '@/components/ui/Kbd'
import { eventToAccelerator } from '@/lib/shortcuts'

export interface ShortcutRecorderProps {
  value: string | null
  /** May reject, for example when another app owns a global shortcut. */
  onChange: (accelerator: string | null) => void | Promise<void>
  label: string
  /** Accelerators already used elsewhere; recording one of them is refused. */
  taken: string[]
}

// Only one recorder listens at a time; starting another stops the previous one.
let stopActiveRecorder: (() => void) | undefined

/** Click, then press keys. Escape cancels, Backspace clears. */
export function ShortcutRecorder({
  value,
  onChange,
  label,
  taken
}: ShortcutRecorderProps): React.JSX.Element {
  const { t } = useTranslation()
  const [recording, setRecording] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!recording) return
    const save = (accelerator: string | null): void => {
      setFailed(false)
      Promise.resolve(onChange(accelerator)).catch(() => setFailed(true))
    }
    const stop = (): void => setRecording(false)
    stopActiveRecorder?.()
    stopActiveRecorder = stop
    const listener = (event: KeyboardEvent): void => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') return setRecording(false)
      if (event.key === 'Backspace' || event.key === 'Delete') {
        save(null)
        return setRecording(false)
      }
      const accelerator = eventToAccelerator(event)
      // Require a modifier so plain typing never triggers a shortcut.
      if (!accelerator || !accelerator.includes('+')) return
      if (taken.includes(accelerator)) return setConflict(true)
      setConflict(false)
      save(accelerator)
      setRecording(false)
    }
    window.addEventListener('keydown', listener, { capture: true })
    return () => {
      window.removeEventListener('keydown', listener, { capture: true })
      if (stopActiveRecorder === stop) stopActiveRecorder = undefined
    }
  }, [recording, onChange, taken])

  return (
    <span className="flex items-center gap-2">
      {conflict && <span className="text-xs text-amber-300/90">{t('settings.shortcuts.taken')}</span>}
      {failed && <span className="text-xs text-amber-300/90">{t('settings.shortcuts.unavailable')}</span>}
      <button
        type="button"
        aria-label={t('settings.shortcuts.change', { action: label })}
        onClick={() => {
          setConflict(false)
          setRecording(!recording)
        }}
        className="rounded-control p-0.5 hover:bg-hover"
      >
        {recording ? (
          <span className="inline-flex h-[22px] items-center rounded-[5px] border border-dashed border-mint-line px-2 text-xs text-fg">
            {t('settings.shortcuts.pressKeys')}
          </span>
        ) : value ? (
          <Shortcut accelerator={value} />
        ) : (
          <span className="inline-flex h-[22px] items-center rounded-[5px] border border-dashed border-line-strong px-2 text-xs text-fg-subtle">
            {t('settings.shortcuts.record')}
          </span>
        )}
      </button>
    </span>
  )
}
