'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  NodeMouseHandler,
  NodeProps,
  Handle,
  Position,
  Panel,
  OnSelectionChangeParams,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { NodeResizer } from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'
import { Nodo, Conexion, TipoNodo, Kit } from '@/types'
import { supabase } from '@/lib/supabase'

interface ModoEditorProps {
  kit: Kit
  nodos: Nodo[]
  conexiones: Conexion[]
  onDataChange: () => void
}

const COLOR_MAP: Record<TipoNodo, string> = {
  inicio: '#1B3A8C',  // Fishwife deep navy
  yo: '#0D6B5A',      // Fishwife forest teal
  cliente: '#B83A10', // Fishwife warm red
}

// Darken a hex color by 15% for drop shadow
function darken15(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const d = (v: number) => Math.max(0, Math.round(v * 0.85))
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`
}

// Measure how tall a node needs to be to fit its text without clipping
function measureNodeHeight(text: string, nodeWidth: number): number {
  if (typeof document === 'undefined') return 80
  const div = document.createElement('div')
  div.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'pointer-events:none',
    `width:${Math.max(50, nodeWidth - 46)}px`,
    'font-size:13px',
    'font-family:Recoleta,system-ui,sans-serif',
    'font-weight:500',
    'line-height:1.625',
    'white-space:pre-wrap',
    'word-break:break-word',
  ].join(';')
  div.innerText = text || ' '
  document.body.appendChild(div)
  const h = div.scrollHeight
  document.body.removeChild(div)
  return Math.max(60, h + 20)
}

// Get RF-node pixel dimensions
function getNodeDims(node: Node): { w: number; h: number } {
  return {
    w: (node.style?.width as number) ?? 200,
    h: (node.style?.height as number) ?? 80,
  }
}

// Flip handle: left ↔ right
const flipHandle = (h?: string | null): string => {
  if (!h) return 'right'
  if (h === 'left' || h === 'lt' || h === 'ls') return 'right'
  return 'left'
}

// ───────────────────────────────────────────────────────────
// Custom node: resize + handles + "+" and copy buttons
// ───────────────────────────────────────────────────────────
interface TattoNodeData {
  label: string
  tipo: TipoNodo
  color: string
  onCreateChild: (parentId: string) => void
  onResize: (id: string, width: number, height: number) => void
}

function TattoNode({ id, data, selected }: NodeProps<TattoNodeData>) {
  const [copied, setCopied] = useState(false)
  const color = data.color
  const shadowColor = darken15(color)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(data.label)
    } catch {
      const el = document.createElement('textarea')
      el.value = data.label
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const btnClass = `absolute w-6 h-6 rounded-full text-white flex items-center justify-center z-20 transition-all ${
    selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
  }`
  const btnStyle = {
    background: 'rgba(255,255,255,0.25)',
    border: '1.5px solid rgba(255,255,255,0.5)',
    backdropFilter: 'blur(4px)',
  }

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={60}
        maxWidth={9999}
        maxHeight={9999}
        lineStyle={{ borderColor: color, borderWidth: 1.5 }}
        handleStyle={{
          background: color,
          width: 9,
          height: 9,
          borderRadius: 2,
          border: '1.5px solid #fff',
        }}
        onResize={(_, params) => data.onResize(id, params.width, params.height)}
      />

      <div
        className="group relative w-full h-full flex items-center"
        style={{
          background: color,
          border: 'none',
          borderRadius: 'var(--radius-node)',
          color: '#ffffff',
          fontSize: 13,
          fontFamily: 'Recoleta, system-ui, sans-serif',
          fontWeight: 500,
          padding: '10px 14px',
          paddingRight: 36,
          overflow: 'hidden',
          boxSizing: 'border-box',
          boxShadow: selected
            ? `0 0 0 3px rgba(255,255,255,0.6), 0 8px 20px -4px ${shadowColor}, 0 3px 8px -2px ${shadowColor}`
            : `0 8px 20px -4px ${shadowColor}, 0 3px 8px -2px ${shadowColor}`,
        }}
      >
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          style={{
            top: '30%',
            background: 'rgba(255,255,255,0.35)',
            width: 14,
            height: 14,
            border: '2.5px solid rgba(255,255,255,0.7)',
            zIndex: 10,
          }}
        />
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          style={{
            top: '30%',
            background: 'rgba(255,255,255,0.35)',
            width: 14,
            height: 14,
            border: '2.5px solid rgba(255,255,255,0.7)',
            zIndex: 10,
          }}
        />

        <div
          className="flex-1 leading-relaxed"
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}
        >
          {data.label}
        </div>

        {/* "+" create child */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); data.onCreateChild(id) }}
          className={`${btnClass} text-sm font-bold`}
          style={{ top: 6, right: 6, ...btnStyle }}
          title="Crear nodo hijo"
        >
          +
        </button>

        {/* Copy text */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleCopy}
          className={`${btnClass} ${copied ? '!opacity-100' : ''}`}
          style={{
            bottom: 6,
            right: 6,
            background: copied ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.25)',
            border: `1.5px solid ${copied ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.5)'}`,
            backdropFilter: 'blur(4px)',
          }}
          title={copied ? 'Copiado' : 'Copiar texto'}
        >
          {copied ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}

// ───────────────────────────────────────────────────────────
// Build helpers
// ───────────────────────────────────────────────────────────
function buildRFNode(n: Nodo): Node {
  const color = COLOR_MAP[n.tipo] ?? '#555'
  const w = n.ancho ?? 200
  const h = n.alto ?? 80
  return {
    id: n.id,
    type: 'tatto',
    position: { x: n.posicion_x, y: n.posicion_y },
    data: { label: n.texto, tipo: n.tipo, color },
    style: { width: w, height: h },
  }
}

function buildRFEdge(c: Conexion): Edge {
  const mapH = (h: string | null | undefined, fallback: string) => {
    if (!h) return fallback
    if (h === 'lt' || h === 'ls' || h === 'left') return 'left'
    if (h === 'rs' || h === 'rt' || h === 'right') return 'right'
    return fallback
  }
  return {
    id: c.id,
    source: c.nodo_origen_id,
    target: c.nodo_destino_id,
    sourceHandle: mapH(c.source_handle, 'right'),
    targetHandle: mapH(c.target_handle, 'left'),
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--rf-edge)' },
    style: { strokeWidth: 2 },
  }
}

// ───────────────────────────────────────────────────────────
// contentEditable text editor
// ───────────────────────────────────────────────────────────
function TextEditor({
  nodoId,
  initialText,
  onChange,
  autoFocus,
  onFocused,
}: {
  nodoId: string
  initialText: string
  onChange: (v: string) => void
  autoFocus?: boolean
  onFocused?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastNodoId = useRef<string | null>(null)

  useEffect(() => {
    if (ref.current && nodoId !== lastNodoId.current) {
      ref.current.innerText = initialText
      lastNodoId.current = nodoId
    }
  })

  // Auto-focus when double-clicking a node
  useEffect(() => {
    if (!autoFocus || !ref.current) return
    ref.current.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(ref.current)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
    onFocused?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const plain = e.clipboardData.getData('text/plain')
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const node = document.createTextNode(plain)
    range.insertNode(node)
    range.setStartAfter(node)
    range.setEndAfter(node)
    sel.removeAllRanges()
    sel.addRange(range)
    if (ref.current) onChange(ref.current.innerText)
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={() => ref.current && onChange(ref.current.innerText)}
      onPaste={handlePaste}
      className="w-full bg-app-surface-2 border border-app-border rounded-xl px-3 py-3 text-sm text-app-text outline-none focus:border-brand leading-relaxed font-mono min-h-[200px] whitespace-pre-wrap break-words"
    />
  )
}

// ───────────────────────────────────────────────────────────
// Node edit panel
// ───────────────────────────────────────────────────────────
interface NodePanelProps {
  nodo: Nodo | null
  onClose: () => void
  onSave: (id: string, texto: string, tipo: TipoNodo) => Promise<void>
  onDelete: (id: string) => Promise<void>
  focusEditor?: boolean
  onEditorFocused?: () => void
}

function NodePanel({ nodo, onClose, onSave, onDelete, focusEditor, onEditorFocused }: NodePanelProps) {
  const [texto, setTexto] = useState(nodo?.texto ?? '')
  const [tipo, setTipo] = useState<TipoNodo>(nodo?.tipo ?? 'yo')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setTexto(nodo?.texto ?? '')
    setTipo(nodo?.tipo ?? 'yo')
    setConfirmDelete(false)
    setCopied(false)
  }, [nodo?.id])

  if (!nodo) return null

  const handleSave = async () => {
    setSaving(true)
    await onSave(nodo.id, texto, tipo)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(nodo.id)
    setDeleting(false)
    onClose()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const el = document.createElement('textarea')
      el.value = texto
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="absolute right-0 top-0 h-full w-80 border-l border-app-border flex flex-col z-10 shadow-drop" style={{ background: 'var(--bg-surface)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
        <h3 className="text-app-text font-semibold text-sm">Editar nodo</h3>
        <button onClick={onClose} className="text-app-muted hover:text-app-text transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label className="block text-xs text-app-muted uppercase tracking-wider mb-2 font-semibold">Tipo</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['inicio', 'yo', 'cliente'] as TipoNodo[]).map((t) => {
              const c = COLOR_MAP[t]
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className="py-2 text-xs font-semibold transition-all capitalize"
                  style={{
                    borderRadius: 'var(--radius-btn)',
                    ...(tipo === t
                      ? { background: c, color: '#fff', border: 'none', boxShadow: 'var(--shadow-drop)' }
                      : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }),
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {t === 'inicio' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ) : t === 'yo' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    )}
                    {t}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-app-muted uppercase tracking-wider mb-2 font-semibold">Texto</label>
          <TextEditor
            nodoId={nodo.id}
            initialText={nodo.texto}
            onChange={setTexto}
            autoFocus={focusEditor}
            onFocused={onEditorFocused}
          />
          <p className="text-xs text-app-muted mt-1">Usa *texto* para negrilla · soporta pegar formato</p>
        </div>

        <div className="text-xs text-app-muted bg-app-surface-2 border border-app-border rounded-lg px-3 py-2.5 leading-relaxed">
          <span className="inline-flex items-start gap-1.5">
            <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Al guardar el nodo se ajusta automáticamente al texto · arrastra los bordes para redimensionar.
          </span>
        </div>
      </div>

      <div className="p-5 border-t border-app-border space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white py-2.5 text-sm font-semibold transition-all shadow-drop hover:shadow-node"
          style={{ borderRadius: 'var(--radius-btn)' }}
        >
          {saving ? 'Guardando...' : (
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardar cambios
            </span>
          )}
        </button>

        {/* Copy text button */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 text-sm font-semibold transition-all bg-app-surface-2 hover:bg-app-border border border-app-border"
          style={{ borderRadius: 'var(--radius-btn)', color: copied ? '#22c55e' : 'var(--text-secondary)' }}
        >
          <span className="inline-flex items-center gap-1.5">
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Copiado
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar texto
              </>
            )}
          </span>
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`w-full py-2.5 text-sm font-semibold transition-all ${
            confirmDelete
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-drop'
              : 'bg-app-surface-2 hover:bg-app-border text-app-muted hover:text-red-500 border border-app-border'
          }`}
          style={{ borderRadius: 'var(--radius-btn)' }}
        >
          {deleting ? 'Eliminando...' : confirmDelete ? (
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Confirmar eliminación
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Eliminar nodo
            </span>
          )}
        </button>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="w-full bg-app-surface-2 hover:bg-app-border text-app-muted py-2 text-xs transition-colors border border-app-border"
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Alignment toolbar icons
// ───────────────────────────────────────────────────────────
function IconAlignLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="1" width="1.5" height="18" rx="0.75"/>
      <rect x="4" y="4" width="9" height="4" rx="1"/>
      <rect x="4" y="12" width="14" height="4" rx="1"/>
    </svg>
  )
}
function IconAlignCenterH() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <rect x="9.25" y="1" width="1.5" height="18" rx="0.75"/>
      <rect x="3" y="4" width="14" height="4" rx="1"/>
      <rect x="5" y="12" width="10" height="4" rx="1"/>
    </svg>
  )
}
function IconAlignRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <rect x="17.5" y="1" width="1.5" height="18" rx="0.75"/>
      <rect x="7" y="4" width="9" height="4" rx="1"/>
      <rect x="2" y="12" width="14" height="4" rx="1"/>
    </svg>
  )
}
function IconAlignTop() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="1" width="18" height="1.5" rx="0.75"/>
      <rect x="3" y="4" width="4" height="10" rx="1"/>
      <rect x="11" y="4" width="4" height="7" rx="1"/>
    </svg>
  )
}
function IconAlignMiddleV() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="9.25" width="18" height="1.5" rx="0.75"/>
      <rect x="3" y="3" width="4" height="14" rx="1"/>
      <rect x="11" y="5" width="4" height="10" rx="1"/>
    </svg>
  )
}
function IconAlignBottom() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="17.5" width="18" height="1.5" rx="0.75"/>
      <rect x="3" y="6" width="4" height="10" rx="1"/>
      <rect x="11" y="9" width="4" height="7" rx="1"/>
    </svg>
  )
}
function IconDistribH(props: { anchor: 'start'|'center'|'end' }) {
  const { anchor } = props
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      {/* Three equally spaced blocks */}
      <rect x="1" y="6" width="4" height="8" rx="1"/>
      <rect x="8" y="6" width="4" height="8" rx="1"/>
      <rect x="15" y="6" width="4" height="8" rx="1"/>
      {/* Anchor markers */}
      {anchor === 'start' && <>
        <rect x="1" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
        <rect x="8" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
        <rect x="15" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
      </>}
      {anchor === 'center' && <>
        <rect x="2.5" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
        <rect x="9.5" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
        <rect x="16.5" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
      </>}
      {anchor === 'end' && <>
        <rect x="4" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
        <rect x="11" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
        <rect x="18" y="4" width="1" height="12" rx="0.5" opacity="0.5"/>
      </>}
    </svg>
  )
}
function IconDistribV(props: { anchor: 'start'|'center'|'end' }) {
  const { anchor } = props
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      {/* Three equally spaced blocks */}
      <rect x="6" y="1" width="8" height="4" rx="1"/>
      <rect x="6" y="8" width="8" height="4" rx="1"/>
      <rect x="6" y="15" width="8" height="4" rx="1"/>
      {/* Anchor markers */}
      {anchor === 'start' && <>
        <rect x="4" y="1" width="12" height="1" rx="0.5" opacity="0.5"/>
        <rect x="4" y="8" width="12" height="1" rx="0.5" opacity="0.5"/>
        <rect x="4" y="15" width="12" height="1" rx="0.5" opacity="0.5"/>
      </>}
      {anchor === 'center' && <>
        <rect x="4" y="2.5" width="12" height="1" rx="0.5" opacity="0.5"/>
        <rect x="4" y="9.5" width="12" height="1" rx="0.5" opacity="0.5"/>
        <rect x="4" y="16.5" width="12" height="1" rx="0.5" opacity="0.5"/>
      </>}
      {anchor === 'end' && <>
        <rect x="4" y="4" width="12" height="1" rx="0.5" opacity="0.5"/>
        <rect x="4" y="11" width="12" height="1" rx="0.5" opacity="0.5"/>
        <rect x="4" y="18" width="12" height="1" rx="0.5" opacity="0.5"/>
      </>}
    </svg>
  )
}

// ───────────────────────────────────────────────────────────
// Main editor
// ───────────────────────────────────────────────────────────
type UndoEntry = { id: string; x: number; y: number }
type EdgeMenu = { x: number; y: number; edgeId: string }

export default function ModoEditor({
  kit,
  nodos: initialNodos,
  conexiones: initialConexiones,
  onDataChange,
}: ModoEditorProps) {
  const [rfNodes, setRfNodes] = useState<Node[]>(initialNodos.map(buildRFNode))
  const [rfEdges, setRfEdges] = useState<Edge[]>(initialConexiones.map(buildRFEdge))
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null)
  const [nodos, setNodos] = useState<Nodo[]>(initialNodos)
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [focusEditor, setFocusEditor] = useState(false)

  const [edgeMenu, setEdgeMenu] = useState<EdgeMenu | null>(null)

  // Undo
  const [undoHistory, setUndoHistory] = useState<UndoEntry[]>([])
  const undoHistoryRef = useRef<UndoEntry[]>([])
  useEffect(() => { undoHistoryRef.current = undoHistory }, [undoHistory])

  // Snap
  const [snapEnabled, setSnapEnabled] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('copyflow-snap')
    if (saved !== null) setSnapEnabled(saved === 'true')
  }, [])
  const toggleSnap = useCallback(() => {
    setSnapEnabled((s) => {
      const next = !s
      localStorage.setItem('copyflow-snap', String(next))
      return next
    })
  }, [])

  const dragStartPosRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const resizeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const createChildRef = useRef<(parentId: string) => Promise<void>>(async () => {})
  const resizeRef = useRef<(id: string, w: number, h: number) => void>(() => {})

  const buildNodeWithCallbacks = useCallback((n: Nodo): Node => {
    const rf = buildRFNode(n)
    rf.data = {
      ...rf.data,
      onCreateChild: (pid: string) => createChildRef.current(pid),
      onResize: (id: string, w: number, h: number) => resizeRef.current(id, w, h),
    }
    return rf
  }, [])

  // Only reset editor when the kit changes (the component is re-keyed on kit.id by the parent,
  // so this effect runs once on mount). Excluding initialNodos/conexiones from deps prevents
  // the editor from resetting every time onDataChange triggers a refetch in page.tsx.
  useEffect(() => {
    setNodos(initialNodos)
    setRfNodes(initialNodos.map(buildNodeWithCallbacks))
    setRfEdges(initialConexiones.map(buildRFEdge))
    setSelectedNodo(null)
    setSelectedNodes([])
    setUndoHistory([])
    setEdgeMenu(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit.id])

  // Click "+" → create child node + connection
  useEffect(() => {
    createChildRef.current = async (parentId: string) => {
      const parent = nodos.find((n) => n.id === parentId)
      if (!parent) return
      const oppositeType: TipoNodo = parent.tipo === 'cliente' ? 'yo' : 'cliente'

      const { data: newNodo, error: nErr } = await supabase
        .from('nodos')
        .insert({
          kit_id: kit.id,
          tipo: oppositeType,
          texto: 'Escribe aquí...',
          posicion_x: parent.posicion_x + 320,
          posicion_y: parent.posicion_y,
          ancho: 200,
          alto: 80,
        })
        .select()
        .single()
      if (nErr || !newNodo) return

      const connBase = {
        kit_id: kit.id,
        nodo_origen_id: parentId,
        nodo_destino_id: newNodo.id,
      }
      let { data: newConn } = await supabase
        .from('conexiones')
        .insert({ ...connBase, source_handle: 'right', target_handle: 'left' })
        .select()
        .single()
      if (!newConn) {
        const retry = await supabase
          .from('conexiones')
          .insert(connBase)
          .select()
          .single()
        newConn = retry.data
      }

      const updatedNodos = [...nodos, newNodo]
      setNodos(updatedNodos)
      setRfNodes(updatedNodos.map(buildNodeWithCallbacks))
      if (newConn) setRfEdges((eds) => [...eds, buildRFEdge(newConn)])
      setSelectedNodo(newNodo)
      onDataChange()
    }
  }, [nodos, kit.id, onDataChange, buildNodeWithCallbacks])

  // Resize with debounce
  useEffect(() => {
    resizeRef.current = (id: string, w: number, h: number) => {
      const width = Math.round(w)
      const height = Math.round(h)
      const existing = resizeTimersRef.current.get(id)
      if (existing) clearTimeout(existing)
      const timer = setTimeout(async () => {
        await supabase.from('nodos').update({ ancho: width, alto: height }).eq('id', id)
        setNodos((prev) =>
          prev.map((n) => (n.id === id ? { ...n, ancho: width, alto: height } : n))
        )
        resizeTimersRef.current.delete(id)
      }, 600)
      resizeTimersRef.current.set(id, timer)
    }
  }, [])

  // Ctrl+Z undo / Escape closes menus
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEdgeMenu(null)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        const history = undoHistoryRef.current
        if (history.length === 0) return
        const last = history[history.length - 1]
        setUndoHistory((h) => h.slice(0, -1))
        setRfNodes((nds) =>
          nds.map((n) =>
            n.id === last.id ? { ...n, position: { x: last.x, y: last.y } } : n
          )
        )
        setNodos((prev) =>
          prev.map((n) =>
            n.id === last.id ? { ...n, posicion_x: last.x, posicion_y: last.y } : n
          )
        )
        await supabase
          .from('nodos')
          .update({ posicion_x: last.x, posicion_y: last.y })
          .eq('id', last.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setRfEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    dragStartPosRef.current = { id: node.id, x: node.position.x, y: node.position.y }
  }, [])

  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    if (dragStartPosRef.current?.id === node.id) {
      const prev = dragStartPosRef.current
      setUndoHistory((h) => [...h, { id: prev.id, x: prev.x, y: prev.y }].slice(-20))
      dragStartPosRef.current = null
    }
    setNodos((prev) =>
      prev.map((n) =>
        n.id === node.id ? { ...n, posicion_x: node.position.x, posicion_y: node.position.y } : n
      )
    )
    await supabase
      .from('nodos')
      .update({ posicion_x: node.position.x, posicion_y: node.position.y })
      .eq('id', node.id)
  }, [])

  // Manual connection
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      const base = {
        kit_id: kit.id,
        nodo_origen_id: connection.source,
        nodo_destino_id: connection.target,
      }

      let { data, error } = await supabase
        .from('conexiones')
        .insert({
          ...base,
          source_handle: connection.sourceHandle,
          target_handle: connection.targetHandle,
        })
        .select()
        .single()

      if (error) {
        const retry = await supabase
          .from('conexiones')
          .insert(base)
          .select()
          .single()
        data = retry.data
        error = retry.error
      }

      if (!error && data) {
        setRfEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: data.id,
              markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--rf-edge)' },
              style: { strokeWidth: 2 },
            },
            eds
          )
        )
      }
    },
    [kit.id]
  )

  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.stopPropagation()
    setEdgeMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id })
  }, [])

  const onPaneClick = useCallback(() => {
    setEdgeMenu(null)
  }, [])

  const handleFlipEdge = useCallback(async () => {
    if (!edgeMenu) return
    const edge = rfEdges.find((e) => e.id === edgeMenu.edgeId)
    if (!edge) return

    const newSource = edge.target
    const newTarget = edge.source
    const newSourceHandle = flipHandle(edge.targetHandle as string | null | undefined)
    const newTargetHandle = flipHandle(edge.sourceHandle as string | null | undefined)

    const upd = await supabase
      .from('conexiones')
      .update({
        nodo_origen_id: newSource,
        nodo_destino_id: newTarget,
        source_handle: newSourceHandle,
        target_handle: newTargetHandle,
      })
      .eq('id', edge.id)
    if (upd.error) {
      await supabase
        .from('conexiones')
        .update({ nodo_origen_id: newSource, nodo_destino_id: newTarget })
        .eq('id', edge.id)
    }

    setRfEdges((eds) =>
      eds.map((e) =>
        e.id === edge.id
          ? { ...e, source: newSource, target: newTarget, sourceHandle: newSourceHandle, targetHandle: newTargetHandle }
          : e
      )
    )
    setEdgeMenu(null)
  }, [edgeMenu, rfEdges])

  const handleDeleteEdge = useCallback(async () => {
    if (!edgeMenu) return
    await supabase.from('conexiones').delete().eq('id', edgeMenu.edgeId)
    setRfEdges((eds) => eds.filter((e) => e.id !== edgeMenu.edgeId))
    setEdgeMenu(null)
  }, [edgeMenu])

  // Single click → open edit panel (not on shift-click, which is multi-select)
  const onNodeClick: NodeMouseHandler = useCallback(
    (e, node) => {
      if (e.shiftKey) return
      const nodo = nodos.find((n) => n.id === node.id)
      setSelectedNodo(nodo ?? null)
      setEdgeMenu(null)
    },
    [nodos]
  )

  // Double click → open edit panel and focus the text editor
  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const nodo = nodos.find((n) => n.id === node.id)
      setSelectedNodo(nodo ?? null)
      setEdgeMenu(null)
      setFocusEditor(true)
    },
    [nodos]
  )

  // Track multi-selection for alignment toolbar
  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    setSelectedNodes(nodes)
    if (nodes.length >= 2) {
      setSelectedNodo(null) // Close edit panel when multi-selecting
    }
  }, [])

  const handleSaveNodo = useCallback(
    async (id: string, texto: string, tipo: TipoNodo) => {
      const nodeData = nodos.find((n) => n.id === id)
      const nodeWidth = nodeData?.ancho ?? 200
      const newHeight = measureNodeHeight(texto, nodeWidth)

      const { error } = await supabase
        .from('nodos')
        .update({ texto, tipo, alto: newHeight })
        .eq('id', id)
      if (!error) {
        const updated = nodos.map((n) =>
          n.id === id ? { ...n, texto, tipo, alto: newHeight } : n
        )
        setNodos(updated)
        setRfNodes(updated.map(buildNodeWithCallbacks))
        setSelectedNodo((sn) => (sn?.id === id ? { ...sn, texto, tipo, alto: newHeight } : sn))
        onDataChange()
      }
    },
    [nodos, onDataChange, buildNodeWithCallbacks]
  )

  const handleDeleteNodo = useCallback(
    async (id: string) => {
      await supabase.from('nodos').delete().eq('id', id)
      const updated = nodos.filter((n) => n.id !== id)
      setNodos(updated)
      setRfNodes(updated.map(buildNodeWithCallbacks))
      setRfEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
      setSelectedNodo(null)
      onDataChange()
    },
    [nodos, onDataChange, buildNodeWithCallbacks]
  )

  const handleAddNodo = useCallback(async () => {
    const { data, error } = await supabase
      .from('nodos')
      .insert({
        kit_id: kit.id,
        tipo: 'yo',
        texto: 'Nuevo mensaje — edítame',
        posicion_x: Math.random() * 400,
        posicion_y: Math.random() * 400,
        ancho: 200,
        alto: 80,
      })
      .select()
      .single()
    if (!error && data) {
      const newNodos = [...nodos, data]
      setNodos(newNodos)
      setRfNodes(newNodos.map(buildNodeWithCallbacks))
      onDataChange()
    }
  }, [kit.id, nodos, onDataChange, buildNodeWithCallbacks])

  // ── Alignment ──────────────────────────────────────────────
  const alignSelected = useCallback(async (type: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => {
    if (selectedNodes.length < 2) return

    const updates = selectedNodes.map((node) => {
      const { w, h } = getNodeDims(node)
      let x = node.position.x
      let y = node.position.y

      if (type === 'left') {
        x = Math.min(...selectedNodes.map((n) => n.position.x))
      } else if (type === 'centerH') {
        const avg = selectedNodes.reduce((s, n) => s + n.position.x + getNodeDims(n).w / 2, 0) / selectedNodes.length
        x = avg - w / 2
      } else if (type === 'right') {
        const maxRight = Math.max(...selectedNodes.map((n) => n.position.x + getNodeDims(n).w))
        x = maxRight - w
      } else if (type === 'top') {
        y = Math.min(...selectedNodes.map((n) => n.position.y))
      } else if (type === 'centerV') {
        const avg = selectedNodes.reduce((s, n) => s + n.position.y + getNodeDims(n).h / 2, 0) / selectedNodes.length
        y = avg - h / 2
      } else if (type === 'bottom') {
        const maxBottom = Math.max(...selectedNodes.map((n) => n.position.y + getNodeDims(n).h))
        y = maxBottom - h
      }

      return { id: node.id, x, y }
    })

    setRfNodes((prev) => prev.map((n) => {
      const u = updates.find((u) => u.id === n.id)
      return u ? { ...n, position: { x: u.x, y: u.y } } : n
    }))
    setNodos((prev) => prev.map((n) => {
      const u = updates.find((u) => u.id === n.id)
      return u ? { ...n, posicion_x: u.x, posicion_y: u.y } : n
    }))

    for (const u of updates) {
      await supabase.from('nodos').update({ posicion_x: u.x, posicion_y: u.y }).eq('id', u.id)
    }
  }, [selectedNodes])

  // ── Distribution ───────────────────────────────────────────
  const distributeSelected = useCallback(async (axis: 'x' | 'y', anchor: 'start' | 'center' | 'end') => {
    if (selectedNodes.length < 2) return

    const getAnchor = (node: Node): number => {
      const { w, h } = getNodeDims(node)
      if (axis === 'x') {
        if (anchor === 'start') return node.position.x
        if (anchor === 'center') return node.position.x + w / 2
        return node.position.x + w
      }
      if (anchor === 'start') return node.position.y
      if (anchor === 'center') return node.position.y + h / 2
      return node.position.y + h
    }

    const sorted = [...selectedNodes].sort((a, b) => getAnchor(a) - getAnchor(b))
    const minA = getAnchor(sorted[0])
    const maxA = getAnchor(sorted[sorted.length - 1])
    const step = sorted.length > 1 ? (maxA - minA) / (sorted.length - 1) : 0

    const updates = sorted.map((node, i) => {
      const target = minA + i * step
      const { w, h } = getNodeDims(node)
      let x = node.position.x
      let y = node.position.y
      if (axis === 'x') {
        x = anchor === 'start' ? target : anchor === 'center' ? target - w / 2 : target - w
      } else {
        y = anchor === 'start' ? target : anchor === 'center' ? target - h / 2 : target - h
      }
      return { id: node.id, x, y }
    })

    setRfNodes((prev) => prev.map((n) => {
      const u = updates.find((u) => u.id === n.id)
      return u ? { ...n, position: { x: u.x, y: u.y } } : n
    }))
    setNodos((prev) => prev.map((n) => {
      const u = updates.find((u) => u.id === n.id)
      return u ? { ...n, posicion_x: u.x, posicion_y: u.y } : n
    }))

    for (const u of updates) {
      await supabase.from('nodos').update({ posicion_x: u.x, posicion_y: u.y }).eq('id', u.id)
    }
  }, [selectedNodes])

  const nodeTypes = useMemo(() => ({ tatto: TattoNode }), [])

  const toolbarBtnClass = (disabled = false) =>
    `w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
      disabled
        ? 'opacity-30 cursor-not-allowed border-transparent text-app-muted'
        : 'border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-2 hover:border-brand/40 hover:shadow-soft active:scale-95'
    }`

  const canDistrib = selectedNodes.length >= 3

  return (
    <div className="flex-1 relative h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onSelectionChange={onSelectionChange}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        snapToGrid={snapEnabled}
        snapGrid={[20, 20]}
        connectionMode={ConnectionMode.Loose}
      >
        <Background color="var(--dot-pattern)" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => COLOR_MAP[n.data?.tipo as TipoNodo] ?? '#94a3b8'}
          maskColor="rgba(0,0,0,0.06)"
          style={{ background: 'var(--bg-surface)' }}
        />

        <Panel position="top-left">
          <div className="flex items-start gap-2">
            <div
              className="backdrop-blur border rounded-xl px-4 py-2 text-xs space-y-1 shadow-card"
              style={{
                background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)',
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <p>• Doble clic en un nodo → editar texto</p>
              <p>• Botón <span className="text-app-text font-semibold">+</span> (esquina sup.) → crea nodo hijo · botón copiar (esquina inf.)</p>
              <p>• Arrastra desde cualquier handle → conexión manual</p>
              <p>• Shift+clic o selección múltiple → herramientas de alineación</p>
              <p>• Arrastra bordes seleccionados → redimensiona · Ctrl+Z deshace</p>
            </div>
            <button
              onClick={toggleSnap}
              title="Snap to grid 20px"
              className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all backdrop-blur shadow-soft"
              style={
                snapEnabled
                  ? { background: '#F9731620', color: '#F97316', border: '1.5px solid #F9731680' }
                  : { background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }
              }
            >
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Snap
              </span>
            </button>
          </div>
        </Panel>

        {/* Alignment & distribution toolbar — shown when 2+ nodes are selected */}
        {selectedNodes.length >= 2 && (
          <Panel position="top-center">
            <div
              className="flex gap-4 items-start px-4 py-3 rounded-xl border shadow-drop backdrop-blur"
              style={{
                background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Align */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-app-muted font-medium text-center leading-none">Alinear</p>
                <div className="flex gap-1">
                  <button onClick={() => alignSelected('left')} className={toolbarBtnClass()} title="Alinear bordes izquierdos">
                    <IconAlignLeft />
                  </button>
                  <button onClick={() => alignSelected('centerH')} className={toolbarBtnClass()} title="Centrar horizontalmente">
                    <IconAlignCenterH />
                  </button>
                  <button onClick={() => alignSelected('right')} className={toolbarBtnClass()} title="Alinear bordes derechos">
                    <IconAlignRight />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => alignSelected('top')} className={toolbarBtnClass()} title="Alinear bordes superiores">
                    <IconAlignTop />
                  </button>
                  <button onClick={() => alignSelected('centerV')} className={toolbarBtnClass()} title="Centrar verticalmente">
                    <IconAlignMiddleV />
                  </button>
                  <button onClick={() => alignSelected('bottom')} className={toolbarBtnClass()} title="Alinear bordes inferiores">
                    <IconAlignBottom />
                  </button>
                </div>
              </div>

              <div className="w-px self-stretch bg-app-border" />

              {/* Distribute */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-app-muted font-medium text-center leading-none">
                  Distribuir {!canDistrib && <span className="opacity-50">(3+ nodos)</span>}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => distributeSelected('x', 'start')} disabled={!canDistrib} className={toolbarBtnClass(!canDistrib)} title="Distribuir bordes izquierdos">
                    <IconDistribH anchor="start" />
                  </button>
                  <button onClick={() => distributeSelected('x', 'center')} disabled={!canDistrib} className={toolbarBtnClass(!canDistrib)} title="Distribuir centros horizontalmente">
                    <IconDistribH anchor="center" />
                  </button>
                  <button onClick={() => distributeSelected('x', 'end')} disabled={!canDistrib} className={toolbarBtnClass(!canDistrib)} title="Distribuir bordes derechos">
                    <IconDistribH anchor="end" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => distributeSelected('y', 'start')} disabled={!canDistrib} className={toolbarBtnClass(!canDistrib)} title="Distribuir bordes superiores">
                    <IconDistribV anchor="start" />
                  </button>
                  <button onClick={() => distributeSelected('y', 'center')} disabled={!canDistrib} className={toolbarBtnClass(!canDistrib)} title="Distribuir centros verticalmente">
                    <IconDistribV anchor="center" />
                  </button>
                  <button onClick={() => distributeSelected('y', 'end')} disabled={!canDistrib} className={toolbarBtnClass(!canDistrib)} title="Distribuir bordes inferiores">
                    <IconDistribV anchor="end" />
                  </button>
                </div>
              </div>

              {/* Selection count badge */}
              <div className="self-center text-xs font-semibold text-brand bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                {selectedNodes.length} nodos
              </div>
            </div>
          </Panel>
        )}

        <Panel position="bottom-right">
          <button
            onClick={handleAddNodo}
            className="w-14 h-14 bg-brand hover:bg-brand-hover text-white rounded-full text-2xl flex items-center justify-center transition-all hover:scale-105 hover:shadow-node"
            style={{ boxShadow: 'var(--shadow-drop)' }}
            title="Agregar nodo"
          >
            +
          </button>
        </Panel>
      </ReactFlow>

      {/* Floating edge menu */}
      {edgeMenu && (
        <div
          className="fixed border z-50 flex gap-1 p-1"
          style={{
            borderRadius: 'var(--radius-btn)',
            boxShadow: 'var(--shadow-drop)',
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            left: Math.min(edgeMenu.x, window.innerWidth - 230),
            top: Math.min(edgeMenu.y, window.innerHeight - 50),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleFlipEdge}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-brand hover:bg-brand/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            Invertir dirección
          </button>
          <button
            onClick={handleDeleteEdge}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Eliminar
          </button>
        </div>
      )}

      <NodePanel
        nodo={selectedNodo}
        onClose={() => setSelectedNodo(null)}
        onSave={handleSaveNodo}
        onDelete={handleDeleteNodo}
        focusEditor={focusEditor}
        onEditorFocused={() => setFocusEditor(false)}
      />
    </div>
  )
}
