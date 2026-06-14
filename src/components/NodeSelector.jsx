import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../i18n/LangContext.jsx'

export default function NodeSelector({ nodes, activeIndex, pings, pinging, onSwitch, onAdd, onRemove, onPingAll, onRetry }) {
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const [customUrl, setCustomUrl] = useState('')
  const [customName, setCustomName] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)
  const btnRef = useRef(null)
  const { t } = useLang()

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setDropdownPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    const close = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        const portal = document.getElementById('node-dropdown-portal')
        if (portal && portal.contains(e.target)) return
        setOpen(false)
      }
    }
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', close)
      window.addEventListener('resize', updatePos)
      window.addEventListener('scroll', updatePos, true)
    }, 50)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open, updatePos])

  const activeNode = nodes[activeIndex] || nodes[0]

  const handleSwitch = (i) => {
    onSwitch(i)
    setOpen(false)
    if (onRetry) setTimeout(onRetry, 100)
  }

  const handleAddCustom = () => {
    const raw = customUrl.trim()
    if (!raw) return
    const url = raw.startsWith('http') ? raw : `https://${raw}`
    onAdd(url, customName.trim() || 'Custom')
    setCustomUrl('')
    setCustomName('')
    setAddingCustom(false)
    setOpen(false)
    if (onRetry) setTimeout(onRetry, 100)
  }

  const pingColor = (i) => {
    const p = pings[i]
    if (p === undefined) return '#64748b'
    if (p === null) return '#f87171'
    if (p < 300) return '#34d399'
    if (p < 800) return '#fbbf24'
    return '#f87171'
  }

  const dropdown = open && createPortal(
    <>
      <div
        id="node-dropdown-portal"
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onPointerDown={() => setOpen(false)}
      />
      <div
        style={{
          position: 'fixed',
          top: dropdownPos.top,
          right: dropdownPos.right,
          width: 280,
          zIndex: 9999,
          background: '#0a1020',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: 16,
          padding: 12,
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Signum Nodes
          </span>
          <button
            type="button"
            onPointerDown={e => { e.stopPropagation(); onPingAll() }}
            disabled={pinging}
            style={{ fontSize: 12, fontWeight: 600, color: pinging ? '#334155' : '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {pinging ? 'Pinging...' : 'Ping all'}
          </button>
        </div>

        {/* Node list */}
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {nodes.map((node, i) => (
            <button
              key={node.url}
              type="button"
              onPointerDown={e => { e.stopPropagation(); handleSwitch(i) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                marginBottom: 2,
                background: i === activeIndex ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: `1px solid ${i === activeIndex ? 'rgba(0,212,255,0.25)' : 'transparent'}`,
                color: i === activeIndex ? '#f8fafc' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 18 }}>{node.region}</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{node.name}</span>
              {pings[i] !== undefined && (
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: pingColor(i) }}>
                  {pings[i] === null ? 'offline' : `${pings[i]}ms`}
                </span>
              )}
              {i === activeIndex && (
                <svg width="16" height="16" fill="#00d4ff" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {node.custom && i !== activeIndex && (
                <button
                  type="button"
                  onPointerDown={e => { e.stopPropagation(); onRemove(node.url) }}
                  style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Add custom */}
        <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!addingCustom ? (
            <button
              type="button"
              onPointerDown={e => { e.stopPropagation(); setAddingCustom(true) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '10px 0', fontSize: 12, color: '#475569',
                background: 'none', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('add_node')}
            </button>
          ) : (
            <div onPointerDown={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder={t('node_name')}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 12, color: '#fff',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://your.node.com"
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 12, color: '#fff',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onPointerDown={e => { e.stopPropagation(); handleAddCustom() }}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 700,
                    background: 'linear-gradient(135deg,#00d4ff,#0099cc)', color: '#030712',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  {t('add')}
                </button>
                <button
                  type="button"
                  onPointerDown={e => { e.stopPropagation(); setAddingCustom(false); setCustomUrl(''); setCustomName('') }}
                  style={{
                    padding: '10px 16px', fontSize: 12, color: '#94a3b8',
                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onPointerDown={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
          background: open ? 'rgba(0,212,255,0.1)' : 'rgba(13,21,38,0.9)',
          border: `1px solid ${open ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize: 16 }}>{activeNode?.region}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeNode?.name}
        </span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', flexShrink: 0 }} />
        <svg
          width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown}
    </>
  )
}
