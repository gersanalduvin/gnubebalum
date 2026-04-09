import { httpClient } from '@/utils/httpClient'
import type {
  ReporteMatriculaResponse,
  PeriodoLectivo,
  Modalidad
} from '../types'

class ReporteMatriculaService {
  private readonly baseUrl = '/bk/v1/reporte-matricula'

  /**
   * Obtiene todas las estadísticas de matrícula con filtros opcionales
   */
  async getEstadisticas(params: {
    periodoLectivoId: number
    fechaInicio?: string
    fechaFin?: string
    modalidadId?: number | 'Todos'
  }): Promise<ReporteMatriculaResponse> {
    const query = new URLSearchParams()
    query.set('periodo_lectivo_id', String(params.periodoLectivoId))
    if (params.fechaInicio) query.set('fecha_inicio', params.fechaInicio)
    if (params.fechaFin) query.set('fecha_fin', params.fechaFin)
    if (params.modalidadId !== undefined) query.set('modalidad_id', String(params.modalidadId))

    const response = await httpClient.get<any>(
      `${this.baseUrl}/estadisticas?${query.toString()}`
    )
    return response as ReporteMatriculaResponse
  }

  /**
   * Obtiene la lista de todos los períodos lectivos disponibles
   */
  async getPeriodosLectivos(): Promise<PeriodoLectivo[]> {
    const response = await httpClient.get<any>(
      `${this.baseUrl}/periodos-lectivos`
    )
    // El httpClient devuelve la respuesta completa, extraemos data
    return response?.data || []
  }

  /**
   * Obtiene las modalidades disponibles para filtrar reportes
   */
  async getModalidades(): Promise<Modalidad[]> {
    const response = await httpClient.get<any>(
      `${this.baseUrl}/modalidades`
    )
    return response?.data || []
  }

  /**
   * Genera un PDF con todas las estadísticas de matrícula aplicando filtros
   */
  async generarPdfEstadisticas(params: {
    periodoLectivoId: number
    fechaInicio?: string
    fechaFin?: string
    modalidadId?: number | 'Todos'
  }): Promise<Blob> {
    const response = await httpClient.post(
      `${this.baseUrl}/pdf/estadisticas`,
      {
        periodo_lectivo_id: params.periodoLectivoId,
        fecha_inicio: params.fechaInicio,
        fecha_fin: params.fechaFin,
        modalidad_id: params.modalidadId
      },
      { 'Accept': 'application/pdf' }
    )
    return response.data
  }
}

export const reporteMatriculaService = new ReporteMatriculaService()
