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
          <div className="text-5xl mb-4">🖋️</div>
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
          ↺ Inicio
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
                {currentNode.tipo === 'inicio' ? '🌟 Inicio' : currentNode.tipo === 'yo' ? '👤 Yo' : '💬 Cliente'}
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
                    <>✓ Copiado</>
                  ) : (
                    <>📋 Copiar</>
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
                        {node.tipo === 'yo' ? '👤 Yo' : node.tipo === 'inicio' ? '🌟 Inicio' : '💬 Cliente'}
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
                        {copied === node.id ? '✓ Copiado' : '📋 Copiar'}
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
              <div className="text-3xl mb-2">🏁</div>
              Fin del flujo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
