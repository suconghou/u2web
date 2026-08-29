import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'
import ko from './ko'
import ja from './ja'

export type LangCode = 'zh' | 'en' | 'ko' | 'ja'

export const LANG_KEY = 'lang'
export const DEFAULT_LANG: LangCode = 'zh'

export function loadLang(): LangCode {
  const v = localStorage.getItem(LANG_KEY)
  return v === 'en' || v === 'ko' || v === 'ja' ? v : DEFAULT_LANG
}

export function saveLang(lang: LangCode) {
  localStorage.setItem(LANG_KEY, lang)
}

export const i18n = createI18n({
  legacy: false,
  locale: loadLang(),
  fallbackLocale: DEFAULT_LANG,
  messages: { zh, en, ko, ja },
})
