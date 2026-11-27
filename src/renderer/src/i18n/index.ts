import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { matchLanguage, type Language } from '@shared/i18n'
import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

export const resources = {
  en: { translation: en },
  ko: { translation: ko },
  ja: { translation: ja }
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: matchLanguage(navigator.language),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false
})

export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language)
  document.documentElement.lang = language
}

document.documentElement.lang = i18n.language

export default i18n
