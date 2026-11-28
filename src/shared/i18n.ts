export const LANGUAGES = ['en', 'ko', 'ja'] as const

export type Language = (typeof LANGUAGES)[number]

/** Each language's name written in that language, for the language picker. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語'
}

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}

/** Picks the closest supported language for a BCP 47 tag such as `ko-KR`. */
export function matchLanguage(tag: string | undefined): Language {
  const base = tag?.toLowerCase().split('-')[0] ?? ''
  return isLanguage(base) ? base : 'en'
}
