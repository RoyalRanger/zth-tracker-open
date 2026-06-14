import { useState } from 'react'
import { buildSignDeepLink, buildPayPaymentLinks, buyVGBWithXT, VGB_PRICE_SIGNA, VGB_SERVICE_FEE_SIGNA, VGB_FEE_SIGNA, VGB_CONTRACT_RS } from '../api/signum.js'
import { useLang } from '../i18n/LangContext.jsx'

const MIN_QTY = 1
const MAX_QTY = 10000

const IS_TELEGRAM = /Telegram/i.test(navigator.userAgent) || typeof window.TelegramWebviewProxy !== 'undefined'

function openDeepLink(url) {
  const a = document.createElement('a')
  a.href = url
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => { try { window.location.href = url } catch(e){} }, 100)
}

export default function BuyVGB({ signaBalance, publicKey }) {
  const [qty, setQty] = useState(1)
  const [copied, setCopied] = useState(false)
  const [copiedAmt, setCopiedAmt] = useState(false)
  const [buildingTx, setBuildingTx] = useState(false)
  const [buildError, setBuildError] = useState(null)
  const [xtLoading, setXtLoading] = useState(false)
  const [xtTxId, setXtTxId] = useState(null)
  const [xtError, setXtError] = useState(null)
  const [showPhoenix, setShowPhoenix] = useState(false)
  const { t } = useLang()

  const priceSigna = qty * VGB_PRICE_SIGNA
  const totalSigna = priceSigna + VGB_SERVICE_FEE_SIGNA + VGB_FEE_SIGNA
  const manualAmount = priceSigna + VGB_SERVICE_FEE_SIGNA
  const phoenixLinks = buildPayPaymentLinks(qty)
  const hasEnough = signaBalance === undefined ? true : signaBalance >= totalSigna

  const clampQty = v => Math.max(MIN_QTY, Math.min(MAX_QTY, parseInt(v, 10) || 1))

  const handleOpenV2 = async () => {
    setBuildingTx(true)
    setBuildError(null)
    try {
      const url = await buildSignDeepLink(publicKey, qty)
      openDeepLink(url)
    } catch (e) {
      setBuildError(e.message || t('build_tx_error'))
    } finally {
      setBuildingTx(false)
    }
  }

  const handleXT = async () => {
    setXtLoading(true)
    setXtError(null)
    setXtTxId(null)
    try {
      const result = await buyVGBWithXT(qty)
      setXtTxId(result.transactionId || result.fullHash || t('tx_sent').replace('✓ ', ''))
    } catch (e) {
      setXtError(e.message || t('build_tx_error'))
    } finally {
      setXtLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center text-lg">⛏</div>
          <div>
            <h2 className="font-semibold text-white">{t('buy_vgb')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('buy_vgb_sub')}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">{t('qty_label')}</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQty(q => Math.max(MIN_QTY, q - 1))}
              className="w-10 h-10 rounded-xl glass-card-purple flex items-center justify-center text-purple text-xl">−</button>
            <div className="flex-1 glass-card-purple rounded-xl px-4 py-3 flex items-center justify-center">
              <input type="number" min={MIN_QTY} max={MAX_QTY} value={qty}
                onChange={e => setQty(clampQty(e.target.value))}
                className="bg-transparent text-center font-mono text-2xl font-bold text-purple outline-none w-28" />
            </div>
            <button type="button" onClick={() => setQty(q => Math.min(MAX_QTY, q + 1))}
              className="w-10 h-10 rounded-xl glass-card-purple flex items-center justify-center text-purple text-xl">+</button>
          </div>
          <div className="flex gap-2 mt-3">
            {[1, 5, 10, 25, 100].map(n => (
              <button key={n} type="button" onClick={() => setQty(n)}
                className="flex-1 py-1.5 text-xs rounded-lg transition-all"
                style={qty === n
                  ? { background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', color: '#475569' }}
              >{n}</button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{qty} VGB × {VGB_PRICE_SIGNA} SIGNA</span>
            <span className="font-mono text-slate-300">{priceSigna.toLocaleString()} SIGNA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t('service_fee')}</span>
            <span className="font-mono text-slate-300">{VGB_SERVICE_FEE_SIGNA} SIGNA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t('network_fee')}</span>
            <span className="font-mono text-slate-300">{VGB_FEE_SIGNA} SIGNA</span>
          </div>
          <div className="border-t border-white/6 pt-2 flex justify-between">
            <span className="text-sm font-semibold text-white">{t('total')}</span>
            <span className="font-mono font-bold text-lg gradient-text-purple">{totalSigna.toFixed(2)} SIGNA</span>
          </div>
          {signaBalance !== undefined && !hasEnough && (
            <p className="text-xs text-red-400">{t('insufficient_signa', { balance: signaBalance?.toFixed(2) })}</p>
          )}
        </div>

        {IS_TELEGRAM && (
          <div className="rounded-xl p-3 text-xs text-amber-400 flex gap-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span>⚠</span>
            <span>{t('telegram_warning')}</span>
          </div>
        )}

        {!IS_TELEGRAM && (
          <div className="space-y-3">
            {/* ── Signum Wallet v2 ── */}
            {publicKey ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOpenV2}
                  disabled={!hasEnough || buildingTx}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    color: '#f8fafc',
                    boxShadow: hasEnough ? '0 0 20px rgba(167,139,250,0.25)' : 'none',
                  }}
                >
                  {buildingTx ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('preparing_tx')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {t('open_wallet_v2')}
                    </>
                  )}
                </button>

                {buildError && (
                  <p className="text-xs text-red-400 text-center px-2">{buildError}</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl p-3 text-xs text-slate-500 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                {t('no_pubkey')}<br />
                <span className="text-slate-600">{t('no_pubkey_hint')}</span>
              </div>
            )}

            {/* ── Signum XT Wallet (desktop browser extension only) ── */}
            <div className="hidden lg:block space-y-2">
              <button
                type="button"
                onClick={handleXT}
                disabled={!hasEnough || xtLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}
              >
                {xtLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('waiting_xt')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.25 6H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-4M14.25 6l4.5 4.5M14.25 6V3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75z" />
                    </svg>
                    Signum XT Wallet
                  </>
                )}
              </button>
              {xtTxId && (
                <p className="text-xs text-green-400 text-center px-2">{t('tx_sent')} <span className="font-mono break-all">{xtTxId}</span></p>
              )}
              {xtError && (
                <p className="text-xs text-red-400 text-center px-2">{xtError}</p>
              )}
            </div>

            {/* ── Phoenix Wallet (collapsible) ── */}
            <div>
              <button
                type="button"
                onClick={() => setShowPhoenix(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs text-slate-500 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span>{t('phoenix_label')}</span>
                <svg
                  className="w-4 h-4 transition-transform"
                  style={{ transform: showPhoenix ? 'rotate(180deg)' : 'none' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPhoenix && (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => openDeepLink(phoenixLinks[1].url)}
                    disabled={!hasEnough}
                    className="w-full py-2.5 rounded-xl text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                    style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', background: 'transparent' }}
                  >
                    {t('open_phoenix')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual payment */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('manual_pay')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-600 mb-0.5">{t('contract_addr')}</p>
              <p className="font-mono text-xs text-slate-300 truncate">{VGB_CONTRACT_RS}</p>
            </div>
            <button type="button"
              onClick={() => { navigator.clipboard.writeText(VGB_CONTRACT_RS); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#34d399' : '#64748b' }}>
              {copied ? '✓' : t('copy')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-slate-600 mb-0.5">{t('amount_signa')}</p>
              <p className="font-mono text-sm font-bold" style={{ color: '#a78bfa' }}>{manualAmount.toFixed(2)}</p>
            </div>
            <button type="button"
              onClick={() => { navigator.clipboard.writeText(manualAmount.toFixed(2)); setCopiedAmt(true); setTimeout(() => setCopiedAmt(false), 2000) }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: copiedAmt ? '#34d399' : '#64748b' }}>
              {copiedAmt ? '✓' : t('copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
