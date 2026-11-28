import i18n from './index'

function locale(): string {
  return i18n.language || 'en'
}

/** "Nov 20" / "11월 20일" / "11月20日" */
export function formatDay(value: string | number | Date): string {
  return new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric' }).format(new Date(value))
}

/** "Nov 20, 21:14" in the user's language. */
export function formatDateTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat(locale(), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value))
}

/** "21:14" */
export function formatTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(value)
  )
}

/** "2 min ago" / "2분 전" / "2 分前" */
export function formatRelative(value: string | number | Date, now = Date.now()): string {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000)
  const format = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto', style: 'short' })
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60]
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(seconds, 'second')
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale(), { notation: 'compact' }).format(value)
}
