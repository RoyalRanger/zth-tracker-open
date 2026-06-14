import { useState } from 'react'
import { validateAddress } from '../api/signum.js'
import { useLang } from '../i18n/LangContext.jsx'

export default function AddressInput({ onConnect, loading }) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)
  const { t } = useLang()

  const isValid = validateAddress(value)
  const showError = touched && value.length > 3 && !isValid

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) onConnect(value)
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <p className="text-slate-500 text-sm text-center mb-6">
        {t('address_hint')}
      </p>

      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center glass-card rounded-2xl px-5 py-4 transition-all duration-300 ${
          showError ? 'border-red-500/40' : value && isValid ? 'border-cyan/30 glow-cyan' : ''
        }`}>
          <div className="mr-3 text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <input
            className="input-field flex-1 font-mono tracking-wide"
            placeholder="S-XXXX-XXXX-XXXX-XXXXX"
            value={value}
            onChange={e => { setValue(e.target.value.toUpperCase()); setTouched(true) }}
            onBlur={() => setTouched(true)}
            autoComplete="off"
            spellCheck={false}
          />

          {value && (
            <button
              type="button"
              onClick={() => { setValue(''); setTouched(false) }}
              className="mr-3 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('btn_loading')}
              </span>
            ) : t('connect')}
          </button>
        </div>

        {showError && (
          <p className="mt-2 text-xs text-red-400 text-center animate-fade-in">
            {t('address_error')}
          </p>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-slate-700">
        {t('readonly_hint')}
      </p>
    </div>
  )
}
