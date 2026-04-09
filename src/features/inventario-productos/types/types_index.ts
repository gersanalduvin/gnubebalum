// Tipos para el módulo de Inventario - Productos

export interface InventarioProducto {
  id: number
  uuid: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria_id?: number
  unidad_medida: UnidadMedida
  precio_venta: number
  stock_minimo: number
  stock_maximo: number
  stock_actual: number
  costo_promedio: number
  moneda: boolean // false = Córdoba, true = Dólar
  cuenta_inventario_id: number
  cuenta_costo_id: number
  cuenta_venta_id: number
  activo: boolean
  is_synced: boolean
  synced_at?: string
  updated_locally_at?: string
  version: number
  created_by: number
  updated_by?: number
  deleted_by?: number
  created_at: string
  updated_at: string
  deleted_at?: string
  cambios?: CambioAuditoria[]
}

export interface CreateProductoRequest {
  codigo: string
  nombre: string
  descripcion?: string
  categoria_id?: number | null
  unidad_medida: UnidadMedida
  precio_venta: number
  stock_minimo: number
  stock_maximo: number
  stock_actual: number
  costo_promedio: number
  moneda: boolean
  cuenta_inventario_id: number | null
  cuenta_costo_id: number | null
  cuenta_venta_id: number | null
  activo?: boolean
  // Campos opcionales para inventario inicial
  documento_tipo?: string
  documento_numero?: string
  documento_fecha?: string
  observaciones?: string
}

export interface UpdateProductoRequest {
  codigo?: string
  nombre?: string
  descripcion?: string
  categoria_id?: number | null
  unidad_medida?: UnidadMedida
  precio_venta?: number
  stock_minimo?: number
  stock_maximo?: number
  stock_actual?: number
  costo_promedio?: number
  moneda?: boolean
  cuenta_inventario_id?: number | null
  cuenta_costo_id?: number | null
  cuenta_venta_id?: number | null
  activo?: boolean
}

export interface UpdateStockRequest {
  stock: number
  motivo: string
}

export interface BuscarProductoRequest {
  codigo?: string
  nombre?: string
}

export interface CambioAuditoria {
  campo: string
  campo_modificado?: string
  valor_anterior: any
  valor_nuevo: any
  usuario: string
  fecha: string
  accion?: string
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: any[]
  next_page_url?: string
  path: string
  per_page: number
  prev_page_url?: string
  to: number
  total: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

// Enums y constantes
export type UnidadMedida = 
  | 'UND' | 'PAR' | 'DOC' | 'CEN' | 'MIL'  // Unidades básicas
  | 'KG' | 'GR' | 'LB' | 'OZ'              // Peso
  | 'LT' | 'ML' | 'GL'                     // Volumen
  | 'M' | 'CM' | 'MM' | 'IN' | 'FT'        // Longitud
  | 'M2' | 'M3'                            // Área y Volumen
  | 'CAJ' | 'PAQ' | 'BOL' | 'SAC' | 'TAM' | 'BAR' | 'ROL' | 'PLI'  // Contenedores
  | 'JGO' | 'SET' | 'KIT' | 'LOT'          // Conjuntos
  | 'SRV' | 'HOR' | 'DIA' | 'MES' | 'AÑO'  // Servicios y Tiempo

export const UNIDADES_MEDIDA: { value: UnidadMedida; label: string; categoria: string }[] = [
  // Unidades básicas
  { value: 'UND', label: 'Unidad', categoria: 'Básicas' },
  { value: 'PAR', label: 'Par', categoria: 'Básicas' },
  { value: 'DOC', label: 'Docena', categoria: 'Básicas' },
  { value: 'CEN', label: 'Centena', categoria: 'Básicas' },
  { value: 'MIL', label: 'Millar', categoria: 'Básicas' },
  
  // Peso
  { value: 'KG', label: 'Kilogramo', categoria: 'Peso' },
  { value: 'GR', label: 'Gramo', categoria: 'Peso' },
  { value: 'LB', label: 'Libra', categoria: 'Peso' },
  { value: 'OZ', label: 'Onza', categoria: 'Peso' },
  
  // Volumen
  { value: 'LT', label: 'Litro', categoria: 'Volumen' },
  { value: 'ML', label: 'Mililitro', categoria: 'Volumen' },
  { value: 'GL', label: 'Galón', categoria: 'Volumen' },
  
  // Longitud
  { value: 'M', label: 'Metro', categoria: 'Longitud' },
  { value: 'CM', label: 'Centímetro', categoria: 'Longitud' },
  { value: 'MM', label: 'Milímetro', categoria: 'Longitud' },
  { value: 'IN', label: 'Pulgada', categoria: 'Longitud' },
  { value: 'FT', label: 'Pie', categoria: 'Longitud' },
  
  // Área y Volumen
  { value: 'M2', label: 'Metro cuadrado', categoria: 'Área' },
  { value: 'M3', label: 'Metro cúbico', categoria: 'Volumen' },
  
  // Contenedores
  { value: 'CAJ', label: 'Caja', categoria: 'Contenedores' },
  { value: 'PAQ', label: 'Paquete', categoria: 'Contenedores' },
  { value: 'BOL', label: 'Bolsa', categoria: 'Contenedores' },
  { value: 'SAC', label: 'Saco', categoria: 'Contenedores' },
  { value: 'TAM', label: 'Tambor', categoria: 'Contenedores' },
  { value: 'BAR', label: 'Barril', categoria: 'Contenedores' },
  { value: 'ROL', label: 'Rollo', categoria: 'Contenedores' },
  { value: 'PLI', label: 'Pliego', categoria: 'Contenedores' },
  
  // Conjuntos
  { value: 'JGO', label: 'Juego', categoria: 'Conjuntos' },
  { value: 'SET', label: 'Set', categoria: 'Conjuntos' },
  { value: 'KIT', label: 'Kit', categoria: 'Conjuntos' },
  { value: 'LOT', label: 'Lote', categoria: 'Conjuntos' },
  
  // Servicios y Tiempo
  { value: 'SRV', label: 'Servicio', categoria: 'Servicios' },
  { value: 'HOR', label: 'Hora', categoria: 'Tiempo' },
  { value: 'DIA', label: 'Día', categoria: 'Tiempo' },
  { value: 'MES', label: 'Mes', categoria: 'Tiempo' },
  { value: 'AÑO', label: 'Año', categoria: 'Tiempo' }
]

export const ESTADOS_PRODUCTO = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' }
]

export const TIPOS_MONEDA = [
  { value: false, label: 'Córdoba (C$)' },
  { value: true, label: 'Dólar (US$)' }
]

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

// Interfaces para opciones de select
export interface CategoriaOption {
  id: number
  nombre: string
  codigo?: string
}

export interface CuentaContableOption {
  id: number
  codigo: string
  nombre: string
  tipo: string
}

// Tipos para filtros y búsqueda
export interface ProductoFilters {
  search?: string
  categoria_id?: number | null
  activo?: boolean | null
  stock_bajo?: boolean
  unidad_medida?: string | null
  moneda?: boolean | null
}

export interface ProductoSearchParams {
  page?: number
  per_page?: number
  search?: string
  categoria_id?: number
  activo?: boolean
  stock_bajo?: boolean
  moneda?: boolean
}
