import { httpClient } from '@/utils/httpClient'
import type { PeriodoLectivo } from '@/features/reporte-matricula/types'

class ReporteNuevoIngresoService {
  private readonly baseUrl = '/bk/v1/reportes/nuevo-ingreso'

  async getPeriodosLectivos(): Promise<PeriodoLectivo[]> {
    const response = await httpClient.get<any>(
      `${this.baseUrl}/periodos-lectivos`
    )
    return response?.data || []
  }

  async exportPdf(periodoLectivoId: number): Promise<Blob> {
    const params = new URLSearchParams()
    params.set('periodo_lectivo_id', String(periodoLectivoId))

    const response = await httpClient.get<any>(
      `${this.baseUrl}/export?${params.toString()}`,
      { headers: { Accept: 'application/pdf' } }
    )

    return response.data
  }
}

export const reporteNuevoIngresoService = new ReporteNuevoIngresoService()
