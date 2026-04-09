import { httpClient } from '@/utils/httpClient'

export interface BoletinParams {
  grupo_id: number
  periodo_lectivo_id: number
  corte_id?: string | number | null
  mostrar_escala?: boolean
}

class BoletinEscolarService {
  private readonly baseUrl = '/bk/v1/boletin-escolar'

  /** Get all active academic periods */
  async getPeriodos() {
    const response = await httpClient.get<any>(`${this.baseUrl}/periodos`)
    return response as any
  }

  /** Get groups for a specific period */
  async getGrupos(periodo_lectivo_id: number) {
    const response = await httpClient.get<any>(`${this.baseUrl}/grupos?periodo_lectivo_id=${periodo_lectivo_id}`)
    return response as any
  }

  /** Get evaluation cuts for a specific period */
  async getCortes(periodo_lectivo_id: number) {
    const response = await httpClient.get<any>(`${this.baseUrl}/cortes?periodo_lectivo_id=${periodo_lectivo_id}`)
    return response as any
  }

  /** Generate individual student report card PDF */
  async generarBoletinPDF(params: BoletinParams) {
    try {
      const response = await httpClient.post<Blob>(`${this.baseUrl}/generar`, params, { responseType: 'blob' })

      const blob = (response as any).data || response
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error generating boletín PDF:', error)
      throw error
    }
  }

  /** Generate consolidated grades PDF */
  async generarConsolidadoPDF(params: BoletinParams) {
    try {
      const response = await httpClient.post<Blob>(`${this.baseUrl}/consolidado`, params, { responseType: 'blob' })

      const blob = (response as any).data || response
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error generating consolidado PDF:', error)
      throw error
    }
  }

  /** Export consolidated grades to Excel */
  async exportConsolidadoExcel(params: BoletinParams) {
    try {
      const response = await httpClient.post<Blob>(`${this.baseUrl}/consolidado/excel`, params, {
        responseType: 'blob'
      })

      const blob = (response as any).data || response
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `consolidado_notas_${new Date().toISOString()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting consolidado Excel:', error)
      throw error
    }
  }
}

export const boletinEscolarService = new BoletinEscolarService()
