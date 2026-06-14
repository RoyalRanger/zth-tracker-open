import { calcZthUsd, calcSignaUsd, formatUsd } from '../api/price.js'
import { shortenAddress } from '../api/signum.js'
import { useLang } from '../i18n/LangContext.jsx'

const LOCALE_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES' }

function BalanceCard({ label, value, decimals = 4, usd, color, icon, unit, loading }) {
  const colors = {
    cyan: {
      card: 'glass-card-cyan glow-cyan',
      text: 'gradient-text-cyan',
      badge: 'bg-cyan/10 text-cyan',
      dot: 'bg-cyan',
    },
    purple: {
      card: 'glass-card-purple glow-purple',
      text: 'gradient-text-purple',
      badge: 'bg-purple/10 text-purple',
      dot: 'bg-purple',
    },
    green: {
      card: 'glass-card-green glow-green',
      text: 'gradient-text-green',
      badge: 'bg-green/10 text-green',
      dot: 'bg-green',
    },
  }
  const c = colors[color]

  return (
    <div className={`${c.card} rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${c.badge} px-3 py-1.5 rounded-lg text-sm font-semibold`}>
          <span>{icon}</span>
          <span>{unit}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${c.dot} opacity-60`} />
      </div>

      <div>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-9 w-3/4" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        ) : (
          <>
            <div className={`font-mono text-3xl font-bold ${c.text} leading-tight`}>
              {typeof value === 'number'
                ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
                : '—'}
            </div>
            {usd !== undefined && (
              <div className="text-slate-500 text-sm mt-1 font-mono">
                ≈ {formatUsd(usd)}
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-slate-600 text-xs">{label}</div>
    </div>
  )
}

export default function BalanceDashboard({ data, onDisconnect, onRefresh, refreshing }) {
  const { signa, zth, vgb, accountRS, prices } = data
  const { lang, t } = useLang()
  const locale = LOCALE_MAP[lang] || 'ru-RU'

  const zthUsd = calcZthUsd(zth, prices)
  const signaUsd = calcSignaUsd(signa, prices)

  return (
    <div className="animate-slide-up space-y-6">
      {/* Account header */}
      <div className="flex items-center justify-between glass-card rounded-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="dot-live" />
          <div>
            <div className="text-xs text-slate-500 mb-0.5">{t('connected')}</div>
            <div className="font-mono text-sm text-slate-300 tracking-wide">{accountRS}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-ghost p-2"
            title={t('refresh')}
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={onDisconnect} className="btn-ghost text-sm px-4 py-2">
            {t('disconnect')}
          </button>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard
          label={t('zth_label')}
          value={zth}
          decimals={1}
          usd={zthUsd}
          color="cyan"
          icon="⚡"
          unit="ZTH"
        />
        <BalanceCard
          label={t('vgb_label')}
          value={vgb}
          decimals={0}
          color="purple"
          icon="⛏"
          unit="VGB"
        />
        <BalanceCard
          label={t('signa_label')}
          value={signa}
          decimals={2}
          usd={signaUsd}
          color="green"
          icon="💎"
          unit="SIGNA"
        />
      </div>

      {/* Price info */}
      {prices.signaUsd && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-3 rounded-xl bg-white/2 border border-white/4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">SIGNA</span>
            <span className="text-slate-400 font-mono">{formatUsd(prices.signaUsd)}</span>
          </div>
          {prices.zthSigna && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">ZTH</span>
              <span className="text-slate-400 font-mono">{formatUsd(calcZthUsd(1, prices))}</span>
              <span className="text-slate-700 hidden sm:inline">({prices.zthSigna.toFixed(4)} SIGNA)</span>
            </div>
          )}
          <div className="ml-auto text-slate-700 text-[10px]">{new Date().toLocaleTimeString(locale)}</div>
        </div>
      )}
    </div>
  )
}
