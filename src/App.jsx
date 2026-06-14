import { useState } from 'react'
import { useAccount } from './hooks/useAccount.js'
import { useNodes } from './hooks/useNodes.js'
import { useLang } from './i18n/LangContext.jsx'
import NodeSelector from './components/NodeSelector.jsx'
import AddressInput from './components/AddressInput.jsx'
import BalanceDashboard from './components/BalanceDashboard.jsx'
import TransactionHistory from './components/TransactionHistory.jsx'
import BuyVGB from './components/BuyVGB.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'

export default function App() {
  const [refreshing, setRefreshing] = useState(false)
  const { address, loading, error, data, hasMore, loadingMore, txLoading, txError, connect, disconnect, refresh, loadMoreTransfers, retryTransactions } = useAccount()
  const { nodes, activeIndex, pings, pinging, switchNode, addCustomNode, removeCustomNode, pingAll } = useNodes()
  const { lang, setLang, t } = useLang()

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Ambient background orbs */}
      <div className="bg-orb w-96 h-96 top-[-10%] left-[-5%]" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)' }} />
      <div className="bg-orb w-80 h-80 bottom-[20%] right-[-5%]" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', animationDelay: '5s' }} />
      <div className="bg-orb w-64 h-64 bottom-[-5%] left-[30%]" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)', animationDelay: '10s' }} />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/zth-logo.png" alt="ZTH" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <span className="font-bold text-white tracking-tight">ZTH</span>
              <span className="text-slate-500 ml-1.5 text-sm hidden sm:inline">Tracker</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-xs text-cyan/60 border border-cyan/15 font-mono">
              Zethereum
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center rounded-lg overflow-hidden border border-white/8" style={{ background: 'rgba(13,21,38,0.9)' }}>
              {['ru', 'en', 'es'].map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className="px-2.5 py-1.5 text-xs font-semibold transition-colors"
                  style={lang === l
                    ? { color: '#00d4ff', background: 'rgba(0,212,255,0.1)' }
                    : { color: '#475569' }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <NodeSelector
              nodes={nodes}
              activeIndex={activeIndex}
              pings={pings}
              pinging={pinging}
              onSwitch={switchNode}
              onAdd={addCustomNode}
              onRemove={removeCustomNode}
              onPingAll={pingAll}
              onRetry={refresh}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        {!data && (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-cyan/20 text-cyan/70 mb-2">
              <div className="dot-live" />
              {t('live_network')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="gradient-text-cyan">ZTH</span>{' '}
              <span className="text-white">{t('hero_title')}</span>
            </h1>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              {t('hero_desc')}
            </p>
          </div>
        )}

        {/* Address input */}
        {!data && (
          <AddressInput onConnect={connect} loading={loading} />
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl px-5 py-4 border border-red-500/20 bg-red-500/5 text-sm text-red-400 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium">{t('error_loading')}</div>
              <div className="text-red-500/70 text-xs mt-0.5">{error}</div>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Dashboard */}
        {data && (
          <>
            <BalanceDashboard
              data={data}
              onDisconnect={disconnect}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              <TransactionHistory
                transfers={data.transfers}
                prices={data.prices}
                loading={loading || txLoading}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMoreTransfers}
                txError={txError}
                onRetry={retryTransactions}
              />
              <BuyVGB signaBalance={data.signa} publicKey={data.publicKey} />
            </div>
          </>
        )}

        {/* Loading skeleton when no data yet */}
        {loading && !data && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className="skeleton w-2 h-2 rounded-full" />
              <div className="skeleton h-4 w-48" />
              <div className="ml-auto skeleton h-8 w-24 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
                  <div className="skeleton h-6 w-16 rounded-lg" />
                  <div className="skeleton h-9 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <InstallPrompt />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/4 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-700">
              Powered by{' '}
              <a href="https://signum.network" target="_blank" rel="noopener" className="text-slate-600 hover:text-cyan transition-colors">
                Signum Network
              </a>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-700">
              <span className="font-mono">ZTH: 9518219425200752102</span>
              <span className="text-slate-800">·</span>
              <span className="font-mono">VGB: 9381200141252723234</span>
            </div>
          </div>

          {/* Wallet + GitHub links */}
          <div className="text-center mb-2">
            <span className="text-xs text-slate-500">{t('wallet_mobile')}</span>
          </div>
          <div className="flex items-center justify-center gap-5 pt-1">
            {/* App Store */}
            <a href="https://apps.apple.com/us/app/signum-mobile-wallet-v2/id6761561116" target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors group">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>App Store</span>
            </a>

            <span className="text-slate-800">·</span>

            {/* Google Play */}
            <a href="https://play.google.com/store/apps/details?id=com.signum.mobile.wallet" target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors group">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85C3.34 21.6 3 21.09 3 20.5m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27M20.16 10.81c.34.27.59.69.59 1.19s-.25.92-.59 1.19l-2.27 1.31-2.5-2.5 2.5-2.5 2.27 1.31M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/>
              </svg>
              <span>Google Play</span>
            </a>

            <span className="text-slate-800">·</span>

            {/* GitHub */}
            <a href="https://github.com/RoyalRanger" target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors group">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
