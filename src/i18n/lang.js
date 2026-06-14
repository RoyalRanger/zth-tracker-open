const STORAGE_KEY = 'zth_lang'
let _lang = localStorage.getItem(STORAGE_KEY) || 'ru'
export const getLang = () => _lang
export const setStoredLang = (l) => { _lang = l; localStorage.setItem(STORAGE_KEY, l) }
