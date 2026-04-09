'use client'

export type TipoRecibo = 'interno' | 'externo' | 'todos'

export interface CierreCajaDetalle {
  fecha: string
  numero_recibo: string
  tipo: string
  nombre_usuario: string
  concepto: string
  monto: number
  descuento: number
  subtotal: number
  total_recibo: number
  estado: string
  total: number
  cantidad: number
}

export interface CierreCajaConceptoItem {
  concepto: string
  cantidad: number
  monto: number
  total: number
}

export interface ApiListResponse<T> {
  success: boolean
  data: T
  message?: string
}
