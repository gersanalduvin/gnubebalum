// Tipos para el módulo de Configuración de Plan de Pagos

export interface ConfigPlanPago {
  id: number
  uuid: string
  nombre: string
  estado: boolean // Cambiado de 'activo' a 'estado' según API
  periodo_lectivo_id: number // Campo faltante según API
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  deleted_at: string | null
  cambios: CambioAuditoria[]
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface CambioAuditoria {
  accion: string
  usuario_id?: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any> | null
}

export interface CreatePlanPagoRequest {
  nombre: string
  estado?: boolean // Cambiado de 'activo' a 'estado'
  periodo_lectivo_id: number // Campo faltante según API
}

export interface UpdatePlanPagoRequest {
  nombre?: string
  estado?: boolean // Cambiado de 'activo' a 'estado'
  periodo_lectivo_id?: number // Campo faltante según API
}

// Nuevo tipo para ConfigPlanPagoDetalle según API
export interface ConfigPlanPagoDetalle {
  id: number
  uuid: string
  plan_pago_id: number
  codigo: string
  nombre: string
  importe: number
  cuenta_debito_id: number | null
  cuenta_credito_id: number | null
  cuenta_recargo_id: number | null
  es_colegiatura: boolean
  asociar_mes: 'enero' | 'febrero' | 'marzo' | 'abril' | 'mayo' | 'junio' | 'julio' | 'agosto' | 'septiembre' | 'octubre' | 'noviembre' | 'diciembre' | null
  fecha_vencimiento: string | null
  importe_recargo: number
  tipo_recargo: 'fijo' | 'porcentaje' | null
  moneda: boolean // false=Córdoba, true=Dólar
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  cambios: CambioAuditoria[]
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface CreatePlanPagoDetalleRequest {
  plan_pago_id: number
  codigo: string
  nombre: string
  importe: number
  cuenta_debito_id?: number | undefined
  cuenta_credito_id?: number | undefined
  cuenta_recargo_id?: number | undefined
  es_colegiatura?: boolean
  asociar_mes?: 'enero' | 'febrero' | 'marzo' | 'abril' | 'mayo' | 'junio' | 'julio' | 'agosto' | 'septiembre' | 'octubre' | 'noviembre' | 'diciembre' | null
  fecha_vencimiento?: string
  importe_recargo?: number
  tipo_recargo?: 'fijo' | 'porcentaje'
  moneda?: boolean
}

export interface UpdatePlanPagoDetalleRequest {
  codigo?: string
  nombre?: string
  importe?: number
  cuenta_debito_id?: number
  cuenta_credito_id?: number
  cuenta_recargo_id?: number
  es_colegiatura?: boolean
  asociar_mes?: 'enero' | 'febrero' | 'marzo' | 'abril' | 'mayo' | 'junio' | 'julio' | 'agosto' | 'septiembre' | 'octubre' | 'noviembre' | 'diciembre' | null
  fecha_vencimiento?: string
  importe_recargo?: number
  tipo_recargo?: 'fijo' | 'porcentaje'
  moneda?: boolean
}

export interface PlanPagoPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigPlanPago[]
    per_page: number
    total: number
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    links: any[]
    next_page_url: string | null
    path: string
    prev_page_url: string | null
    to: number
  }
  message: string
}

export interface PlanPagoSearchParams {
  page?: number
  per_page?: number
  size?: number
  search?: string
  estado?: boolean // Cambiado de 'activo' a 'estado'
  periodo_lectivo_id?: number // Campo faltante según API
}

export interface PlanPagoTableFilters {
  search: string
  cursoLectivo?: string
}

export interface PlanPagoModalState {
  open: boolean
  mode: 'create' | 'edit'
  planPago: ConfigPlanPago | undefined
}

export interface DeleteConfirmState {
  open: boolean
  planPago: ConfigPlanPago | undefined
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

export interface ValidationErrors {
  [key: string]: string[]
}

// Tipos específicos para Rubros (usando ConfigPlanPagoDetalle como base)
export type ConfigRubro = ConfigPlanPagoDetalle

export type CreateRubroRequest = CreatePlanPagoDetalleRequest

export type UpdateRubroRequest = UpdatePlanPagoDetalleRequest

export interface RubroModalState {
  open: boolean
  mode: 'create' | 'edit'
  rubro: ConfigRubro | undefined
}

export interface RubroDeleteConfirmState {
  open: boolean
  rubro: ConfigRubro | undefined
}

// Tipos para Curso Lectivo (selector)
export interface CursoLectivo {
  id: number
  nombre: string
  activo: boolean
}

// Nuevo tipo para Catálogo de Cuentas según API
export interface CatalogoCuenta {
  id: number
  codigo: string
  nombre: string
  tipo: string
  activo: boolean
}