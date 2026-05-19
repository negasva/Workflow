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
  inicio: '#EC4899',
  yo: '#3B82F6',
  cliente: '#F97316',
}

// Flip handle: left ↔ right (keeps the same side logic but reverses direction)
const flipHandle = (h?: string | null): string => {
  if (!h) return 'right'
  if (h === 'left' || h === 'lt' || h === 'ls') return 'right'
  return 'left'
}

// ───────────────────────────────────────────────────────────
// Custom node: resize + 4 handles + "+" button (top-right corner)
// ───────────────────────────────────────────────────────────
interface TattoNodeData {
  label: string
  tipo: TipoNodo
  color: string
  onCreateChild: (parentId: string) => void
  onResize: (id: string, width: number, height: number) => void
}

function TattoNode({ id, data, selected }: NodeProps<TattoNodeData>) {
  const color = data.color

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
          background: `${color}18`,
          border: `1.5px solid ${color}70`,
          borderRadius: 12,
          color: '#f0f0f0',
          fontSize: 13,
          padding: '10px 14px',
          paddingRight: 32,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* 2 source handles + connectionMode loose = unlimited any-direction.
            Offset to top:30% so they don't overlap NodeResizer's middle-edge
            handles (which sit at 50%). Bigger size = easier to grab. */}
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          style={{
            top: '30%',
            background: color,
            width: 14,
            height: 14,
            border: '2px solid #0f0f0f',
            zIndex: 10,
          }}
        />
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          style={{
            top: '30%',
            background: color,
            width: 14,
            height: 14,
            border: '2px solid #0f0f0f',
            zIndex: 10,
          }}
        />

        <div
          className="flex-1 leading-relaxed"
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
          }}
        >
          {data.label}
        </div>

        {/* "+" button at top-right corner INSIDE the node (no handle overlap) */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            data.onCreateChild(id)
          }}
          className={`absolute w-6 h-6 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-lg z-20 transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{
            top: 6,
            right: 6,
            background: color,
            border: '1.5px solid rgba(255,255,255,0.25)',
          }}
          title="Crear nodo hijo"
        >
          +
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
  // Map legacy 4-handle IDs to the new 2-handle system
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
    markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
    style: { stroke: '#666', strokeWidth: 2 },
  }
}

// ───────────────────────────────────────────────────────────
// contentEditable text editor
// ───────────────────────────────────────────────────────────
function TextEditor({
  nodoId,
  initialText,
  onChange,
}: {
  nodoId: string
  initialText: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastNodoId = useRef<string | null>(null)

  useEffect(() => {
    if (ref.current && nodoId !== lastNodoId.current) {
      ref.current.innerText = initialText
      lastNodoId.current = nodoId
    }
  })

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
      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-3 text-sm text-[#f0f0f0] outline-none focus:border-[#3a3a3a] leading-relaxed font-mono min-h-[200px] whitespace-pre-wrap break-words"
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
}

function NodePanel({ nodo, onClose, onSave, onDelete }: NodePanelProps) {
  const [texto, setTexto] = useState(nodo?.texto ?? '')
  const [tipo, setTipo] = useState<TipoNodo>(nodo?.tipo ?? 'yo')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTexto(nodo?.texto ?? '')
    setTipo(nodo?.tipo ?? 'yo')
    setConfirmDelete(false)
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

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-[#111] border-l border-[#222] flex flex-col z-10 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
        <h3 className="text-white font-semibold text-sm">Editar nodo</h3>
        <button onClick={onClose} className="text-[#666] hover:text-white transition-colors p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-semibold">Tipo</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['inicio', 'yo', 'cliente'] as TipoNodo[]).map((t) => {
              const c = COLOR_MAP[t]
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className="py-2 rounded-lg text-xs font-semibold transition-all capitalize"
                  style={
                    tipo === t
                      ? { background: `${c}30`, color: c, border: `1.5px solid ${c}60` }
                      : { background: '#1a1a1a', color: '#666', border: '1.5px solid #2a2a2a' }
                  }
                >
                  {t === 'inicio' ? '🌟' : t === 'yo' ? '👤' : '💬'} {t}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-semibold">Texto</label>
          <TextEditor nodoId={nodo.id} initialText={nodo.texto} onChange={setTexto} />
          <p className="text-xs text-[#555] mt-1">Usa *texto* para negrilla · soporta pegar formato</p>
        </div>

        <div className="text-xs text-[#555] bg-[#161616] border border-[#222] rounded-lg px-3 py-2.5 leading-relaxed">
          💡 Arrastra los bordes del nodo en el canvas para redimensionarlo.
        </div>
      </div>

      <div className="p-5 border-t border-[#222] space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#3B82F6] hover:bg-[#2563eb] disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          {saving ? 'Guardando...' : '💾 Guardar cambios'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            confirmDelete
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-[#1a1a1a] hover:bg-[#222] text-[#888] hover:text-red-400'
          }`}
        >
          {deleting ? 'Eliminando...' : confirmDelete ? '⚠️ Confirmar eliminación' : '🗑️ Eliminar nodo'}
        </button>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="w-full bg-[#1a1a1a] hover:bg-[#222] text-[#666] rounded-xl py-2 text-xs transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
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

  // Edge floating menu (CAMBIO 3)
  const [edgeMenu, setEdgeMenu] = useState<EdgeMenu | null>(null)

  // Undo
  const [undoHistory, setUndoHistory] = useState<UndoEntry[]>([])
  const undoHistoryRef = useRef<UndoEntry[]>([])
  useEffect(() => { undoHistoryRef.current = undoHistory }, [undoHistory])

  // Snap
  const [snapEnabled, setSnapEnabled] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('tattoflow-snap')
    if (saved !== null) setSnapEnabled(saved === 'true')
  }, [])
  const toggleSnap = useCallback(() => {
    setSnapEnabled((s) => {
      const next = !s
      localStorage.setItem('tattoflow-snap', String(next))
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

  useEffect(() => {
    setNodos(initialNodos)
    setRfNodes(initialNodos.map(buildNodeWithCallbacks))
    setRfEdges(initialConexiones.map(buildRFEdge))
    setSelectedNodo(null)
    setUndoHistory([])
    setEdgeMenu(null)
  }, [kit.id, initialNodos, initialConexiones, buildNodeWithCallbacks])

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

  // Ctrl+Z undo / Escape closes menu
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

  // Manual connection (drag from handle) — tolerates missing handle columns
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      const base = {
        kit_id: kit.id,
        nodo_origen_id: connection.source,
        nodo_destino_id: connection.target,
      }

      // Try with handle columns first; if the migration hasn't been run, retry
      // without them so connections still work.
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
              markerEnd: { type: MarkerType.ArrowClosed, color: '#888' },
              style: { stroke: '#666', strokeWidth: 2 },
            },
            eds
          )
        )
      }
    },
    [kit.id]
  )

  // CAMBIO 3: edge click → floating menu
  const onEdgeClick = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.stopPropagation()
    setEdgeMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id })
  }, [])

  const onPaneClick = useCallback(() => {
    setEdgeMenu(null)
  }, [])

  // CAMBIO 3: flip edge direction (swap source/target + flip handles)
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
          ? {
              ...e,
              source: newSource,
              target: newTarget,
              sourceHandle: newSourceHandle,
              targetHandle: newTargetHandle,
            }
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

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const nodo = nodos.find((n) => n.id === node.id)
      setSelectedNodo(nodo ?? null)
      setEdgeMenu(null)
    },
    [nodos]
  )

  const handleSaveNodo = useCallback(
    async (id: string, texto: string, tipo: TipoNodo) => {
      const { error } = await supabase
        .from('nodos')
        .update({ texto, tipo })
        .eq('id', id)
      if (!error) {
        const updated = nodos.map((n) => (n.id === id ? { ...n, texto, tipo } : n))
        setNodos(updated)
        setRfNodes(updated.map(buildNodeWithCallbacks))
        setSelectedNodo((sn) => (sn?.id === id ? { ...sn, texto, tipo } : sn))
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

  const nodeTypes = useMemo(() => ({ tatto: TattoNode }), [])

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
        <Background color="#2a2a2a" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => COLOR_MAP[n.data?.tipo as TipoNodo] ?? '#555'}
          maskColor="#0f0f0f99"
        />

        <Panel position="top-left">
          <div className="flex items-start gap-2">
            <div className="bg-[#111]/80 backdrop-blur border border-[#222] rounded-xl px-4 py-2 text-xs text-[#666] space-y-1">
              <p>• Botón <span className="text-white">+</span> (esquina sup. der.) → crea nodo hijo</p>
              <p>• Arrastra desde cualquier handle → conexión manual</p>
              <p>• 2 handles por nodo (izq/der) · conexiones ilimitadas</p>
              <p>• Clic en flecha → menú (invertir / eliminar)</p>
              <p>• Arrastra bordes seleccionados → redimensiona · Ctrl+Z deshace</p>
            </div>
            <button
              onClick={toggleSnap}
              title="Snap to grid 20px"
              className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all backdrop-blur"
              style={
                snapEnabled
                  ? { background: '#3B82F620', color: '#3B82F6', border: '1.5px solid #3B82F660' }
                  : { background: 'rgba(17,17,17,0.8)', color: '#555', border: '1.5px solid #2a2a2a' }
              }
            >
              ⊞ Snap
            </button>
          </div>
        </Panel>

        <Panel position="bottom-right">
          <button
            onClick={handleAddNodo}
            className="w-12 h-12 bg-[#3B82F6] hover:bg-[#2563eb] text-white rounded-full shadow-lg text-2xl flex items-center justify-center transition-colors"
            title="Agregar nodo"
          >
            +
          </button>
        </Panel>
      </ReactFlow>

      {/* CAMBIO 3: floating edge menu */}
      {edgeMenu && (
        <div
          className="fixed bg-[#0f0f0f] border border-[#333] rounded-xl shadow-2xl z-50 flex gap-1 p-1"
          style={{
            left: Math.min(edgeMenu.x, window.innerWidth - 230),
            top: Math.min(edgeMenu.y, window.innerHeight - 50),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleFlipEdge}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#3B82F6] hover:bg-[#3B82F620] transition-colors"
          >
            ↔ Invertir dirección
          </button>
          <button
            onClick={handleDeleteEdge}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            🗑️ Eliminar
          </button>
        </div>
      )}

      <NodePanel
        nodo={selectedNodo}
        onClose={() => setSelectedNodo(null)}
        onSave={handleSaveNodo}
        onDelete={handleDeleteNodo}
      />
    </div>
  )
}
