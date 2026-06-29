'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Nodo, Conexion, TipoNodo } from '@/types'

interface ModoVentaProps {
  nodos: Nodo[]
  conexiones: Conexion[]
  jumpNode?: string | null
  jumpNonce?: number
}

const TIPO_COLOR: Record<TipoNodo, string> = {
  inicio: '#1B3A8C',  // Fishwife deep navy
  yo: '#0D6B5A',      // Fishwife forest teal
  cliente: '#B83A10', // Fishwife warm red
}

const VARS_STORAGE_KEY = 'copyflow-variables'
const USAGE_STORAGE_KEY = 'copyflow-usage'
const USAGE_META_STORAGE_KEY = 'copyflow-usage-meta'
const FONTSCALE_STORAGE_KEY = 'copyflow-venta-fontscale'

// Detect {variable} tokens across the kit's text.
function extractVars(nodos: Nodo[]): string[] {
  const set = new Set<string>()
  const re = /\{([^}]+)\}/g
  for (const n of nodos) {
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(n.texto))) {
      const name = m[1].trim()
      if (name) set.add(name)
    }
  }
  return Array.from(set)
}

// Replace {var} with its value for copying (unfilled vars keep their token).
function fillVars(text: string, values: Record<string, string>): string {
  return text.replace(/\{([^}]+)\}/g, (_, k) => {
    const v = values[k.trim()]
    return v && v.trim() ? v : `{${k.trim()}}`
  })
}

function TipoBadge({ tipo, color }: { tipo: TipoNodo; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ background: 'rgba(255,255,255,0.2)', color, backdropFilter: 'blur(4px)' }}
    >
      {tipo === 'inicio' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      ) : tipo === 'yo' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      )}
      {tipo === 'inicio' ? 'Inicio' : tipo === 'yo' ? 'Yo' : 'Cliente'}
    </span>
  )
}

// Usage pill (how many times this message was copied/used).
function UsageBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
      title={`Usado ${count} ${count === 1 ? 'vez' : 'veces'}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      {count}
    </span>
  )
}

// Render WhatsApp *bold* plus {variables} (filled or highlighted if empty).
function renderText(text: string, values: Record<string, string>) {
  const parts = text.split(/(\*[^*]+\*|\{[^}]+\})/g)
  return parts.map((part, i) => {
    if (/^\*[^*]+\*$/.test(part)) {
      return <strong key={i} className="font-bold">{part.slice(1, -1)}</strong>
    }
    if (/^\{[^}]+\}$/.test(part)) {
      const key = part.slice(1, -1).trim()
      const val = values[key]
      if (val && val.trim()) return <span key={i}>{val}</span>
      return (
        <span key={i} className="px-1 rounded font-semibold" style={{ background: 'rgba(255,255,255,0.28)' }}>
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function ModoVenta({ nodos, conexiones, jumpNode, jumpNonce }: ModoVentaProps) {
  const rootNode = nodos.find((n) => n.tipo === 'inicio') ?? nodos[0] ?? null
  const [currentId, setCurrentId] = useState<string | null>(jumpNode ?? rootNode?.id ?? null)
  const [history, setHistory] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [varsOpen, setVarsOpen] = useState(false)
  const [usage, setUsage] = useState<Record<string, number>>({})
  const [fontScale, setFontScale] = useState(1)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const varNames = useMemo(() => extractVars(nodos), [nodos])

  // Load persisted variable values + usage counts + text size.
  useEffect(() => {
    try {
      const v = localStorage.getItem(VARS_STORAGE_KEY)
      if (v) setVarValues(JSON.parse(v))
      const u = localStorage.getItem(USAGE_STORAGE_KEY)
      if (u) setUsage(JSON.parse(u))
      const f = localStorage.getItem(FONTSCALE_STORAGE_KEY)
      if (f) setFontScale(Math.min(1.5, Math.max(0.85, parseFloat(f) || 1)))
    } catch { /* ignore */ }
  }, [])

  const changeFontScale = useCallback((delta: number) => {
    setFontScale((s) => {
      const next = Math.min(1.5, Math.max(0.85, Math.round((s + delta) * 100) / 100))
      try { localStorage.setItem(FONTSCALE_STORAGE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Jump to a node coming from global search (resets the step path).
  useEffect(() => {
    if (jumpNode) {
      setHistory([])
      setCurrentId(jumpNode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpNonce])

  const setVar = useCallback((name: string, value: string) => {
    setVarValues((prev) => {
      const next = { ...prev, [name]: value }
      try { localStorage.setItem(VARS_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const bumpUsage = useCallback((id: string) => {
    setUsage((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 }
      try { localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const currentNode = nodos.find((n) => n.id === currentId)

  const nextIds = conexiones
    .filter((c) => c.nodo_origen_id === currentId)
    .map((c) => c.nodo_destino_id)

  const nextNodes = nextIds
    .map((id) => nodos.find((n) => n.id === id))
    .filter(Boolean) as Nodo[]

  const handleNavigate = useCallback((nodeId: string) => {
    setHistory((h) => [...h, currentId!])
    setCurrentId(nodeId)
  }, [currentId])

  const handleBack = useCallback(() => {
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setCurrentId(prev)
  }, [history])

  const handleReset = useCallback(() => {
    setHistory([])
    setCurrentId(rootNode?.id ?? null)
  }, [rootNode])

  // Jump straight to any node from search (resets the step path).
  const handleJump = useCallback((nodeId: string) => {
    setHistory([])
    setCurrentId(nodeId)
    setSearchOpen(false)
    setSearchQ('')
  }, [])

  const writeClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }, [])

  const handleCopy = useCallback(async (rawText: string, id: string) => {
    const text = fillVars(rawText, varValues)
    bumpUsage(id)
    // Keep a text snapshot per node for the usage stats view.
    try {
      const metaRaw = localStorage.getItem(USAGE_META_STORAGE_KEY)
      const meta = metaRaw ? JSON.parse(metaRaw) : {}
      const node = nodos.find((n) => n.id === id)
      meta[id] = { text: node?.texto ?? rawText, tipo: node?.tipo ?? 'yo' }
      localStorage.setItem(USAGE_META_STORAGE_KEY, JSON.stringify(meta))
    } catch { /* ignore */ }
    await writeClipboard(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }, [varValues, bumpUsage, nodos, writeClipboard])

  // Copy the full pitch: every "yo"/"inicio" message along the current path.
  const handleCopyConversation = useCallback(async () => {
    const path = [...history, currentId].filter(Boolean) as string[]
    const msgs = path
      .map((id) => nodos.find((n) => n.id === id))
      .filter((n): n is Nodo => !!n && (n.tipo === 'yo' || n.tipo === 'inicio'))
      .map((n) => fillVars(n.texto, varValues))
    if (msgs.length === 0) return
    await writeClipboard(msgs.join('\n\n'))
    setCopied('__all__')
    setTimeout(() => setCopied(null), 2000)
  }, [history, currentId, nodos, varValues, writeClipboard])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return nodos.slice(0, 12)
    return nodos.filter((n) => n.texto.toLowerCase().includes(q)).slice(0, 20)
  }, [searchQ, nodos])

  // Keyboard shortcuts (desktop power use). Ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable
      if (typing) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const cur = nodos.find((n) => n.id === currentId)

      if (e.key === '/') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        if (history.length > 0) handleBack()
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        handleReset()
        return
      }
      if (e.key === 'c' || e.key === 'C') {
        if (cur && (cur.tipo === 'yo' || cur.tipo === 'inicio')) handleCopy(cur.texto, cur.id)
        return
      }
      if (/^[1-9]$/.test(e.key)) {
        const target = nextNodes[parseInt(e.key, 10) - 1]
        if (target) handleNavigate(target.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nodos, currentId, history.length, nextNodes, handleBack, handleReset, handleCopy, handleNavigate])

  if (!currentNode) {
    return (
      <div className="flex-1 flex items-center justify-center text-app-muted">
        <div className="text-center">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-base">No hay nodos en este kit.</p>
          <p className="text-sm mt-1">Ve al modo editor para crear el flujo.</p>
        </div>
      </div>
    )
  }

  const borderColor = TIPO_COLOR[currentNode.tipo] ?? '#94a3b8'
  // count how many variables still have no value
  const missingVars = varNames.filter((v) => !(varValues[v] && varValues[v].trim())).length

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 border-b border-app-border" style={{ background: 'var(--bg-surface)' }}>
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 text-sm text-app-muted hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-2 -ml-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
        <span className="text-app-border">|</span>
        <button
          onClick={handleReset}
          className="text-sm text-app-muted hover:text-app-text transition-colors flex items-center gap-1.5 px-2 py-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          Inicio
        </button>

        <div className="ml-auto flex items-center gap-1">
          {/* Text size A- / A+ */}
          <div className="flex items-center rounded-lg border border-app-border overflow-hidden">
            <button
              onClick={() => changeFontScale(-0.1)}
              disabled={fontScale <= 0.85}
              className="px-2 py-1.5 text-app-muted hover:text-app-text hover:bg-app-surface-2 disabled:opacity-30 transition-colors text-xs font-bold"
              title="Texto más chico"
            >A−</button>
            <button
              onClick={() => changeFontScale(0.1)}
              disabled={fontScale >= 1.5}
              className="px-2 py-1.5 text-app-muted hover:text-app-text hover:bg-app-surface-2 disabled:opacity-30 transition-colors text-sm font-bold border-l border-app-border"
              title="Texto más grande"
            >A+</button>
          </div>
          <button
            onClick={handleCopyConversation}
            className={`p-2 rounded-lg transition-colors ${copied === '__all__' ? 'bg-brand text-white' : 'text-app-muted hover:text-app-text hover:bg-app-surface-2'}`}
            title="Copiar toda la conversación (mis mensajes del recorrido)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>
          </button>
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className={`p-2 rounded-lg transition-colors ${searchOpen ? 'bg-brand text-white' : 'text-app-muted hover:text-app-text hover:bg-app-surface-2'}`}
            title="Buscar mensaje y saltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <span className="hidden sm:inline text-xs text-app-muted font-mono pl-1">Paso {history.length + 1}</span>
        </div>
      </div>

      {/* Inline search & jump */}
      {searchOpen && (
        <div className="border-b border-app-border" style={{ background: 'var(--bg-surface)' }}>
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2">
            <input
              ref={searchRef}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setSearchOpen(false); setSearchQ('') }
                if (e.key === 'Enter' && searchResults[0]) handleJump(searchResults[0].id)
              }}
              placeholder="Buscar mensaje y saltar a él..."
              className="w-full px-3 py-2.5 rounded-xl border bg-app-surface-2 text-app-text placeholder:text-app-muted text-sm outline-none focus:border-brand"
              style={{ borderColor: 'var(--border)' }}
            />
            {(searchQ.trim() || searchResults.length > 0) && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-app-border divide-y divide-app-border">
                {searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-app-muted">Sin resultados</div>
                ) : searchResults.map((n) => {
                  const c = TIPO_COLOR[n.tipo]
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleJump(n.id)}
                      className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-app-surface-2 transition-colors"
                    >
                      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0" style={{ background: `${c}22`, color: c }}>
                        {n.tipo}
                      </span>
                      <span className="text-sm text-app-text line-clamp-2 flex-1">{n.texto || '(vacío)'}</span>
                      {usage[n.id] ? <span className="text-[11px] text-app-muted shrink-0">×{usage[n.id]}</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-3 sm:space-y-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
        >
          {/* Variables panel (collapsed by default) */}
          {varNames.length > 0 && (
            <div className="rounded-xl border border-app-border overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
              <button
                onClick={() => setVarsOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                <span className="text-sm font-semibold text-app-text">Variables</span>
                {missingVars > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-brand/15 text-brand font-semibold">{missingVars} sin llenar</span>
                )}
                <svg className={`ml-auto w-4 h-4 text-app-muted transition-transform ${varsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {varsOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {varNames.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <label className="text-xs text-app-muted font-mono w-24 shrink-0 truncate" title={name}>{`{${name}}`}</label>
                      <input
                        value={varValues[name] ?? ''}
                        onChange={(e) => setVar(name, e.target.value)}
                        placeholder={`Valor de ${name}`}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border bg-app-surface-2 text-app-text placeholder:text-app-muted text-sm outline-none focus:border-brand"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current node card */}
          <div
            className="p-4 sm:p-5"
            style={{
              background: borderColor,
              borderRadius: 'var(--radius-card)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#ffffff',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <TipoBadge tipo={currentNode.tipo} color="rgba(255,255,255,0.9)" />
                <UsageBadge count={usage[currentNode.id] ?? 0} />
              </div>
              {(currentNode.tipo === 'yo' || currentNode.tipo === 'inicio') && (
                <button
                  onClick={() => handleCopy(currentNode.texto, currentNode.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 min-h-[40px] transition-colors shrink-0 active:scale-95"
                  style={{
                    background: copied === currentNode.id ? 'rgba(255,255,255,0.25)' : '#ffffff',
                    color: copied === currentNode.id ? '#ffffff' : borderColor,
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  {copied === currentNode.id ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copiar
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-white leading-relaxed wapp-text whitespace-pre-wrap" style={{ fontSize: `${Math.round(16 * fontScale)}px` }}>
              {renderText(currentNode.texto, varValues)}
            </p>
          </div>

          {/* Next options */}
          {nextNodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-app-muted uppercase tracking-wider font-semibold px-1">
                Respuestas posibles
              </p>
              {nextNodes.map((node, i) => {
                const nc = TIPO_COLOR[node.tipo] ?? '#94a3b8'
                return (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(node.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate(node.id)}
                    className="w-full text-left p-4 transition-colors cursor-pointer active:brightness-110"
                    style={{
                      background: nc,
                      borderRadius: 'var(--radius-card)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: '#ffffff',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {i < 9 && (
                          <span
                            className="hidden sm:flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold shrink-0"
                            style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}
                            title={`Atajo: tecla ${i + 1}`}
                          >
                            {i + 1}
                          </span>
                        )}
                        <TipoBadge tipo={node.tipo} color="rgba(255,255,255,0.9)" />
                        <UsageBadge count={usage[node.id] ?? 0} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(node.texto, node.id)
                        }}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 min-h-[40px] transition-colors shrink-0 active:scale-95"
                        style={{
                          background: copied === node.id ? 'rgba(255,255,255,0.25)' : '#ffffff',
                          color: copied === node.id ? '#ffffff' : nc,
                          borderRadius: 'var(--radius-btn)',
                        }}
                      >
                        {copied === node.id ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-white leading-relaxed wapp-text whitespace-pre-wrap flex-1" style={{ fontSize: `${Math.round(14 * fontScale)}px` }}>
                        {renderText(node.texto, varValues)}
                      </span>
                      <svg
                        className="w-5 h-5 text-white/70 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {nextNodes.length === 0 && (
            <div className="text-center py-6 text-app-muted text-sm">
              <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Fin del flujo
            </div>
          )}
        </div>
      </div>

      {/* Copy confirmation toast */}
      <div
        className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
          copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{ background: '#0D6B5A', bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
        role="status"
        aria-live="polite"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Copiado al portapapeles
      </div>
    </div>
  )
}
