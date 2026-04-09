import { httpClient } from '@/utils/httpClient'

export const getMyAssignments = async () => {
    // This endpoint needs to be verified/implemented in backend.
    // For now we assume a standard structure.
    const response = await httpClient.get<any>('/bk/v1/docente-portal/mis-asignaturas') 
    return response.data || []
}

export const getDashboardStats = async () => {
  const response = await httpClient.get<any>('/bk/v1/usuarios/docentes/dashboard-stats')
  return response.data || {}
}
