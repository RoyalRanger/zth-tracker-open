import { getLang } from '../i18n/lang.js'
import { translations } from '../i18n/translations.js'

function tErr(key) {
  const lang = getLang()
  return translations[lang]?.[key] ?? translations.ru[key] ?? key
}

export const ZTH_ASSET_ID = '9518219425200752102'
export const VGB_ASSET_ID = '9381200141252723234'
export const VGB_CONTRACT_RS = 'S-X3F9-KL43-GPMV-2YTHN'
export const VGB_CONTRACT_NUMERIC = '738377637144987047'
export const GRAND_POOL_ZTH = '5177715656288570369'       // S-Y523-YMNJ-NZBR-6JRQH
export const GRAND_REWARD_ZTH = '5097376182589737369'     // S-SLET-N86W-B67K-66EHF
export const SIGNA_DIVIDENDS_PAYER = '2346890478463582646' // S-52FQ-GLRT-RP6V-4NG63 ZTHDividendsPayer
export const VGB_PRICE_SIGNA = 250
export const VGB_SERVICE_FEE_SIGNA = 0.33
export const VGB_FEE_SIGNA = 0.01
export const GENESIS_TIMESTAMP = 1407733200

export const DEFAULT_NODES = [
  { name: 'Europe', url: 'https://europe.signum.network', region: '🇪🇺' },
  { name: 'Singapore', url: 'https://singapore.signum.network', region: '🇸🇬' },
  { name: 'US East', url: 'https://us.signum.network', region: '🇺🇸' },
  { name: 'Canada', url: 'https://canada.signum.network', region: '🇨🇦' },
  { name: 'LatAm', url: 'https://latam.signum.network', region: '🌎' },
  { name: 'Africa', url: 'https://africa.signum.network', region: '🌍' },
]

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

async function fetchJSON(url, timeoutMs = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.error || data.errorCode) throw new Error(data.errorDescription || `Error ${data.errorCode}`)
    return data
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

async function fetchJSONViaCorsProxy(targetUrl, timeoutMs = 12000) {
  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      return await fetchJSON(buildProxyUrl(targetUrl), timeoutMs)
    } catch {
      continue
    }
  }
  throw new Error('All CORS proxies failed')
}

class SignumClient {
  constructor() {
    this.nodes = [...DEFAULT_NODES]
    this.activeIndex = 0
    this.customNodes = []
  }

  get activeNode() {
    return this.allNodes[this.activeIndex] || this.allNodes[0]
  }

  get allNodes() {
    return [...this.nodes, ...this.customNodes]
  }

  setActiveIndex(i) { this.activeIndex = i }

  addCustomNode(url, name = 'Custom') {
    const node = { name, url: url.replace(/\/$/, ''), region: '🔧', custom: true }
    this.customNodes.push(node)
    return this.allNodes.length - 1
  }

  removeCustomNode(url) {
    this.customNodes = this.customNodes.filter(n => n.url !== url)
  }

  async callDirect(params, nodeUrl) {
    const base = nodeUrl || this.activeNode.url
    const qs = new URLSearchParams(params).toString()
    return fetchJSON(`${base}/burst?${qs}`)
  }

  async callWithFailover(params) {
    const nodes = this.allNodes

    if (!IS_DEV) {
      try {
        const qs = new URLSearchParams({ ...params, node: this.activeNode.url }).toString()
        return await fetchJSON(`/api/proxy?${qs}`, 15000)
      } catch (e) {
        console.warn('[Signum] Vercel proxy failed:', e.message)
      }
    }

    let lastError
    for (let i = 0; i < nodes.length; i++) {
      const idx = (this.activeIndex + i) % nodes.length
      try {
        const result = await this.callDirect(params, nodes[idx].url)
        this.activeIndex = idx
        return result
      } catch (e) {
        lastError = e
        console.warn(`[Signum] Direct ${nodes[idx].name} failed: ${e.message}`)
      }
    }

    if (!IS_DEV) {
      console.warn('[Signum] Trying public CORS proxies...')
      const qs = new URLSearchParams(params).toString()
      const targetUrl = `${this.activeNode.url}/burst?${qs}`
      try {
        return await fetchJSONViaCorsProxy(targetUrl)
      } catch (e) {
        console.warn('[Signum] CORS proxies failed:', e.message)
      }
    }

    throw new Error(`${tErr('all_nodes_fail')}. Last error: ${lastError?.message}`)
  }

  async pingNode(url) {
    const start = Date.now()
    try {
      await this.callDirect({ requestType: 'getTime' }, url)
      return Date.now() - start
    } catch {
      return null
    }
  }

  async getAccount(address) {
    return this.callWithFailover({ requestType: 'getAccount', account: address })
  }

  async getAccountAssets(address) {
    return this.callWithFailover({ requestType: 'getAccountAssets', account: address })
  }

  async getAssetTransfers(assetId, address, firstIndex = 0, lastIndex = 49) {
    return this.callWithFailover({
      requestType: 'getAssetTransfers',
      asset: assetId,
      account: address,
      firstIndex,
      lastIndex,
    })
  }

  async getSignaTransactions(address, firstIndex = 0, lastIndex = 49) {
    // type=0: ordinary SIGNA payments; type=22: smart contract SIGNA payments (AT payouts)
    const [ordinary, contract] = await Promise.all([
      this.callWithFailover({ requestType: 'getAccountTransactions', account: address, type: 0, firstIndex, lastIndex }),
      this.callWithFailover({ requestType: 'getAccountTransactions', account: address, type: 22, firstIndex, lastIndex }),
    ])
    const all = [...(ordinary.transactions || []), ...(contract.transactions || [])]
    all.sort((a, b) => b.timestamp - a.timestamp)
    return { transactions: all.slice(0, lastIndex - firstIndex + 1) }
  }

  async getZthDistributions(userAccount, count = 10) {
    const half = Math.ceil(count / 2)
    const [poolRes, rewardRes] = await Promise.all([
      this.callWithFailover({ requestType: 'getAccountTransactions', account: GRAND_POOL_ZTH, type: 2, subtype: 8, firstIndex: 0, lastIndex: half - 1 }).catch(() => ({ transactions: [] })),
      this.callWithFailover({ requestType: 'getAccountTransactions', account: GRAND_REWARD_ZTH, type: 2, subtype: 8, firstIndex: 0, lastIndex: half - 1 }).catch(() => ({ transactions: [] })),
    ])
    const txs = [...(poolRes.transactions || []), ...(rewardRes.transactions || [])]
    txs.sort((a, b) => b.timestamp - a.timestamp)
    const recent = txs.slice(0, count)

    const results = await Promise.all(
      recent.map(async (tx) => {
        try {
          const r = await this.callWithFailover({ requestType: 'getIndirectIncoming', account: userAccount, transaction: tx.transaction })
          const qty = parseInt(r.quantityQNT || '0')
          return qty > 0 ? { tx, quantityQNT: r.quantityQNT } : null
        } catch { return null }
      })
    )
    return results.filter(Boolean)
  }

  async getSignaDistributions(userAccount, count = 10) {
    const res = await this.callWithFailover({
      requestType: 'getAccountTransactions',
      account: SIGNA_DIVIDENDS_PAYER,
      type: 2,
      subtype: 8,
      firstIndex: 0,
      lastIndex: count - 1,
    }).catch(() => ({ transactions: [] }))

    const txs = res.transactions || []
    const results = await Promise.all(
      txs.map(async (tx) => {
        try {
          const r = await this.callWithFailover({ requestType: 'getIndirectIncoming', account: userAccount, transaction: tx.transaction })
          const amt = parseInt(r.amountNQT || '0')
          return amt > 0 ? { tx, amountNQT: r.amountNQT } : null
        } catch { return null }
      })
    )
    return results.filter(Boolean)
  }

  async getLastZthTrade() {
    return this.callWithFailover({
      requestType: 'getTrades',
      asset: ZTH_ASSET_ID,
      firstIndex: 0,
      lastIndex: 0,
    })
  }
}

export const signumClient = new SignumClient()

export function toDate(signumTimestamp) {
  return new Date((signumTimestamp + GENESIS_TIMESTAMP) * 1000)
}
export function formatZth(quantityQNT) { return parseFloat(quantityQNT) / 10 }
export function formatVgb(quantityQNT) { return parseInt(quantityQNT, 10) }
export function formatSigna(balanceNQT) { return parseFloat(balanceNQT) / 1e8 }

export function validateAddress(addr) {
  return /^S-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/.test(addr.trim().toUpperCase())
}

export function shortenAddress(addr) {
  if (!addr) return ''
  const parts = addr.split('-')
  if (parts.length < 5) return addr
  return `${parts[0]}-${parts[1]}-...-${parts[4]}`
}

// Signum Mobile Wallet v2 (SRC-22): builds unsigned tx, returns action=sign deep link
// Does NOT use callWithFailover — surfaces API errors immediately instead of falling through all layers
export async function buildSignDeepLink(senderPublicKey, quantity) {
  const amountNQT = Math.round((quantity * VGB_PRICE_SIGNA + VGB_SERVICE_FEE_SIGNA) * 1e8)
  const feeNQT = Math.round(VGB_FEE_SIGNA * 1e8)

  const params = {
    requestType: 'sendMoney',
    recipient: VGB_CONTRACT_NUMERIC,
    amountNQT: String(amountNQT),
    feeNQT: String(feeNQT),
    publicKey: senderPublicKey,
    deadline: '1440',
    broadcast: 'false',
  }

  const nodes = signumClient.allNodes
  let lastErr = null

  // Try Vercel proxy first — server-side, no CORS, works on mobile
  if (!IS_DEV) {
    try {
      const qs = new URLSearchParams({ ...params, node: signumClient.activeNode.url }).toString()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(`/api/proxy?${qs}`, { signal: controller.signal })
      clearTimeout(timer)
      const data = await res.json()

      if (data.unsignedTransactionBytes) {
        return makeSignLink(data.unsignedTransactionBytes)
      }
      // API error from node — show it directly, don't fall through
      throw new Error(data.errorDescription || `Ошибка ноды: код ${data.errorCode ?? res.status}`)
    } catch (e) {
      // Only fall through on network errors; surface API errors immediately
      if (e.name === 'AbortError') throw new Error(tErr('node_timeout'))
      if (!e.message.startsWith('Failed to fetch') && !e.message.startsWith('HTTP 5')) throw e
      lastErr = e
      console.warn('[buildSignDeepLink] Vercel proxy failed:', e.message)
    }
  }

  // Fallback: direct call to each node (for dev / if proxy unreachable)
  for (const node of nodes) {
    try {
      const qs = new URLSearchParams(params).toString()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(`${node.url}/burst?${qs}`, { signal: controller.signal })
      clearTimeout(timer)
      const data = await res.json()

      if (data.unsignedTransactionBytes) {
        return makeSignLink(data.unsignedTransactionBytes)
      }
      throw new Error(data.errorDescription || `Ошибка ноды: код ${data.errorCode}`)
    } catch (e) {
      lastErr = e
      console.warn(`[buildSignDeepLink] ${node.name} failed:`, e.message)
    }
  }

  throw lastErr || new Error(tErr('build_tx_error'))
}

function makeSignLink(unsignedTransactionBytes) {
  const callbackUrl = window.location.origin + '/'
  // SRC-22 spec: raw base64 in URL — wallet uses atob() directly, no decodeURIComponent
  const payload = btoa(JSON.stringify({ unsignedTransactionBytes, callbackUrl }))
  return `signum://v1?action=sign&payload=${payload}`
}

// Phoenix Wallet (CIP-22): action=pay with pre-filled form fields
export function buildPayPaymentLinks(quantity) {
  const amountNQT = Math.round((quantity * VGB_PRICE_SIGNA + VGB_SERVICE_FEE_SIGNA) * 1e8)
  const feeNQT = Math.round(VGB_FEE_SIGNA * 1e8)
  const payload = encodeURIComponent(btoa(JSON.stringify({
    recipient: VGB_CONTRACT_RS,
    amountPlanck: String(amountNQT),
    feePlanck: String(feeNQT),
    immutable: false,
  })))
  return [
    { label: 'Phoenix Wallet (1)', url: `signum://v1?action=pay&payload=${payload}` },
    { label: 'Phoenix Wallet (2)', url: `signum://requestBurst?receiver=${VGB_CONTRACT_RS}&amountNQT=${amountNQT}&feeNQT=${feeNQT}` },
    { label: 'Phoenix Wallet (3)', url: `burst://v1?action=pay&payload=${payload}` },
    { label: 'Phoenix Wallet (4)', url: `burst://requestBurst?receiver=${VGB_CONTRACT_RS}&amountNQT=${amountNQT}&feeNQT=${feeNQT}` },
  ]
}

export function buildAllPaymentLinks(quantity) { return buildPayPaymentLinks(quantity) }
export function buildPaymentLink(quantity) { return buildPayPaymentLinks(quantity)[2].url }
export function buildPaymentLinkLegacy(quantity) { return buildPayPaymentLinks(quantity)[3].url }
// ── Signum XT Wallet (browser extension) ─────────────────────────────────
// Uses window.postMessage protocol defined in signum-xt-wallet contentScript

const XT_CODE_TO_KEY = {
  INVALID_NETWORK: 'xt_invalid_network',
  NOT_GRANTED: 'xt_not_granted',
  NOT_FOUND: 'xt_not_found',
  INVALID_PARAMS: 'xt_invalid_params',
}

function xtPageMessage(payload, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const reqId = Math.random().toString(36).slice(2)
    const handler = (e) => {
      if (!e.data || e.data.reqId !== reqId) return
      // window.postMessage echoes back to same-page listeners — ignore our own outgoing request
      if (e.data.type !== 'SIGNUM_PAGE_RESPONSE' && e.data.type !== 'SIGNUM_PAGE_ERROR_RESPONSE') return
      window.removeEventListener('message', handler)
      clearTimeout(timer)
      if (e.data.type === 'SIGNUM_PAGE_RESPONSE') resolve(e.data.payload)
      else {
        // serializeError in XT Wallet returns a plain string (e.g. 'INVALID_NETWORK'), not an object
        const raw = typeof e.data.payload === 'string' ? e.data.payload
          : Array.isArray(e.data.payload) ? e.data.payload[0]
          : e.data.payload?.message || 'unknown error'
        const key = XT_CODE_TO_KEY[raw]
        reject(new Error(key ? tErr(key) : `XT Wallet: ${raw}`))
      }
    }
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler)
      reject(new Error(tErr('xt_timeout')))
    }, timeoutMs)
    window.addEventListener('message', handler)
    window.postMessage({ type: 'SIGNUM_PAGE_REQUEST', payload, reqId }, '*')
  })
}

export async function buyVGBWithXT(quantity) {
  // 1. Request permission — get public key and current node from extension
  const permission = await xtPageMessage({
    type: 'PERMISSION_REQUEST',
    network: 'Signum',
    appMeta: { name: 'ZTH Tracker' },
  })

  if (permission.watchOnly) throw new Error(tErr('xt_watch_only'))
  const publicKey = permission.publicKey
  if (!publicKey) throw new Error(tErr('xt_no_pubkey'))

  // Use the wallet's current node to build the tx — cashBackId in the bytes must match
  // the same node the wallet uses for validation, otherwise: "cash back ID mismatch"
  const walletNode = permission.currentNodeHost || signumClient.activeNode.url

  // 2. Build unsigned transaction via Vercel proxy, forcing wallet's node
  const amountNQT = Math.round((quantity * VGB_PRICE_SIGNA + VGB_SERVICE_FEE_SIGNA) * 1e8)
  const feeNQT = Math.round(VGB_FEE_SIGNA * 1e8)
  const params = {
    requestType: 'sendMoney',
    recipient: VGB_CONTRACT_NUMERIC,
    amountNQT: String(amountNQT),
    feeNQT: String(feeNQT),
    publicKey,
    deadline: '1440',
    broadcast: 'false',
  }
  const qs = new URLSearchParams({ ...params, node: walletNode }).toString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  let res, data
  try {
    res = await fetch(`/api/proxy?${qs}`, { signal: controller.signal })
    data = await res.json()
  } finally {
    clearTimeout(timer)
  }
  if (!data.unsignedTransactionBytes) {
    throw new Error(data.errorDescription || `Ошибка построения транзакции (код ${data.errorCode ?? res?.status})`)
  }

  // 3. Sign & broadcast via XT Wallet (user confirms in extension popup)
  const result = await xtPageMessage({ type: 'SIGN_REQUEST', payload: data.unsignedTransactionBytes }, 60000)
  return result // { transactionId, fullHash }
}
