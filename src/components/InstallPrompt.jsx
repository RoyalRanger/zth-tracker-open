import { useState, useEffect, useRef } from 'react'
import { useLang } from '../i18n/LangContext.jsx'

const DISMISS_KEY = 'zth_install_dismissed'
const DELAY_MS = 3 * 60 * 1000 // 3 minutes

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [outcome, setOutcome] = useState(null) // 'accepted' | 'dismissed'
  const timerRef = useRef(null)
  const { t } = useLang()

  useEffect(() => {
    // Already running as installed PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) return

    // User dismissed recently (7 days cooldown)
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Capture the browser's native install event (Android/Chrome)
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    timerRef.current = setTimeout(() => setShow(true), DELAY_MS)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome: choice } = await deferredPrompt.userChoice
      setOutcome(choice)
      setDeferredPrompt(null)
    }
    setShow(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
        style={{ animation: 'fadeIn 0.25s ease' }}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] max-w-lg mx-auto px-4 pb-6"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1526 0%, #0a1020 100%)',
            border: '1px solid rgba(0,212,255,0.25)',
            boxShadow: '0 -8px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,212,255,0.08)',
          }}
        >
          {/* Top accent line */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #00d4ff, #a78bfa, #34d399)' }} />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src="/zth-logo.png"
                alt="ZTH"
                className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                style={{ boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              />
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{t('install_title')}</h3>
                <p className="text-slate-400 text-sm mt-1 leading-snug">{t('install_desc')}</p>
              </div>
            </div>

            {/* iOS instructions */}
            {isIOS && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm text-slate-300"
                style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
              >
                <span className="text-slate-400">{t('install_ios1')}</span>
                {/* Safari Share icon */}
                <svg className="w-5 h-5 text-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-slate-400">{t('install_ios2')}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-500 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
              >
                {t('install_later')}
              </button>

              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold text-slate-900 transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                    boxShadow: '0 0 20px rgba(0,212,255,0.35)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('install_btn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  )
}
