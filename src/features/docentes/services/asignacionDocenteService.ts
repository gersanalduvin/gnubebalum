import type { ApiResponse } from '@/features/docentes/types'
import type { NotAsignaturaGradoDocente } from '@/features/docentes/types/asignaciones'
import { httpClient } from '@/utils/httpClient'

const BASE_URL = '/bk/v1/usuarios/docentes'

export const asignacionDocenteService = {
  getByDocente: async (userId: number): Promise<NotAsignaturaGradoDocente[]> => {
    const response = await httpClient.get<ApiResponse<NotAsignaturaGradoDocente[]>>(`${BASE_URL}/${userId}/asignaciones`)
    return response?.data || []
  },

  create: async (data: {
    user_id: number
    grupo_id: number
    asignatura_grado_id: number
    permiso_fecha_corte1?: string | null
    permiso_fecha_corte2?: string | null
    permiso_fecha_corte3?: string | null
    permiso_fecha_corte4?: string | null
  }): Promise<ApiResponse<NotAsignaturaGradoDocente>> => {
    const response = await httpClient.post<ApiResponse<NotAsignaturaGradoDocente>>(`${BASE_URL}/${data.user_id}/asignaciones`, data)
    return response as any
  },

  createBulk: async (data: {
    user_id: number
    grupo_id: number
    asignatura_grado_ids: number[]
  }): Promise<ApiResponse<NotAsignaturaGradoDocente[]>> => {
    const response = await httpClient.post<ApiResponse<NotAsignaturaGradoDocente[]>>(`${BASE_URL}/${data.user_id}/asignaciones/bulk`, data)
    return response as any
  },

  updatePermisos: async (
    id: number,
    fechas: {
      permiso_fecha_corte1?: string | null
      permiso_fecha_corte2?: string | null
      permiso_fecha_corte3?: string | null
      permiso_fecha_corte4?: string | null
    },
    docenteId?: number // we need docenteId for url
  ): Promise<ApiResponse<boolean>> => {
      // NOTE: The update endpoint in backend takes docentId in path: /{docenteId}/asignaciones/{id}
      // If we don't have docenteId passed here, we might have issues if strict.
      // Assuming caller provides it or we might need to adjust signature.
      // For now, let's assume id is unique enough but route requires param.
      // The frontend tab knows the docenteId.
      if (!docenteId) throw new Error("docenteId is required for updating assignments")
      
    const response = await httpClient.put<ApiResponse<boolean>>(`${BASE_URL}/${docenteId}/asignaciones/${id}`, fechas)
    return response as any
  },

  delete: async (id: number, docenteId?: number): Promise<ApiResponse<null>> => {
      if (!docenteId) throw new Error("docenteId is required for deleting assignments")
    const response = await httpClient.delete<ApiResponse<null>>(`${BASE_URL}/${docenteId}/asignaciones/${id}`)
    return response as any
  },

  getUnassignedGlobal: async (params?: { periodo_lectivo_id: number; grado_id?: number; grupo_id?: number }): Promise<any[]> => {
    const query = new URLSearchParams()
    if (params?.periodo_lectivo_id) query.append('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params?.grado_id) query.append('grado_id', String(params.grado_id))
    
    // The backend endpoint name is currently mapped to unassignedGlobal which returns the filtered list.
    const response = await httpClient.get<ApiResponse<any[]>>(`${BASE_URL}/asignaciones/no-asignadas?${query.toString()}`)
    return response?.data || []
  },

  exportPdf: async (docenteId: number, periodoLectivoId: number): Promise<Blob> => {
    const query = new URLSearchParams({ periodo_lectivo_id: String(periodoLectivoId) })
    const response = await httpClient.get<any>(`${BASE_URL}/${docenteId}/asignaciones-pdf?${query.toString()}`, {
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' }
    })
    return response.data
  }
}

