import { httpClient } from '@/utils/httpClient'
import type { FiltrosReporteStock, ProductoStockCorte } from '../types/reporteStock'

export const reporteStockService = {
  /**
   * Obtener reporte de stock por fecha de corte
   */
  async getReporte(filtros: FiltrosReporteStock): Promise<ProductoStockCorte[]> {
    const searchParams = new URLSearchParams()
    this.appendFiltros(searchParams, filtros)

    const url = `/bk/v1/productos/reporte/stock?${searchParams.toString()}`
    const response = await httpClient.get<any>(url)
    return response.data
  },

  /**
   * Exportar a PDF
   */
  async exportarPDF(filtros: FiltrosReporteStock, view: boolean = false): Promise<void> {
    const searchParams = new URLSearchParams()
    this.appendFiltros(searchParams, filtros)

    const url = `/bk/v1/productos/reporte/stock/pdf?${searchParams.toString()}`

    try {
      const response: any = await httpClient.get(url, { responseType: 'blob' })
      const blob = response.data
      const downloadUrl = window.URL.createObjectURL(blob)

      if (view) {
        window.open(downloadUrl, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 60000)
      } else {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.setAttribute('download', `reporte_stock_${filtros.fecha_corte}.pdf`)
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
  async exportarExcel(filtros: FiltrosReporteStock): Promise<void> {
    const searchParams = new URLSearchParams()
    this.appendFiltros(searchParams, filtros)

    const url = `/bk/v1/productos/reporte/stock/excel?${searchParams.toString()}`

    try {
      const response: any = await httpClient.get(url, { responseType: 'blob' })
      const blob = response.data
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `reporte_stock_${filtros.fecha_corte}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      throw error
    }
  },

  // Helper para añadir filtros
  appendFiltros(searchParams: URLSearchParams, filtros: FiltrosReporteStock) {
    if (filtros.fecha_corte) {
      searchParams.append('fecha_corte', filtros.fecha_corte)
    }

    if (filtros.categoria_id) {
      searchParams.append('categoria_id', filtros.categoria_id.toString())
    }

    if (filtros.solo_con_movimientos !== undefined) {
      searchParams.append('solo_con_movimientos', filtros.solo_con_movimientos.toString())
    }

    if (filtros.search) {
      searchParams.append('search', filtros.search)
    }
  }
}
