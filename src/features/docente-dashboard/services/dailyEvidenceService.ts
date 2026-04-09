import { httpClient } from '@/utils/httpClient'

export const getDailyEvidences = async (assignmentId: number, corteId: number) => {
  const response = await httpClient.get<any[]>(`/bk/v1/evidencias-diarias/asignacion/${assignmentId}/corte/${corteId}`)
  return response || []
}

export const createDailyEvidence = async (payload: any) => {
  const response = await httpClient.post<any>('/bk/v1/evidencias-diarias', payload)
  return response
}

export const updateDailyEvidence = async (id: number, payload: any) => {
  const response = await httpClient.post<any>(`/bk/v1/evidencias-diarias/${id}?_method=PUT`, payload)
  return response
}

export const deleteDailyEvidence = async (id: number) => {
  const response = await httpClient.delete<any>(`/bk/v1/evidencias-diarias/${id}`)
  return response
}

export const getDailyGrades = async (evidenceId: number) => {
  const response = await httpClient.get<any[]>(`/bk/v1/evidencias-diarias/${evidenceId}/calificaciones`)
  return response || []
}

export const saveDailyGrades = async (evidenceId: number, grades: any[]) => {
  const response = await httpClient.post<any>(`/bk/v1/evidencias-diarias/${evidenceId}/calificaciones`, { grades })
  return response
}
