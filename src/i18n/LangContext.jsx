import { createContext, useContext, useState } from 'react'
import { getLang, setStoredLang } from './lang.js'
import { translations } from './translations.js'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getLang)

  const setLang = (l) => { setStoredLang(l); setLangState(l) }

  const t = (key, vars) => {
    const str = translations[lang]?.[key] ?? translations.ru[key] ?? key
    if (!vars) return str
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), str)
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
