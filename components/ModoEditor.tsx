'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
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
  Panel,
  OnConnectStartParams,
} from 'reactflow'
import 'reactflow/dist/style.css'
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

// CAMBIO 6: build node with saved dimensions
function buildRFNode(n: Nodo): Node {
  const color = COLOR_MAP[n.tipo] ?? '#555'
  const w = n.ancho ?? 200
  const h = n.alto ?? 80
  return {
    id: n.id,
    position: { x: n.posicion_x, y: n.posicion_y },
    data: { label: n.texto, tipo: n.tipo, color },
    style: {
      background: `${color}18`,
      border: `1.5px solid ${color}70`,
      borderRadius: 12,
      padding: '10px 14px',
      color: '#f0f0f0',
      fontSize: 13,
      width: w,
      minHeight: h,
      cursor: 'pointer',
      wordBreak: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const,
    },
    type: 'default',
  }
}

function buildRFEdge(c: Conexion): Edge {
  return {
    id: c.id,
    source: c.nodo_origen_id,
    target: c.nodo_destino_id,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#666' },
    style: { stroke: '#555', strokeWidth: 2 },
  }
}

// CAMBIO 3: contentEditable text editor
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

  // Sync DOM only when the selected nodo changes, not on every keystroke
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

interface NodePanelProps {
  nodo: Nodo | null
  onClose: () => void
  onSave: (id: string, texto: string, tipo: TipoNodo, ancho: number, alto: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function NodePanel({ nodo, onClose, onSave, onDelete }: NodePanelProps) {
  const [texto, setTexto] = useState(nodo?.texto ?? '')
  const [tipo, setTipo] = useState<TipoNodo>(nodo?.tipo ?? 'yo')
  // CAMBIO 6: size fields
  const [ancho, setAncho] = useState(nodo?.ancho ?? 200)
  const [alto, setAlto] = useState(nodo?.alto ?? 80)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTexto(nodo?.texto ?? '')
    setTipo(nodo?.tipo ?? 'yo')
    setAncho(nodo?.ancho ?? 200)
    setAlto(nodo?.alto ?? 80)
    setConfirmDelete(false)
  }, [nodo?.id])

  if (!nodo) return null

  const handleSave = async () => {
    setSaving(true)
    await onSave(nodo.id, texto, tipo, ancho, alto)
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
        {/* Tipo */}
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

        {/* CAMBIO 3: contentEditable text editor */}
        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-semibold">Texto</label>
          <TextEditor nodoId={nodo.id} initialText={nodo.texto} onChange={setTexto} />
          <p className="text-xs text-[#555] mt-1">Usa *texto* para negrilla · soporta pegar formato</p>
        </div>

        {/* CAMBIO 6: size inputs */}
        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-semibold">Tamaño</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#666] mb-1">Ancho (px)</label>
              <input
                type="number"
                min={150}
                max={600}
                value={ancho}
                onChange={(e) => setAncho(Math.min(600, Math.max(150, Number(e.target.value))))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3a3a3a]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Alto (px)</label>
              <input
                type="number"
                min={60}
                max={400}
                value={alto}
                onChange={(e) => setAlto(Math.min(400, Math.max(60, Number(e.target.value))))}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#3a3a3a]"
              />
            </div>
          </div>
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

type UndoEntry = { id: string; x: number; y: number }

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

  // CAMBIO 4: undo history
  const [undoHistory, setUndoHistory] = useState<UndoEntry[]>([])
  const undoHistoryRef = useRef<UndoEntry[]>([])
  useEffect(() => { undoHistoryRef.current = undoHistory }, [undoHistory])

  // CAMBIO 5: snap to grid
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

  // CAMBIO 1: detect click vs drag on source handle
  const connectingNodeId = useRef<string | null>(null)
  const connectStartPos = useRef<{ x: number; y: number } | null>(null)
  const connectionMadeRef = useRef(false)

  // CAMBIO 2 & 4: track drag start position
  const dragStartPosRef = useRef<{ id: string; x: number; y: number } | null>(null)

  // Sync when kit changes
  useEffect(() => {
    setNodos(initialNodos)
    setRfNodes(initialNodos.map(buildRFNode))
    setRfEdges(initialConexiones.map(buildRFEdge))
    setSelectedNodo(null)
    setUndoHistory([])
  }, [kit.id, initialNodos, initialConexiones])

  // CAMBIO 4: Ctrl+Z / Cmd+Z undo
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
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

  // CAMBIO 2 & 4: capture start position then save on stop
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

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return
      connectionMadeRef.current = true
      const { data, error } = await supabase
        .from('conexiones')
        .insert({
          kit_id: kit.id,
          nodo_origen_id: connection.source,
          nodo_destino_id: connection.target,
        })
        .select()
        .single()
      if (!error && data) {
        setRfEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: data.id,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#666' },
              style: { stroke: '#555', strokeWidth: 2 },
            },
            eds
          )
        )
      }
    },
    [kit.id]
  )

  // CAMBIO 1: record source node on connection start
  const onConnectStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
      connectingNodeId.current = params.nodeId
      connectionMadeRef.current = false
      const { clientX, clientY } =
        'touches' in event ? event.touches[0] : event
      connectStartPos.current = { x: clientX, y: clientY }
    },
    []
  )

  // CAMBIO 1: if released with tiny movement = click → create child node
  const onConnectEnd = useCallback(
    async (event: MouseEvent | TouchEvent) => {
      const sourceId = connectingNodeId.current
      connectingNodeId.current = null
      if (!sourceId || connectionMadeRef.current) return
      connectionMadeRef.current = false

      const { clientX, clientY } =
        event instanceof TouchEvent ? event.changedTouches[0] : event
      const start = connectStartPos.current
      connectStartPos.current = null
      if (!start) return

      const dist = Math.sqrt((clientX - start.x) ** 2 + (clientY - start.y) ** 2)
      if (dist >= 8) return // it was a real drag

      // It was a click on the handle → auto-create child node
      const sourceNodo = nodos.find((n) => n.id === sourceId)
      if (!sourceNodo) return

      const oppositeType: TipoNodo =
        sourceNodo.tipo === 'cliente' ? 'yo' : 'cliente'

      const sourceRFNode = rfNodes.find((n) => n.id === sourceId)
      const newX = (sourceRFNode?.position.x ?? 0) + 250
      const newY = sourceRFNode?.position.y ?? 0

      const { data: newNodo, error: nErr } = await supabase
        .from('nodos')
        .insert({
          kit_id: kit.id,
          tipo: oppositeType,
          texto: 'Escribe aquí...',
          posicion_x: newX,
          posicion_y: newY,
          ancho: 200,
          alto: 80,
        })
        .select()
        .single()
      if (nErr || !newNodo) return

      const { data: newConn, error: cErr } = await supabase
        .from('conexiones')
        .insert({
          kit_id: kit.id,
          nodo_origen_id: sourceId,
          nodo_destino_id: newNodo.id,
        })
        .select()
        .single()

      const updatedNodos = [...nodos, newNodo]
      setNodos(updatedNodos)
      setRfNodes(updatedNodos.map(buildRFNode))
      if (!cErr && newConn) {
        setRfEdges((eds) => [...eds, buildRFEdge(newConn)])
      }
      onDataChange()
    },
    [nodos, rfNodes, kit.id, onDataChange]
  )

  const onEdgeClick = useCallback(async (_: React.MouseEvent, edge: Edge) => {
    const confirmed = window.confirm('¿Eliminar esta conexión?')
    if (!confirmed) return
    await supabase.from('conexiones').delete().eq('id', edge.id)
    setRfEdges((eds) => eds.filter((e) => e.id !== edge.id))
  }, [])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const nodo = nodos.find((n) => n.id === node.id)
      setSelectedNodo(nodo ?? null)
    },
    [nodos]
  )

  // CAMBIO 6: save with dimensions
  const handleSaveNodo = useCallback(
    async (id: string, texto: string, tipo: TipoNodo, ancho: number, alto: number) => {
      const { error } = await supabase
        .from('nodos')
        .update({ texto, tipo, ancho, alto })
        .eq('id', id)
      if (!error) {
        const updated = nodos.map((n) =>
          n.id === id ? { ...n, texto, tipo, ancho, alto } : n
        )
        setNodos(updated)
        setRfNodes(updated.map(buildRFNode))
        setSelectedNodo((sn) => (sn?.id === id ? { ...sn, texto, tipo, ancho, alto } : sn))
        onDataChange()
      }
    },
    [nodos, onDataChange]
  )

  const handleDeleteNodo = useCallback(
    async (id: string) => {
      await supabase.from('nodos').delete().eq('id', id)
      const updated = nodos.filter((n) => n.id !== id)
      setNodos(updated)
      setRfNodes(updated.map(buildRFNode))
      setRfEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
      setSelectedNodo(null)
      onDataChange()
    },
    [nodos, onDataChange]
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
      setRfNodes(newNodos.map(buildRFNode))
      onDataChange()
    }
  }, [kit.id, nodos, onDataChange])

  return (
    <div className="flex-1 relative h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        snapToGrid={snapEnabled}
        snapGrid={[20, 20]}
      >
        <Background color="#2a2a2a" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => COLOR_MAP[n.data?.tipo as TipoNodo] ?? '#555'}
          maskColor="#0f0f0f99"
        />

        {/* CAMBIO 5: snap toggle + hints */}
        <Panel position="top-left">
          <div className="flex items-start gap-2">
            <div className="bg-[#111]/80 backdrop-blur border border-[#222] rounded-xl px-4 py-2 text-xs text-[#666] space-y-1">
              <p>• Arrastra nodos para moverlos</p>
              <p>• Clic en handle → crea nodo hijo</p>
              <p>• Arrastra handle → conecta manualmente</p>
              <p>• Clic en flecha → elimina conexión</p>
              <p>• Clic en nodo → editar · Ctrl+Z → deshacer</p>
            </div>
            <button
              onClick={toggleSnap}
              title="Snap to grid 20px"
              className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all backdrop-blur"
              style={
                snapEnabled
                  ? { background: '#3B82F620', color: '#3B82F6', border: '1.5px solid #3B82F660' }
                  : { background: '#111/80', color: '#555', border: '1.5px solid #2a2a2a' }
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

      <NodePanel
        nodo={selectedNodo}
        onClose={() => setSelectedNodo(null)}
        onSave={handleSaveNodo}
        onDelete={handleDeleteNodo}
      />
    </div>
  )
}
