'use client'

import { useState, useCallback } from 'react'
import { Nodo, Conexion, TipoNodo } from '@/types'

interface ModoVentaProps {
  nodos: Nodo[]
  conexiones: Conexion[]
}

const TIPO_COLOR: Record<TipoNodo, string> = {
  inicio: '#6D28D9',  // violet-700
  yo: '#1D4ED8',      // blue-700
  cliente: '#047857', // emerald-700
}

function darken15(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const d = (v: number) => Math.max(0, Math.round(v * 0.85))
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`
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

function renderWappText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <strong key={i} className="font-bold">{part.slice(1, -1)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function ModoVenta({ nodos, conexiones }: ModoVentaProps) {
  const rootNode = nodos.find((n) => n.tipo === 'inicio') ?? nodos[0] ?? null
  const [currentId, setCurrentId] = useState<string | null>(rootNode?.id ?? null)
  const [history, setHistory] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

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

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    }
  }, [])

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-app-border" style={{ background: 'var(--bg-surface)' }}>
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 text-sm text-app-muted hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
        <span className="text-app-border">|</span>
        <button
          onClick={handleReset}
          className="text-sm text-app-muted hover:text-app-text transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          Inicio
        </button>
        <div className="ml-auto text-xs text-app-muted font-mono">
          Paso {history.length + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {/* Current node card */}
          <div
            className="p-5"
            style={{
              background: borderColor,
              borderRadius: 'var(--radius-card)',
              boxShadow: `0 8px 20px -4px ${darken15(borderColor)}, 0 3px 8px -2px ${darken15(borderColor)}`,
              color: '#ffffff',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <TipoBadge tipo={currentNode.tipo} color="rgba(255,255,255,0.9)" />
              {(currentNode.tipo === 'yo' || currentNode.tipo === 'inicio') && (
                <button
                  onClick={() => handleCopy(currentNode.texto, currentNode.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-all"
                  style={{
                    background: copied === currentNode.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  {copied === currentNode.id ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copiar
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-white text-base leading-relaxed wapp-text whitespace-pre-wrap">
              {renderWappText(currentNode.texto)}
            </p>
          </div>

          {/* Next options */}
          {nextNodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-app-muted uppercase tracking-wider font-semibold px-1">
                Respuestas posibles
              </p>
              {nextNodes.map((node) => {
                const nc = TIPO_COLOR[node.tipo] ?? '#94a3b8'
                return (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(node.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate(node.id)}
                    className="w-full text-left p-4 transition-all group cursor-pointer"
                    style={{
                      background: nc,
                      borderRadius: 'var(--radius-card)',
                      boxShadow: `0 6px 16px -4px ${darken15(nc)}, 0 2px 6px -2px ${darken15(nc)}`,
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.filter = ''
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <TipoBadge tipo={node.tipo} color="rgba(255,255,255,0.9)" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(node.texto, node.id)
                        }}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.4)',
                          borderRadius: 'var(--radius-btn)',
                        }}
                      >
                        {copied === node.id ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-white text-sm leading-relaxed wapp-text whitespace-pre-wrap flex-1">
                        {renderWappText(node.texto)}
                      </span>
                      <svg
                        className="w-4 h-4 text-white/60 group-hover:text-white shrink-0 mt-0.5 transition-colors"
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
    </div>
  )
}
