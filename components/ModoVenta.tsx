'use client'

import { useState, useCallback } from 'react'
import { Nodo, Conexion } from '@/types'

interface ModoVentaProps {
  nodos: Nodo[]
  conexiones: Conexion[]
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
      // Fallback
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
      <div className="flex-1 flex items-center justify-center text-[#555]">
        <div className="text-center">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-lg">No hay nodos en este kit.</p>
          <p className="text-sm mt-1">Ve al modo editor para crear el flujo.</p>
        </div>
      </div>
    )
  }

  const colorMap = {
    inicio: '#EC4899',
    yo: '#3B82F6',
    cliente: '#F97316',
  }

  const borderColor = colorMap[currentNode.tipo] ?? '#555'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#222] bg-[#111]">
        <button
          onClick={handleBack}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 text-sm text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
        <span className="text-[#333]">|</span>
        <button
          onClick={handleReset}
          className="text-sm text-[#888] hover:text-white transition-colors"
        >
            <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Inicio
          </span>
        </button>
        <div className="ml-auto text-xs text-[#444] font-mono">
          Paso {history.length + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {/* Current node card */}
          <div
            className="rounded-2xl p-5 shadow-lg relative"
            style={{
              background: `linear-gradient(135deg, ${borderColor}15 0%, #1a1a1a 100%)`,
              border: `1px solid ${borderColor}40`,
            }}
          >
            {/* Type badge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: `${borderColor}25`, color: borderColor }}
              >
                {currentNode.tipo === 'inicio' ? (
                  <span className="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Inicio
                  </span>
                ) : currentNode.tipo === 'yo' ? (
                  <span className="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Yo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Cliente
                  </span>
                )}
              </span>
              {(currentNode.tipo === 'yo' || currentNode.tipo === 'inicio') && (
                <button
                  onClick={() => handleCopy(currentNode.texto, currentNode.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: copied === currentNode.id ? '#16a34a20' : `${borderColor}20`,
                    color: copied === currentNode.id ? '#22c55e' : borderColor,
                    border: `1px solid ${copied === currentNode.id ? '#22c55e40' : `${borderColor}40`}`,
                  }}
                >
                  {copied === currentNode.id ? (
                    <span className="inline-flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Copiado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copiar
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Text */}
            <p className="text-white text-base leading-relaxed wapp-text whitespace-pre-wrap">
              {renderWappText(currentNode.texto)}
            </p>
          </div>

          {/* Next options */}
          {nextNodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[#555] uppercase tracking-wider font-semibold px-1">
                Respuestas posibles
              </p>
              {nextNodes.map((node) => {
                const nc = colorMap[node.tipo] ?? '#555'
                return (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(node.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate(node.id)}
                    className="w-full text-left rounded-xl p-4 transition-all group cursor-pointer"
                    style={{ background: `${nc}10`, border: `1px solid ${nc}30` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${nc}20`
                      e.currentTarget.style.borderColor = `${nc}60`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${nc}10`
                      e.currentTarget.style.borderColor = `${nc}30`
                    }}
                  >
                    {/* Header row: badge + copy button */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: `${nc}25`, color: nc }}
                      >
                        {node.tipo === 'yo' ? (
                          <span className="inline-flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Yo
                          </span>
                        ) : node.tipo === 'inicio' ? (
                          <span className="inline-flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Inicio
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Cliente
                          </span>
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(node.texto, node.id)
                        }}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{
                          background: copied === node.id ? '#16a34a20' : `${nc}20`,
                          color: copied === node.id ? '#22c55e' : nc,
                          border: `1px solid ${copied === node.id ? '#22c55e40' : `${nc}40`}`,
                        }}
                      >
                        {copied === node.id ? (
                          <span className="inline-flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Copiado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copiar
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Text + arrow */}
                    <div className="flex items-start gap-3">
                      <span className="text-[#ddd] text-sm leading-relaxed wapp-text whitespace-pre-wrap flex-1 group-hover:text-white transition-colors">
                        {renderWappText(node.texto)}
                      </span>
                      <svg
                        className="w-4 h-4 text-[#555] group-hover:text-[#888] shrink-0 mt-0.5 transition-colors"
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
            <div className="text-center py-6 text-[#444] text-sm">
              <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Fin del flujo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
