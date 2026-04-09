import { httpClient } from '@/utils/httpClient'
import type { CatalogosCuentaXCobrar, Grupo, UsuariosArancelesResponse } from '../types'

class ReporteCuentaXCobrarService {
  private readonly baseUrl = '/bk/v1/reportes/cuenta-x-cobrar'

  async getCatalogos(): Promise<CatalogosCuentaXCobrar> {
    const response = await httpClient.get<any>(`${this.baseUrl}/periodos-turnos`)
    return response?.data || { periodos_lectivos: [], turnos: [] }
  }

  async getGrupos(params: { periodo_lectivo_id: number; turno_id: number }): Promise<Grupo[]> {
    const query = new URLSearchParams()
    query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    query.set('turno_id', String(params.turno_id))
    const response = await httpClient.get<any>(`${this.baseUrl}/grupos?${query.toString()}`)
    return response?.data || []
  }

  async getUsuariosAranceles(params: { periodo_lectivo_id: number; turno_id?: number; grupo_id?: number | 'Todos'; meses?: string[]; solo_pendientes?: boolean }): Promise<UsuariosArancelesResponse> {
    const query = new URLSearchParams()
    query.set('periodo_lectivo_id', String(params.periodo_lectivo_id))
    if (params.turno_id) query.set('turno_id', String(params.turno_id))
    if (params.grupo_id !== undefined) query.set('grupo_id', String(params.grupo_id))
    if (params.meses && params.meses.length) {
      params.meses.forEach(m => query.append('meses[]', m))
    }
    if (params.solo_pendientes) query.set('solo_pendientes', 'true')
    const response = await httpClient.get<any>(`${this.baseUrl}/usuarios-aranceles?${query.toString()}`)
    return response as UsuariosArancelesResponse
  }

  async exportPdf(body: { periodo_lectivo_id: number; turno_id?: number; grupo_id?: number | 'Todos'; meses?: string[]; solo_pendientes?: boolean }): Promise<Blob> {
    const response = await httpClient.post<any>(`${this.baseUrl}/export/pdf`, body, { Accept: 'application/pdf' })
    return response.data as unknown as Blob
  }

  async exportExcel(body: { periodo_lectivo_id: number; turno_id?: number; grupo_id?: number | 'Todos'; meses?: string[]; solo_pendientes?: boolean }): Promise<Blob> {
    const response = await httpClient.post<any>(`${this.baseUrl}/export/excel`, body, { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', responseType: 'blob' })
    return response.data as unknown as Blob
  }
}

export const reporteCuentaXCobrarService = new ReporteCuentaXCobrarService()

