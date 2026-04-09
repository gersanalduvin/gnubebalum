export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

export type ValidationErrors = Record<string, string[]>

export interface Alumno {
  id: number
  primer_nombre: string
  segundo_nombre?: string
  primer_apellido: string
  segundo_apellido?: string
  email?: string
  codigo_mined?: string
  codigo_unico?: string
  tipo_usuario?: string
  arancelesPendientes?: ArancelPendiente[]
  formato?: 'cualitativo' | 'cuantitativo'
  grado?: string
  seccion?: string
}

export interface ArancelPendiente {
  id: number
  rubro_id?: number
  aranceles_id?: number
  producto_id?: number
  importe_total: number
  saldo_actual: number
  estado: string
  rubro?: {
    id: number
    codigo?: string
    nombre?: string
    orden_mes?: number
  }
}

export interface ProductoCatalogo {
  id: number
  codigo: string
  nombre: string
  precio_venta: number
  stock_actual?: number
  activo?: boolean
}

export interface ArancelCatalogo {
  id: number
  codigo: string
  nombre: string
  monto: number
  precio?: number
  activo?: boolean
}

export interface FormaPagoCatalogo {
  id: number
  nombre: string
  abreviatura?: string
  activo?: boolean
}

export interface ReciboDetalleRequest {
  concepto: string
  cantidad: number
  monto: number
  descuento?: number
  tipo_pago: 'total' | 'parcial'
  aranceles_id?: number
  producto_id?: number
  rubro_id?: number
}

export interface FormaPagoEntry {
  forma_pago_id: number
  monto: number
}

export interface CreateReciboRequest {
  numero_recibo: string
  tipo: 'interno' | 'externo'
  user_id: number | null
  fecha: string
  nombre_usuario: string
  grado?: string
  seccion?: string
  detalles: ReciboDetalleRequest[]
  formas_pago: FormaPagoEntry[]
}

export interface Recibo {
  id: number
  numero_recibo: string
  tipo: 'interno' | 'externo'
  estado: 'activo' | 'anulado'
  fecha: string
  nombre_usuario: string
  total: number
  tasa_cambio: number
}

export interface ReciboReporte {
  recibo: { id: number; numero_recibo: string; total: number; tasa_cambio: number }
}
