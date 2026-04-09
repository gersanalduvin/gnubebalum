import { httpClient } from '@/utils/httpClient'

export const getGradesByAssignment = async (assignmentId: number, corteId: number) => {
  const response = await httpClient.get<any>(`/bk/v1/calificaciones/asignacion/${assignmentId}/corte/${corteId}`)
  return response || {}
}

export const getAssignmentMetadata = async (assignmentId: number) => {
  const response = await httpClient.get<any>(`/bk/v1/calificaciones/asignacion/${assignmentId}/metadata`)
  return response || {}
}

export const saveGrade = async (payload: { 
    user_id: number; 
    evidencia_id?: number | null; 
    tarea_id?: number | null; 
    nota?: number; 
    escala_detalle_id?: number;
    indicadores_check?: any;
    observaciones?: string;
    retroalimentacion?: string;
    estado?: string;
}) => {
  const response = await httpClient.post<any>('/bk/v1/calificaciones', payload)
  return response
}

export const saveGradesBatch = async (grades: any[]): Promise<any> => {
    // Each grade should optionally include scale and indicators
    const response = await httpClient.post('/bk/v1/calificaciones/batch', { grades })
    return response
}

export const updateTaskStatusBatch = async (taskId: number, status: string) => {
    try {
        const response = await httpClient.post('/bk/v1/calificaciones/batch-status', { tarea_id: taskId, status })
        return response
    } catch (error) {
        console.error('Error batch updating status', error)
        throw error
    }
}

export const getGradeDetails = async (taskId: number, studentId: number) => {
    try {
        const response = await httpClient.get(`/bk/v1/calificaciones/details?tarea_id=${taskId}&student_id=${studentId}`)
        return response
    } catch (error) {
        console.error('Error getting grade details', error)
        throw error
    }
}

// ─── Evidencias Personalizadas – Estudiante Especial (Educación Inicial) ─────

export interface EvidenciaEspecial {
  id: number
  uuid: string
  evidencia: string
  indicador: Record<string, string> | null
}

/** Obtiene las evidencias personalizadas de un estudiante para un corte-asignatura */
export const getEvidenciasEspeciales = async (
  studentId: number,
  asignaturaGradoCorteId: number
): Promise<{ estudiante_id: number; asignatura_grado_cortes_id: number; evidencias: EvidenciaEspecial[] }> => {
  const response = await httpClient.get<any>(
    `/bk/v1/calificaciones/estudiante-especial/${studentId}/corte/${asignaturaGradoCorteId}`
  )
  return response || { evidencias: [] }
}

/** Crea una evidencia personalizada para varios estudiantes especiales */
export const createEvidenciaEspecial = async (payload: {
  estudiantes_ids: number[]
  asignatura_grado_cortes_id: number
  evidencia: string
  indicador?: Record<string, string> | null
}): Promise<EvidenciaEspecial[]> => {
  const response = await httpClient.post<any>('/bk/v1/calificaciones/estudiante-especial', payload)
  return (response as any)?.evidencias || []
}

/** Actualiza una evidencia personalizada */
export const updateEvidenciaEspecial = async (
  id: number,
  payload: { evidencia: string; indicador?: Record<string, string> | null }
): Promise<EvidenciaEspecial> => {
  const response = await httpClient.put<any>(`/bk/v1/calificaciones/estudiante-especial/${id}`, payload)
  // httpClient.put retorna ApiResponse<T>; el backend envuelve en { evidencia: {...} }
  return (response as any)?.evidencia
}

/** Elimina (soft) una evidencia personalizada */
export const deleteEvidenciaEspecial = async (id: number): Promise<void> => {
  await httpClient.delete(`/bk/v1/calificaciones/estudiante-especial/${id}`)
}
