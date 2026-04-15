import { httpClient } from '@/utils/httpClient'

export interface AdminAsignacion {
  id: number
  id_asignacion: number
  user_id: number
  grupo_id: number
  asignatura_grado_id: number
  docente_nombre: string
  materia_nombre: string
  grado_nombre: string
  seccion_nombre: string
  turno_nombre: string
  grupo_nombre: string
  estudiantes_count: number
}

export interface AdminFiltros {
  periodos: { id: number; nombre: string }[]
  grupos: { id: number; nombre: string; periodo_lectivo_id: number }[]
  docentes: { id: number; nombre: string }[]
}

export interface AdminFiltersParams {
  periodo_lectivo_id?: number
  grupo_id?: number
  docente_id?: number
  asignatura_grado_id?: number
}

/**
 * Obtiene todas las asignaciones del sistema con filtros opcionales.
 */
export const getAllAssignments = async (filters: AdminFiltersParams = {}): Promise<AdminAsignacion[]> => {
  const params = new URLSearchParams()
  if (filters.periodo_lectivo_id) params.set('periodo_lectivo_id', String(filters.periodo_lectivo_id))
  if (filters.grupo_id) params.set('grupo_id', String(filters.grupo_id))
  if (filters.docente_id) params.set('docente_id', String(filters.docente_id))
  if (filters.asignatura_grado_id) params.set('asignatura_grado_id', String(filters.asignatura_grado_id))

  const qs = params.toString()
  const url = `/bk/v1/admin-portal/asignaciones${qs ? `?${qs}` : ''}`
  const response = await httpClient.get<any>(url)
  // httpClient returns ApiResponse<T>; successResponse wraps data in { data: [...] }
  return (response as any)?.data ?? response ?? []
}

/**
 * Obtiene las opciones para los filtros del panel administrativo
 * (periodos, grupos, docentes).
 */
export const getAdminFiltros = async (periodoId?: number): Promise<AdminFiltros> => {
  const url = periodoId
    ? `/bk/v1/admin-portal/filtros?periodo_lectivo_id=${periodoId}`
    : '/bk/v1/admin-portal/filtros'

  const response = await httpClient.get<any>(url)
  // Same ApiResponse wrapping
  const data = (response as any)?.data ?? response
  return data ?? { periodos: [], grupos: [], docentes: [] }
}

