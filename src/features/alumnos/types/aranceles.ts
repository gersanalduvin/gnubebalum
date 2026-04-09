// Tipos para el módulo de Aranceles de Usuarios

export interface UserArancel {
  id: number
  rubro_id: number | null
  user_id: number
  aranceles_id: number | null
  producto_id: number | null
  importe: string
  beca: string
  descuento: string
  importe_total: string
  recargo: string
  saldo_pagado: string
  recargo_pagado: string
  saldo_actual: string
  estado: 'pendiente' | 'pagado' | 'exonerado'
  fecha_exonerado: string | null
  observacion_exonerado: string | null
  fecha_recargo_anulado: string | null
  recargo_anulado_por: number | null
  observacion_recargo: string | null
  created_by: number | null
  updated_by: number | null
  deleted_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  
  // Relaciones
  rubro?: Rubro
  usuario?: Usuario
  arancel?: Arancel
  producto?: Producto
  config_plan_pago_detalle?: ConfigPlanPagoDetalle
}

export interface ConfigPlanPagoDetalle {
  id: number
  nombre: string
  orden_mes: number
}

export interface Rubro {
  id: number
  nombre: string
}

export interface Usuario {
  id: number
  name: string
  email: string
}

export interface Arancel {
  id: number
  nombre: string
  descripcion?: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
}

export interface UserArancelFormData {
  rubro_id?: number | null
  user_id: number
  aranceles_id?: number | null
  producto_id?: number | null
  importe: number
  beca?: number
  descuento?: number
  importe_total: number
  recargo?: number
  saldo_actual: number
}

export interface UserArancelFilters {
  page?: number
  per_page?: number
  user_id?: number
  estado?: 'pendiente' | 'pagado' | 'exonerado'
  rubro_id?: number
}

export interface UserArancelResponse {
  current_page: number
  data: UserArancel[]
  per_page: number
  total: number
}

// Interfaces para operaciones específicas
export interface AnularRecargoRequest {
  ids: number[]
  observacion_recargo: string
}

export interface AnularRecargoResponse {
  registros_actualizados: number
  ids_procesados: number[]
}

export interface ExonerarArancelesRequest {
  ids: number[]
  observacion_exonerado: string
}

export interface ExonerarArancelesResponse {
  registros_actualizados: number
  ids_procesados: number[]
}

export interface AplicarBecaRequest {
  ids: number[]
  beca: number
}

export interface AplicarDescuentoRequest {
  ids: number[]
  descuento: number
}

export interface AplicarPlanPagoRequest {
  user_id: number
  plan_pago_id: number
}

export interface AplicarPlanPagoResponse {
  aranceles_creados: number
  total_importe: string
  plan_aplicado: {
    id: number
    nombre: string
  }
  aranceles: UserArancel[]
}

export interface AplicarPagoRequest {
  ids: number[]
}

export interface AplicarPagoResponse {
  aranceles_pagados: number
  total_pagado: string
  total_recargo_pagado: string
  detalle_pagos: {
    id: number
    saldo_pagado: string
    recargo_pagado: string
    total_pago: string
  }[]
}

export interface EstadisticasAranceles {
  total_aranceles: number
  total_pendientes: number
  total_pagados: number
  total_exonerados: number
  total_importe_pendiente: string
  total_recargos_pendientes: string
  porcentaje_cobranza: number
}

// Interfaces para períodos lectivos y planes de pago
export interface PeriodoLectivo {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
}

export interface PlanPago {
  id: number
  nombre: string
  descripcion?: string
  periodo_lectivo_id: number
  activo: boolean
}
