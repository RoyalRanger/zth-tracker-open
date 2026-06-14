import { useState } from 'react'
import { calcZthUsd, calcSignaUsd, formatUsd } from '../api/price.js'
import { shortenAddress } from '../api/signum.js'
import { useLang } from '../i18n/LangContext.jsx'

const TOKEN_CONFIG = {
  ZTH: {
    icon: '⚡',
    color: 'text-cyan',
    bg: 'bg-cyan/10',
    decimals: 1,
    calcUsd: (amount, prices) => calcZthUsd(amount, prices),
  },
  VGB: {
    icon: '⛏',
    color: 'text-purple',
    bg: 'bg-purple/10',
    decimals: 0,
    calcUsd: (amount, prices) =>
      prices.signaUsd ? amount * 250 * prices.signaUsd : null,
  },
  SIGNA: {
    icon: '💎',
    color: 'text-green-400',
    bg: 'bg-green/10',
    decimals: 4,
    calcUsd: (amount, prices) => calcSignaUsd(amount, prices),
  },
}

const LOCALE_MAP = { ru: 'ru-RU', en: 'en-US', es: 'es-ES' }
const FILTER_KEYS = ['all', 'ZTH', 'VGB', 'SIGNA']

function TokenBadge({ type }) {
  const cfg = TOKEN_CONFIG[type]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {type}
    </span>
  )
}

function TransferRow({ tx, prices, index, locale, t }) {
  const cfg = TOKEN_CONFIG[tx.type]
  const usd = cfg.calcUsd(tx.amount, prices)
  const timeStr = tx.date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const dateStr = tx.date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: '2-digit' })
  const amountStr = tx.amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: cfg.decimals,
  })

  return (
    <div
      className="px-4 py-3 hover:bg-white/3 transition-colors animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 20, 400)}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Direction icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          tx.incoming ? cfg.bg : 'bg-red-500/10'
        }`}>
          <svg
            className={`w-4 h-4 ${tx.incoming ? cfg.color : 'text-red-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            {tx.incoming
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            }
          </svg>
        </div>

        {/* Address */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs text-slate-500">{tx.incoming ? t('from') : t('to')}</span>
            <TokenBadge type={tx.type} />
          </div>
          <div className="font-mono text-sm text-slate-300 truncate">
            {shortenAddress(tx.incoming ? tx.fromRS : tx.toRS)}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <div className={`font-mono font-semibold text-sm ${tx.incoming ? cfg.color : 'text-red-400'}`}>
            {tx.incoming ? '+' : '−'}{amountStr} {tx.type}
          </div>
          <div className="text-xs text-slate-600 font-mono mt-0.5">
            {usd !== null ? formatUsd(usd) : '—'}
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="mt-1 pl-11 text-xs text-slate-600">
        {timeStr} · {dateStr}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3.5 w-32" />
        </div>
        <div className="space-y-1.5 text-right">
          <div className="skeleton h-4 w-20 ml-auto" />
          <div className="skeleton h-3 w-14 ml-auto" />
        </div>
      </div>
    </div>
  )
}

const VISIBLE_STEP = 10

export default function TransactionHistory({ transfers, prices, loading, hasMore, loadingMore, onLoadMore, txError, onRetry }) {
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP)
  const { lang, t } = useLang()
  const locale = LOCALE_MAP[lang] || 'ru-RU'

  const handleFilter = (f) => { setFilter(f); setVisibleCount(VISIBLE_STEP) }

  const filtered = filter === 'all'
    ? transfers
    : transfers.filter(tx => tx.type === filter)

  const visible = filtered.slice(0, visibleCount)
  const canShowMore = visibleCount < filtered.length || hasMore

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-white">{t('tx_history')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">ZTH · VGB · SIGNA</p>
          </div>
          {!loading && (
            <span className="text-xs text-slate-600 font-mono">{visible.length} {t('records')}</span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {FILTER_KEYS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => handleFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={filter === f ? {
                background: 'rgba(0,212,255,0.1)',
                border: '1px solid rgba(0,212,255,0.25)',
                color: '#00d4ff',
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: '#475569',
              }}
            >
              {f === 'all' ? t('filter_all') : f}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : filtered.length === 0 && txError ? (
          <div className="py-14 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-400 mb-1">{t('tx_error')}</p>
            <p className="text-xs text-slate-600 mb-3 px-4">{txError}</p>
            {onRetry && (
              <button onClick={onRetry} className="text-xs text-cyan hover:text-cyan/80 underline underline-offset-2">
                {t('retry')}
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-slate-600">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">{t('tx_empty')}</p>
          </div>
        ) : (
          visible.map((tx, i) => (
            <TransferRow key={tx.id} tx={tx} prices={prices} index={i} locale={locale} t={t} />
          ))
        )}
      </div>

      {/* Show more / Load more */}
      {!loading && canShowMore && (
        <div className="px-6 py-4 border-t border-white/5 text-center">
          <button
            onClick={() => {
              if (visibleCount < filtered.length) {
                setVisibleCount(v => v + VISIBLE_STEP)
              } else {
                onLoadMore()
                setVisibleCount(v => v + VISIBLE_STEP)
              }
            }}
            disabled={loadingMore}
            className="btn-ghost px-8 py-2.5 text-sm disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('loading_more')}
              </span>
            ) : t('show_more')}
          </button>
        </div>
      )}
    </div>
  )
}
