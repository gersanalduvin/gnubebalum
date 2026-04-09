import { httpClient } from '@/utils/httpClient'

const API_BASE = '/bk/v1/reportes/alumnos-retirados'

export const ReporteRetiradosService = {
  // Get JSON data for preview
  getReporte: async (periodoId: number) => {
    // Response wrapper might need handling. Usually httpClient returns { data: ... }
    const response = await httpClient.get<any>(`${API_BASE}?periodo_lectivo_id=${periodoId}`)
    // backend returns { status: 'success', data: { periodo: ..., alumnos: [...] }, message: ... }
    return response.data
  },

  // Download PDF
  downloadPdf: async (periodoId: number) => {
    const token = localStorage.getItem('token') || ''
    const url = `${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${API_BASE}/pdf?periodo_lectivo_id=${periodoId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    })

    if (!response.ok) {
      throw new Error('Error al descargar el PDF')
    }

    return await response.blob()
  },

  // Download Excel
  downloadExcel: async (periodoId: number) => {
    const token = localStorage.getItem('token') || ''
    const url = `${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${API_BASE}/excel?periodo_lectivo_id=${periodoId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })

    if (!response.ok) {
      throw new Error('Error al descargar el Excel')
    }

    return await response.blob()
  }
}

export default ReporteRetiradosService
