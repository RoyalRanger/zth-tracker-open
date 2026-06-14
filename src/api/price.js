import { signumClient, ZTH_ASSET_ID } from './signum.js'

let cache = { signaUsd: null, zthSigna: null, ts: 0 }
const TTL_MS = 5 * 60 * 1000 // 5 minutes

function makeAbortSignal(ms) {
  const c = new AbortController()
  setTimeout(() => c.abort(), ms)
  return c.signal
}

async function fetchSignaUsd() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=signum&vs_currencies=usd',
      { signal: makeAbortSignal(8000) }
    )
    const data = await res.json()
    return data?.signum?.usd ?? null
  } catch {
    try {
      const res = await fetch('https://api.coinpaprika.com/v1/tickers/signa-signum', {
        signal: makeAbortSignal(8000),
      })
      const data = await res.json()
      return data?.quotes?.USD?.price ?? null
    } catch {
      return null
    }
  }
}

async function fetchZthSignaPrice() {
  try {
    const data = await signumClient.getLastZthTrade()
    if (data?.trades?.length > 0) {
      // priceNQT is per QNT; ZTH has 1 decimal so 1 ZTH = 10 QNT
      const priceNqtPerQnt = parseFloat(data.trades[0].priceNQT)
      const priceSignaPerZth = (priceNqtPerQnt * 10) / 1e8
      return priceSignaPerZth
    }
    return null
  } catch {
    return null
  }
}

export async function getPrices(force = false) {
  if (!force && cache.ts && Date.now() - cache.ts < TTL_MS) {
    return { signaUsd: cache.signaUsd, zthSigna: cache.zthSigna }
  }

  const [signaUsd, zthSigna] = await Promise.all([fetchSignaUsd(), fetchZthSignaPrice()])

  cache = { signaUsd, zthSigna, ts: Date.now() }
  return { signaUsd, zthSigna }
}

export function calcZthUsd(zthAmount, prices) {
  if (!prices.signaUsd || !prices.zthSigna) return null
  return zthAmount * prices.zthSigna * prices.signaUsd
}

export function calcSignaUsd(signaAmount, prices) {
  if (!prices.signaUsd) return null
  return signaAmount * prices.signaUsd
}

export function formatUsd(value) {
  if (value === null || value === undefined) return '—'
  if (value < 0.01) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
