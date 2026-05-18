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

function buildRFNode(n: Nodo): Node {
  const color = COLOR_MAP[n.tipo] ?? '#555'
  return {
    id: n.id,
    position: { x: n.posicion_x, y: n.posicion_y },
    data: {
      label: n.texto,
      tipo: n.tipo,
      color,
    },
    style: {
      background: `${color}18`,
      border: `1.5px solid ${color}70`,
      borderRadius: 12,
      padding: '10px 14px',
      color: '#f0f0f0',
      fontSize: 13,
      minWidth: 180,
      maxWidth: 260,
      cursor: 'pointer',
      boxShadow: `0 0 0 0 ${color}`,
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
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    await onDelete(nodo.id)
    setDeleting(false)
    onClose()
  }

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-[#111] border-l border-[#222] flex flex-col z-10 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
        <h3 className="text-white font-semibold text-sm">Editar nodo</h3>
        <button
          onClick={onClose}
          className="text-[#666] hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Tipo */}
        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-semibold">
            Tipo
          </label>
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

        {/* Texto */}
        <div>
          <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-semibold">
            Texto
          </label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={10}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-3 text-sm text-[#f0f0f0] outline-none focus:border-[#3a3a3a] resize-none leading-relaxed font-mono"
            placeholder="Escribe el mensaje..."
          />
          <p className="text-xs text-[#555] mt-1">
            Usa *texto* para negrilla
          </p>
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when props change (kit switch)
  useEffect(() => {
    setNodos(initialNodos)
    setRfNodes(initialNodos.map(buildRFNode))
    setRfEdges(initialConexiones.map(buildRFEdge))
    setSelectedNodo(null)
  }, [kit.id, initialNodos, initialConexiones])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setRfNodes((nds) => applyNodeChanges(changes, nds))

      // Save position after drag ends
      const posChanges = changes.filter(
        (c) => c.type === 'position' && !c.dragging && c.position
      )
      if (posChanges.length > 0) {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
          for (const c of posChanges) {
            if (c.type === 'position' && c.position) {
              await supabase
                .from('nodos')
                .update({ posicion_x: c.position.x, posicion_y: c.position.y })
                .eq('id', c.id)
            }
          }
        }, 300)
      }
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setRfEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return
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
        setRfEdges((eds) => addEdge({ ...connection, id: data.id, markerEnd: { type: MarkerType.ArrowClosed, color: '#666' }, style: { stroke: '#555', strokeWidth: 2 } }, eds))
      }
    },
    [kit.id]
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

  const handleSaveNodo = useCallback(
    async (id: string, texto: string, tipo: TipoNodo) => {
      const { error } = await supabase
        .from('nodos')
        .update({ texto, tipo })
        .eq('id', id)
      if (!error) {
        const updated = nodos.map((n) => (n.id === id ? { ...n, texto, tipo } : n))
        setNodos(updated)
        setRfNodes(updated.map(buildRFNode))
        setSelectedNodo((sn) => (sn?.id === id ? { ...sn, texto, tipo } : sn))
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
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a2a" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const tipo = n.data?.tipo as TipoNodo
            return COLOR_MAP[tipo] ?? '#555'
          }}
          maskColor="#0f0f0f99"
        />
        <Panel position="bottom-right">
          <button
            onClick={handleAddNodo}
            className="w-12 h-12 bg-[#3B82F6] hover:bg-[#2563eb] text-white rounded-full shadow-lg text-2xl flex items-center justify-center transition-colors"
            title="Agregar nodo"
          >
            +
          </button>
        </Panel>
        <Panel position="top-left">
          <div className="bg-[#111]/80 backdrop-blur border border-[#222] rounded-xl px-4 py-2 text-xs text-[#666] space-y-1">
            <p>• Arrastra nodos para moverlos</p>
            <p>• Arrastra desde el borde para conectar</p>
            <p>• Clic en flecha para eliminar conexión</p>
            <p>• Clic en nodo para editar</p>
          </div>
        </Panel>
      </ReactFlow>

      {/* Node edit panel */}
      <NodePanel
        nodo={selectedNodo}
        onClose={() => setSelectedNodo(null)}
        onSave={handleSaveNodo}
        onDelete={handleDeleteNodo}
      />
    </div>
  )
}
