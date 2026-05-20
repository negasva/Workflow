export type TipoNodo = 'yo' | 'cliente' | 'inicio'

export interface Kit {
  id: string
  nombre: string
  created_at: string
}

export interface Nodo {
  id: string
  kit_id: string
  tipo: TipoNodo
  texto: string
  posicion_x: number
  posicion_y: number
  ancho?: number
  alto?: number
  font_size?: number
  created_at: string
}

export interface Conexion {
  id: string
  kit_id: string
  nodo_origen_id: string
  nodo_destino_id: string
  source_handle?: string | null
  target_handle?: string | null
}
