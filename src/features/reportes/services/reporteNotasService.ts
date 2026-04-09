import { httpClient } from '@/utils/httpClient'

export interface ReporteNotasParams {
  grupo_id: number
  asignatura_id: number
  corte_id: number
}

class ReporteNotasService {
  private readonly baseUrl = '/bk/v1/reportes/notas-asignatura'

  async getReporte(params: ReporteNotasParams) {
    const { grupo_id, asignatura_id, corte_id } = params
    const response = await httpClient.get<any>(`${this.baseUrl}/grupo/${grupo_id}/asignatura/${asignatura_id}/corte/${corte_id}`)
    return response as any
  }

  async downloadExcel(params: ReporteNotasParams) {
    const { grupo_id, asignatura_id, corte_id } = params
    try {
      const response = await httpClient.get<Blob>(
        `${this.baseUrl}/grupo/${grupo_id}/asignatura/${asignatura_id}/corte/${corte_id}/export/excel`, 
        { responseType: 'blob' }
      )
      
      // Create download link
      const blob = (response as any).data || response
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `notas_asignatura_${new Date().toISOString()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading excel:', error)
      throw error
    }
  }

  async downloadPdf(params: ReporteNotasParams) {
    const { grupo_id, asignatura_id, corte_id } = params
    try {
      const response = await httpClient.get<Blob>(
        `${this.baseUrl}/grupo/${grupo_id}/asignatura/${asignatura_id}/corte/${corte_id}/export/pdf`, 
        { responseType: 'blob' }
      )
      
      // Create download link matching backend filename if possible, or default
      const blob = (response as any).data || response
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error downloading pdf:', error)
      throw error
    }
  }
  async getAlternativas(periodo_lectivo_id: number, grado_id: number, grupo_id?: number) {
    const params = new URLSearchParams()
    params.set('periodo_lectivo_id', String(periodo_lectivo_id))
    params.set('grado_id', String(grado_id))
    if (grupo_id) params.set('grupo_id', String(grupo_id))

    const response = await httpClient.get<any>(`${this.baseUrl}/alternativas?${params.toString()}`)
    const payload = response?.data || {}
    return {
      asignaturas: Array.isArray(payload.asignaturas) ? payload.asignaturas : [],
      parciales: Array.isArray(payload.parciales) ? payload.parciales : []
    }
  }
}

export const reporteNotasService = new ReporteNotasService()
