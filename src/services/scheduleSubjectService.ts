import { NotAsignaturaGradoPayload } from '@/features/not-asignatura-grado/services/notAsignaturaGradoService';
import { httpClient } from '@/utils/httpClient';

const BASE = '/bk/v1/horarios/asignaturas'

const getPeriodosYGrados = async (): Promise<{ periodos: any[]; grados: any[] }> => {
  const response = await httpClient.get<any>(`${BASE}/periodos-y-grados`)
  const payload = response?.data || {}
  return {
    periodos: Array.isArray(payload.periodos) ? payload.periodos : [],
    grados: Array.isArray(payload.grados) ? payload.grados : []
  }
}

const list = async (params: URLSearchParams): Promise<any> => {
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  return response?.data
}

// Reusing the payload update. We might just need partial update in the future, 
// but for now we use the standardized payload or just send what we have.
// However, the backend controller expects NotAsignaturaGradoRequest which might validate all fields.
// For the purpose of updating hours/blocks, we will ensure we fetch the item first, then update fields, then save.
const update = async (id: number, payload: Partial<NotAsignaturaGradoPayload>): Promise<any> => {
    // We only send the fields required by the updateScheduleConfig endpoint
    const cleanPayload = {
        horas_semanales: payload.horas_semanales,
        minutos: payload.minutos,
        bloque_continuo: payload.bloque_continuo,
        compartida: payload.compartida
    }
  const response = await httpClient.put<any>(`${BASE}/${id}`, cleanPayload)
  return response?.data
}

const scheduleSubjectService = {
  getPeriodosYGrados,
  list,
  update
}

export default scheduleSubjectService
