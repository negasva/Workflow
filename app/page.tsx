'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Kit, Nodo, Conexion } from '@/types'
import Sidebar from '@/components/Sidebar'
import ModoVenta from '@/components/ModoVenta'
import dynamicImport from 'next/dynamic'

const ModoEditor = dynamicImport(() => import('@/components/ModoEditor'), { ssr: false })

export default function Home() {
  const [kits, setKits] = useState<Kit[]>([])
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [mode, setMode] = useState<'venta' | 'editor'>('venta')
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [loading, setLoading] = useState(true)
  const [kitLoading, setKitLoading] = useState(false)

  const selectedKit = kits.find((k) => k.id === selectedKitId)

  // Load all kits
  const loadKits = useCallback(async () => {
    const { data } = await supabase
      .from('kits')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) {
      setKits(data)
      if (!selectedKitId && data.length > 0) {
        setSelectedKitId(data[0].id)
      }
    }
    setLoading(false)
  }, [selectedKitId])

  useEffect(() => {
    loadKits()
  }, [])

  // Load kit data when selection changes
  const loadKitData = useCallback(async (kitId: string) => {
    setKitLoading(true)
    const [nodosRes, conexionesRes] = await Promise.all([
      supabase.from('nodos').select('*').eq('kit_id', kitId).order('created_at', { ascending: true }),
      supabase.from('conexiones').select('*').eq('kit_id', kitId),
    ])
    setNodos(nodosRes.data ?? [])
    setConexiones(conexionesRes.data ?? [])
    setKitLoading(false)
  }, [])

  useEffect(() => {
    if (selectedKitId) {
      loadKitData(selectedKitId)
    }
  }, [selectedKitId, loadKitData])

  const handleSelectKit = useCallback((id: string) => {
    setSelectedKitId(id)
  }, [])

  const handleToggleMode = useCallback(() => {
    setMode((m) => (m === 'venta' ? 'editor' : 'venta'))
  }, [])

  const handleAddKit = useCallback(async () => {
    const nombre = `Kit ${kits.length + 1}`
    const { data: kitData, error: kitError } = await supabase
      .from('kits')
      .insert({ nombre })
      .select()
      .single()
    if (kitError || !kitData) return

    await supabase.from('nodos').insert({
      kit_id: kitData.id,
      tipo: 'inicio',
      texto: 'Mensaje inicial — edítame',
      posicion_x: 0,
      posicion_y: 0,
    })

    await loadKits()
    setSelectedKitId(kitData.id)
  }, [kits.length, loadKits])

  const handleDeleteKit = useCallback(
    async (id: string) => {
      await supabase.from('kits').delete().eq('id', id)
      const updatedKits = kits.filter((k) => k.id !== id)
      setKits(updatedKits)
      if (selectedKitId === id) {
        setSelectedKitId(updatedKits[0]?.id ?? null)
      }
    },
    [kits, selectedKitId]
  )

  const handleRenameKit = useCallback(
    async (id: string, nombre: string) => {
      await supabase.from('kits').update({ nombre }).eq('id', id)
      setKits((ks) => ks.map((k) => (k.id === id ? { ...k, nombre } : k)))
    },
    []
  )

  const handleDataChange = useCallback(() => {
    if (selectedKitId) loadKitData(selectedKitId)
  }, [selectedKitId, loadKitData])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-pulse">🖋️</div>
          <p className="text-[#555] text-sm">Cargando TattoFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        kits={kits}
        selectedKitId={selectedKitId}
        mode={mode}
        onSelectKit={handleSelectKit}
        onToggleMode={handleToggleMode}
        onAddKit={handleAddKit}
        onDeleteKit={handleDeleteKit}
        onRenameKit={handleRenameKit}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Kit header */}
        <div className="px-6 py-3 border-b border-[#222] bg-[#0f0f0f] flex items-center gap-3 min-h-[52px]">
          {selectedKit ? (
            <>
              <span className="text-lg">
                {mode === 'venta' ? '💬' : '✏️'}
              </span>
              <h1 className="text-white font-semibold text-sm">{selectedKit.nombre}</h1>
              <span className="text-xs text-[#444] px-2 py-0.5 bg-[#1a1a1a] rounded-full border border-[#2a2a2a]">
                {mode === 'venta' ? 'Modo Venta' : 'Modo Editor'}
              </span>
            </>
          ) : (
            <span className="text-[#444] text-sm">Selecciona un kit</span>
          )}
        </div>

        {/* Content */}
        {kitLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[#555] text-sm animate-pulse">Cargando kit...</div>
          </div>
        ) : !selectedKit ? (
          <div className="flex-1 flex items-center justify-center text-[#444]">
            <div className="text-center">
              <div className="text-5xl mb-4">🖋️</div>
              <p>Selecciona o crea un kit</p>
            </div>
          </div>
        ) : mode === 'venta' ? (
          <ModoVenta nodos={nodos} conexiones={conexiones} />
        ) : (
          <ModoEditor
            key={selectedKitId!}
            kit={selectedKit}
            nodos={nodos}
            conexiones={conexiones}
            onDataChange={handleDataChange}
          />
        )}
      </main>
    </div>
  )
}
