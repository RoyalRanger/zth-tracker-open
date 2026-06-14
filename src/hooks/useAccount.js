import { useState, useCallback, useEffect } from 'react'
import {
  signumClient,
  ZTH_ASSET_ID,
  VGB_ASSET_ID,
  formatZth,
  formatVgb,
  formatSigna,
  toDate,
} from '../api/signum.js'
import { getPrices } from '../api/price.js'

const STORAGE_KEY = 'zth_address'
const PAGE_SIZE = 10

export function useAccount() {
  const [address, setAddress] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [pages, setPages] = useState({ zth: 0, vgb: 0, signa: 0 })
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState({ zth: true, vgb: true, signa: true })
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) fetchAccount(saved)
  }, []) // eslint-disable-line

  const loadTransactions = useCallback(async (accountNumeric) => {
    setTxLoading(true)
    setTxError(null)
    try {
      const [zthRes, vgbRes, signaRes, distItems, signaDistItems] = await Promise.all([
        signumClient.getAssetTransfers(ZTH_ASSET_ID, accountNumeric, 0, PAGE_SIZE - 1),
        signumClient.getAssetTransfers(VGB_ASSET_ID, accountNumeric, 0, PAGE_SIZE - 1),
        signumClient.getSignaTransactions(accountNumeric, 0, PAGE_SIZE - 1),
        signumClient.getZthDistributions(accountNumeric, PAGE_SIZE).catch(() => []),
        signumClient.getSignaDistributions(accountNumeric, PAGE_SIZE).catch(() => []),
      ])

      const zthTx = parseAssetTransfers(zthRes.transfers || [], accountNumeric, 'ZTH')
      const vgbTx = parseAssetTransfers(vgbRes.transfers || [], accountNumeric, 'VGB')
      const signaTx = parseSignaTx(signaRes.transactions || [], accountNumeric)
      const distTx = parseZthDistributions(distItems)
      const signaDistTx = parseSignaDistributions(signaDistItems)

      setData(prev => ({ ...prev, transfers: mergeSortByDate([...zthTx, ...vgbTx, ...signaTx, ...distTx, ...signaDistTx]) }))
      setHasMore({
        zth: (zthRes.transfers || []).length === PAGE_SIZE,
        vgb: (vgbRes.transfers || []).length === PAGE_SIZE,
        signa: (signaRes.transactions || []).length === PAGE_SIZE,
      })
    } catch (e) {
      setTxError(e.message || 'Ошибка загрузки транзакций')
    } finally {
      setTxLoading(false)
    }
  }, [])

  const fetchAccount = useCallback(async (addr) => {
    setLoading(true)
    setError(null)
    setTxError(null)
    setPages({ zth: 0, vgb: 0, signa: 0 })
    setHasMore({ zth: true, vgb: true, signa: true })

    try {
      const [accountRes, prices] = await Promise.all([
        signumClient.getAccount(addr),
        getPrices(),
      ])

      const assetBalances = accountRes.assetBalances || []
      const zthEntry = assetBalances.find(a => a.asset === ZTH_ASSET_ID)
      const vgbEntry = assetBalances.find(a => a.asset === VGB_ASSET_ID)

      setData({
        accountRS: accountRes.accountRS,
        account: accountRes.account,
        publicKey: accountRes.publicKey || null,
        signa: formatSigna(accountRes.balanceNQT || '0'),
        zth: formatZth(zthEntry?.balanceQNT || '0'),
        vgb: formatVgb(vgbEntry?.balanceQNT || '0'),
        transfers: [],
        prices,
      })
      setLoading(false)

      await loadTransactions(accountRes.account)
    } catch (e) {
      setError(e.message || 'Ошибка загрузки')
      setLoading(false)
    }
  }, [loadTransactions])

  const retryTransactions = useCallback(() => {
    if (data?.account) loadTransactions(data.account)
  }, [data, loadTransactions])

  const loadMoreTransfers = useCallback(async () => {
    if (!data || loadingMore) return
    setLoadingMore(true)

    const nextPages = {
      zth: pages.zth + 1,
      vgb: pages.vgb + 1,
      signa: pages.signa + 1,
    }

    try {
      const [zthRes, vgbRes, signaRes] = await Promise.all([
        hasMore.zth
          ? signumClient.getAssetTransfers(ZTH_ASSET_ID, data.account, nextPages.zth * PAGE_SIZE, nextPages.zth * PAGE_SIZE + PAGE_SIZE - 1)
          : { transfers: [] },
        hasMore.vgb
          ? signumClient.getAssetTransfers(VGB_ASSET_ID, data.account, nextPages.vgb * PAGE_SIZE, nextPages.vgb * PAGE_SIZE + PAGE_SIZE - 1)
          : { transfers: [] },
        hasMore.signa
          ? signumClient.getSignaTransactions(data.account, nextPages.signa * PAGE_SIZE, nextPages.signa * PAGE_SIZE + PAGE_SIZE - 1)
          : { transactions: [] },
      ])

      const newZth = parseAssetTransfers(zthRes.transfers || [], data.account, 'ZTH')
      const newVgb = parseAssetTransfers(vgbRes.transfers || [], data.account, 'VGB')
      const newSigna = parseSignaTx(signaRes.transactions || [], data.account)

      setData(prev => ({ ...prev, transfers: [...prev.transfers, ...mergeSortByDate([...newZth, ...newVgb, ...newSigna])] }))
      setPages(nextPages)
      setHasMore({
        zth: (zthRes.transfers || []).length === PAGE_SIZE,
        vgb: (vgbRes.transfers || []).length === PAGE_SIZE,
        signa: (signaRes.transactions || []).length === PAGE_SIZE,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }, [data, pages, hasMore, loadingMore])

  const anyHasMore = hasMore.zth || hasMore.vgb || hasMore.signa

  const refresh = useCallback(async () => {
    if (!address) return
    await fetchAccount(address)
  }, [address, fetchAccount])

  const connect = useCallback(async (addr) => {
    const clean = addr.trim().toUpperCase()
    setAddress(clean)
    localStorage.setItem(STORAGE_KEY, clean)
    await fetchAccount(clean)
  }, [fetchAccount])

  const disconnect = useCallback(() => {
    setAddress('')
    localStorage.removeItem(STORAGE_KEY)
    setData(null)
    setError(null)
    setTxError(null)
    setPages({ zth: 0, vgb: 0, signa: 0 })
    setHasMore({ zth: true, vgb: true, signa: true })
  }, [])

  return {
    address,
    loading,
    error,
    data,
    hasMore: anyHasMore,
    loadingMore,
    txLoading,
    txError,
    connect,
    disconnect,
    refresh,
    loadMoreTransfers,
    retryTransactions,
  }
}

function parseAssetTransfers(transfers, userAccount, tokenType) {
  return transfers.map(t => ({
    id: `${tokenType}-${t.assetTransfer}`,
    date: toDate(t.timestamp),
    type: tokenType,
    amount: tokenType === 'ZTH' ? formatZth(t.quantityQNT) : formatVgb(t.quantityQNT),
    fromRS: t.senderRS,
    toRS: t.recipientRS,
    incoming: t.recipient === userAccount,
    height: t.height,
  }))
}

function parseSignaTx(transactions, userAccount) {
  return transactions.map(t => ({
    id: `SIGNA-${t.transaction}`,
    date: toDate(t.timestamp),
    type: 'SIGNA',
    amount: formatSigna(t.amountNQT || '0'),
    fromRS: t.senderRS,
    toRS: t.recipientRS,
    incoming: t.recipient === userAccount,
    height: t.height,
  }))
}

function parseZthDistributions(distributions) {
  return distributions.map(({ tx, quantityQNT }) => ({
    id: `ZTH-DIST-${tx.transaction}`,
    date: toDate(tx.timestamp),
    type: 'ZTH',
    amount: formatZth(quantityQNT),
    fromRS: tx.senderRS,
    toRS: '',
    incoming: true,
    height: tx.height,
  }))
}

function parseSignaDistributions(distributions) {
  return distributions.map(({ tx, amountNQT }) => ({
    id: `SIGNA-DIST-${tx.transaction}`,
    date: toDate(tx.timestamp),
    type: 'SIGNA',
    amount: formatSigna(amountNQT),
    fromRS: tx.senderRS,
    toRS: '',
    incoming: true,
    height: tx.height,
  }))
}

function mergeSortByDate(items) {
  return items.sort((a, b) => b.date - a.date)
}
