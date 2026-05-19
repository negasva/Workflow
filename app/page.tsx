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
          <svg className="animate-pulse mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          <p className="text-[#555] text-sm">Cargando CopyFlow...</p>
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
              {mode === 'venta' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              )}
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
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
