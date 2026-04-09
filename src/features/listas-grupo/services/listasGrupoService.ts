import { httpClient } from '@/utils/httpClient';
import type { AlumnoGrupoItem, CatalogosListasGrupo } from '../types';

class ListasGrupoService {
  private readonly baseUrl = '/bk/v1/listas-grupo'

  async getCatalogos(params: { periodo_lectivo_id?: number; turno_id?: number } = {}): Promise<CatalogosListasGrupo> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/catalogos?${query.toString()}`)
    return response?.data || { periodos_lectivos: [], turnos: [], grupos: [] }
  }

  async getAlumnos(params: { periodo_lectivo_id?: number; grupo_id?: number; turno_id?: number }): Promise<AlumnoGrupoItem[]> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grupo_id) query.set('grupo_id', String(params.grupo_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/alumnos?${query.toString()}`)
    return response?.data || []
  }

  async exportPdf(params: { periodo_lectivo_id?: number; grupo_id?: number; turno_id?: number }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grupo_id) query.set('grupo_id', String(params.grupo_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/alumnos/pdf?${query.toString()}`, { headers: { Accept: 'application/pdf' } })
    return response.data
  }

  async exportExcel(params: { periodo_lectivo_id?: number; grupo_id?: number; turno_id?: number }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.periodo_lectivo_id) query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.grupo_id) query.set('grupo_id', String(params.grupo_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    const url = `${this.baseUrl}/alumnos/excel?${query.toString()}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const resp = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
    if (!resp.ok) throw new Error('Error al exportar Excel')
    return await resp.blob()
  }
}

export const listasGrupoService = new ListasGrupoService()

