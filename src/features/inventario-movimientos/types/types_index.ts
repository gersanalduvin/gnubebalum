// Tipos para el módulo de Movimientos de Inventario

export interface MovimientoInventario {
  id: number
  uuid: string
  producto_id: number
  tipo_movimiento: TipoMovimiento
  cantidad: string
  costo_unitario: string
  costo_total: string // Campo que viene del backend
  valor_total?: string // Campo calculado para compatibilidad
  stock_anterior: string
  stock_posterior: string
  almacen_id: number
  usuario_id: number
  moneda: boolean // true = USD, false = NIO
  documento_tipo?: string
  documento_numero?: string
  documento_fecha?: string
  proveedor_id?: number
  cliente_id?: number
  estado: EstadoMovimiento
  observaciones?: string
  fecha_movimiento: string
  created_by: number
  updated_by: number
  deleted_by?: number
  cambios: CambioAuditoria[]
  is_synced: boolean
  synced_at?: string
  updated_locally_at?: string
  version: number
  created_at: string
  updated_at: string
  deleted_at?: string
  propiedades_adicionales?: {
    motivo_ajuste?: string
  }
  
  // Relaciones
  producto?: ProductoRelacion
  almacen?: AlmacenRelacion
  usuario?: UsuarioRelacion
  proveedor?: ProveedorRelacion
  cliente?: ClienteRelacion
  kardex?: KardexRelacion[]
}

export interface ProductoRelacion {
  id: number
  nombre: string
  codigo: string
}

export interface AlmacenRelacion {
  id: number
  nombre: string
}

export interface UsuarioRelacion {
  id: number
  name: string
  email: string
}

export interface ProveedorRelacion {
  id: number
  nombre: string
}

export interface ClienteRelacion {
  id: number
  nombre: string
}

export interface KardexRelacion {
  id: number
  stock_posterior: string
  costo_promedio_posterior: string
}

export interface CambioAuditoria {
  accion: string
  usuario: string
  fecha: string
  datos_anteriores?: any
  datos_nuevos?: any
}

export type TipoMovimiento = 
  | 'entrada'
  | 'salida'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'transferencia'

export type EstadoMovimiento = 
  | 'pendiente'
  | 'procesado'
  | 'cancelado'

export interface MovimientoFilters {
  tipo_movimiento?: TipoMovimiento
  producto_id?: number
  almacen_id?: number
  usuario_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  estado?: EstadoMovimiento
  moneda?: boolean
  documento_tipo?: string
  documento_numero?: string
  proveedor_id?: number
  cliente_id?: number
}

export interface CreateMovimientoData {
  producto_id: number
  tipo_movimiento: TipoMovimiento
  cantidad: string
  costo_unitario?: string
  almacen_id: number
  documento_tipo?: string
  documento_numero?: string
  documento_fecha?: string
  proveedor_id?: number
  cliente_id?: number
  observaciones?: string
  propiedades_adicionales?: {
    motivo_ajuste?: string
  }
}

export interface UpdateMovimientoData {
  cantidad?: string
  costo_unitario?: string
  documento_tipo?: string
  documento_numero?: string
  documento_fecha?: string
  proveedor_id?: number
  cliente_id?: number
  observaciones?: string
}

export interface PaginatedMovimientosResponse {
  current_page: number
  data: MovimientoInventario[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: PaginationLink[]
  next_page_url?: string
  path: string
  per_page: number
  prev_page_url?: string
  to: number
  total: number
}

export interface PaginationLink {
  url?: string
  label: string
  active: boolean
}

export interface MovimientosEstadisticas {
  total_movimientos: number
  movimientos_por_tipo: {
    entrada: number
    salida: number
    ajuste_positivo: number
    ajuste_negativo: number
  }
  valor_total_movimientos: {
    USD: string
    NIO: string
  }
  movimientos_mes_actual: number
  productos_con_movimientos: number
}

export interface ResumenStock {
  producto_id: number
  producto_nombre: string
  stock_actual: string
  valor_inventario_USD: string
  valor_inventario_NIO: string
  ultimo_movimiento: string
  tipo_ultimo_movimiento: TipoMovimiento
}

// Constantes para tipos de movimiento
export const TIPOS_MOVIMIENTO = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste_positivo', label: 'Ajuste Positivo' },
  { value: 'ajuste_negativo', label: 'Ajuste Negativo' },
  { value: 'transferencia', label: 'Transferencia' }
] as const

// Constantes para estados de movimiento
export const ESTADOS_MOVIMIENTO = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'procesado', label: 'Procesado' },
  { value: 'cancelado', label: 'Cancelado' }
] as const

// Constantes para tipos de documento
export const TIPOS_DOCUMENTO = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'RECIBO', label: 'Recibo' },
  { value: 'ORDEN_COMPRA', label: 'Orden de Compra' },
  { value: 'NOTA_ENTREGA', label: 'Nota de Entrega' },
  { value: 'AJUSTE', label: 'Ajuste de Inventario' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'OTRO', label: 'Otro' }
] as const

// Función helper para obtener el label de un tipo de movimiento
export interface ValidationErrors {
  [key: string]: string[]
}

export const getTipoMovimientoLabel = (tipo: TipoMovimiento): string => {
  const tipoObj = TIPOS_MOVIMIENTO.find(t => t.value === tipo)
  return tipoObj?.label || tipo
}

// Función helper para obtener el label de un estado
export const getEstadoMovimientoLabel = (estado: EstadoMovimiento): string => {
  const estadoObj = ESTADOS_MOVIMIENTO.find(e => e.value === estado)
  return estadoObj?.label || estado
}

// Función helper para obtener el color del chip según el tipo de movimiento
export const getTipoMovimientoColor = (tipo: TipoMovimiento): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  switch (tipo) {
    case 'entrada':
      return 'success'
    case 'salida':
      return 'error'
    case 'ajuste_positivo':
      return 'info'
    case 'ajuste_negativo':
      return 'warning'
    case 'transferencia':
      return 'info'
    default:
      return 'default'
  }
}

// Función helper para obtener el color del chip según el estado
export const getEstadoMovimientoColor = (estado: EstadoMovimiento): 'success' | 'error' | 'warning' | 'default' => {
  switch (estado) {
    case 'procesado':
      return 'success'
    case 'cancelado':
      return 'error'
    case 'pendiente':
      return 'warning'
    default:
      return 'default'
  }
}