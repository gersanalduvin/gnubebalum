import { httpClient } from '@/utils/httpClient'
import type { Catalogos, AlumnoListItem, Grupo } from '../types'

class OrganizarListasService {
  private readonly baseUrl = '/bk/v1/organizar'

  async getCatalogos(): Promise<Catalogos> {
    const response = await httpClient.get<any>(`${this.baseUrl}/catalogos`)
    return response?.data || { periodos_lectivos: [], grados: [], turnos: [] }
  }

  async getAlumnos(params: { periodo_lectivo_id?: number; grado_id?: number; turno_id?: number }): Promise<AlumnoListItem[]> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grado_id) query.set('grado_id', String(params.grado_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/alumnos?${query.toString()}`)
    return response?.data || []
  }

  async getGrupos(params: { periodo_lectivo_id?: number; grado_id?: number; turno_id?: number }): Promise<Grupo[]> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grado_id) query.set('grado_id', String(params.grado_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/grupos?${query.toString()}`)
    return response?.data || []
  }

  async asignarGrupos(asignaciones: Array<{ user_id: number; grupo_id: number }>): Promise<{ success: boolean; message?: string }> {
    const response = await httpClient.post(`${this.baseUrl}/asignar-grupo`, { asignaciones })
    return { success: !!response?.data || response?.message === 'Operación exitosa', message: response?.message }
  }

  async exportAlumnosPdf(params: { periodo_lectivo_id?: number; grado_id?: number; turno_id?: number }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grado_id) query.set('grado_id', String(params.grado_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/alumnos/pdf?${query.toString()}`, { headers: { Accept: 'application/pdf' } })
    return response.data
  }

  async exportAlumnosCsv(params: { periodo_lectivo_id?: number; grado_id?: number; turno_id?: number }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grado_id) query.set('grado_id', String(params.grado_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const url = `${this.baseUrl}/alumnos/excel?${query.toString()}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const resp = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'text/csv'
      }
    })
    if (!resp.ok) throw new Error('Error al exportar CSV')
    return await resp.blob()
  }
}

export const organizarListasService = new OrganizarListasService()
