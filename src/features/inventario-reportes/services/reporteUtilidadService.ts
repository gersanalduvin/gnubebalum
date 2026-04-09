import { httpClient } from '@/utils/httpClient'
import type { FiltrosReporte, ReporteUtilidad } from '../types/reporteUtilidad'

export const reporteUtilidadService = {
  /**
   * Obtener reporte de utilidades
   */
  async getReporte(filtros: Partial<FiltrosReporte> = {}): Promise<ReporteUtilidad> {
    const searchParams = new URLSearchParams()

    if (filtros.tipo_filtro === 'mes' && filtros.year && filtros.month) {
      searchParams.append('year', filtros.year.toString())
      searchParams.append('month', filtros.month.toString())
    } else if (filtros.tipo_filtro === 'fecha' && filtros.fecha_corte) {
      searchParams.append('fecha_corte', filtros.fecha_corte)
    }

    if (filtros.categoria_id) {
      searchParams.append('categoria_id', filtros.categoria_id.toString())
    }

    if (filtros.moneda !== undefined) {
      searchParams.append('moneda', filtros.moneda.toString())
    }

    if (filtros.buscar) {
      searchParams.append('buscar', filtros.buscar)
    }

    const url = `/bk/v1/reportes/utilidad-inventario${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    const response = await httpClient.get<any>(url)
    return response.data
  },

  /**
   * Exportar a PDF
   */
  /**
   * Exportar a PDF
   * @param view Si es true, abre en nueva pestaña. Si es false, descarga.
   */
  async exportarPDF(filtros: Partial<FiltrosReporte> = {}, view: boolean = false): Promise<void> {
    const searchParams = new URLSearchParams()
    this.appendFiltros(searchParams, filtros)

    const url = `/bk/v1/reportes/utilidad-inventario/exportar-pdf${searchParams.toString() ? '?' + searchParams.toString() : ''}`

    try {
      const response: any = await httpClient.get(url, { responseType: 'blob' })
      const blob = response.data
      const downloadUrl = window.URL.createObjectURL(blob)

      if (view) {
        // Abrir en nueva pestaña
        window.open(downloadUrl, '_blank')

        // Limpiar memoria después de un tiempo
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 60000)
      } else {
        // Descargar
        const link = document.createElement('a')
        link.href = downloadUrl
        link.setAttribute('download', `reporte_utilidad_${new Date().toISOString().split('T')[0]}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      throw error
    }
  },

  /**
   * Exportar a Excel
   */
  async exportarExcel(filtros: Partial<FiltrosReporte> = {}): Promise<void> {
    const searchParams = new URLSearchParams()
    this.appendFiltros(searchParams, filtros)

    const url = `/bk/v1/reportes/utilidad-inventario/exportar-excel${searchParams.toString() ? '?' + searchParams.toString() : ''}`

    const response: any = await httpClient.get(url, { responseType: 'blob' })
    const blob = response.data
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', `reporte_utilidad_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },

  // Helper para añadir filtros
  appendFiltros(searchParams: URLSearchParams, filtros: Partial<FiltrosReporte>) {
    if (filtros.tipo_filtro === 'mes' && filtros.year && filtros.month) {
      searchParams.append('year', filtros.year.toString())
      searchParams.append('month', filtros.month.toString())
    } else if (filtros.tipo_filtro === 'fecha' && filtros.fecha_corte) {
      searchParams.append('fecha_corte', filtros.fecha_corte)
    }

    if (filtros.categoria_id) {
      searchParams.append('categoria_id', filtros.categoria_id.toString())
    }

    if (filtros.moneda !== undefined) {
      searchParams.append('moneda', filtros.moneda.toString())
    }

    if (filtros.buscar) {
      searchParams.append('buscar', filtros.buscar)
    }
  }
}
