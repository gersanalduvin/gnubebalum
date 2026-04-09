import { httpClient } from '@/utils/httpClient'

interface GenerateReporteParams {
  periodo_lectivo_id: number
  grupo_id: number
  corte_id: number
}

interface ActividadSemana {
  actividad: string
  fecha_creacion: string
  tipo: string
}

interface LineaAsignatura {
  asignatura: string
  docente: string
  totales_por_semana: Record<string, number>
  actividades_por_semana: Record<string, ActividadSemana[]>
  total_general: number
}

interface SemanaDefinicion {
  key: string
  rango: string
}

export interface ReporteActividadesData {
  semanas: SemanaDefinicion[]
  lineas: LineaAsignatura[]
}

class ReporteActividadesService {
  async generarReporte(params: GenerateReporteParams) {
    const paramsFiltered = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    )

    const queryParams = new URLSearchParams(paramsFiltered as unknown as Record<string, string>).toString()
    const endpoint = `/bk/v1/reportes/actividades-semana?${queryParams}`

    const response = await httpClient.get<any>(endpoint)
    return response
  }

  async generarPDF(params: GenerateReporteParams) {
    try {
      const paramsFiltered = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      )

      const queryParams = new URLSearchParams(paramsFiltered as unknown as Record<string, string>).toString()
      const endpoint = `/bk/v1/reportes/actividades-semana/generar-pdf?${queryParams}`

      const response = await httpClient.get<Blob>(endpoint, { responseType: 'blob' })

      const blob = (response as any).data || response
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error generatingividades PDF:', error)
      throw error
    }
  }
}

export const reporteActividadesService = new ReporteActividadesService()
