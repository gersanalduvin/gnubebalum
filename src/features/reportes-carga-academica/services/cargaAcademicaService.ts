import { httpClient } from '@/utils/httpClient'

interface CargaAcademicaFilters {
  periodo_lectivo_id?: number
  materia_id?: number
  grado_id?: number
  grupo_id?: number
}

interface CargaAcademicaData {
    id: number
    asignatura: string
    docente: string
    grado: string
    grupo: string
    periodo: string
}

const getCargaAcademica = async (filters: CargaAcademicaFilters): Promise<CargaAcademicaData[]> => {
    const params = new URLSearchParams()
    if (filters.periodo_lectivo_id) params.append('periodo_lectivo_id', String(filters.periodo_lectivo_id))
    if (filters.materia_id) params.append('materia_id', String(filters.materia_id))
    if (filters.grado_id) params.append('grado_id', String(filters.grado_id))
    if (filters.grupo_id) params.append('grupo_id', String(filters.grupo_id))

    const response = await httpClient.get<any>(`/bk/v1/reportes/carga-academica?${params.toString()}`)
    return response.data
}

const getFiltros = async (periodoLectivoId: number): Promise<any> => {
    const response = await httpClient.get<any>(`/bk/v1/reportes/carga-academica/filtros?periodo_lectivo_id=${periodoLectivoId}`)
    return response.data
}

const exportPdf = async (filters: CargaAcademicaFilters) => {
    const params = new URLSearchParams()
    if (filters.periodo_lectivo_id) params.append('periodo_lectivo_id', String(filters.periodo_lectivo_id))
    if (filters.materia_id) params.append('materia_id', String(filters.materia_id))
    if (filters.grado_id) params.append('grado_id', String(filters.grado_id))
    if (filters.grupo_id) params.append('grupo_id', String(filters.grupo_id))

    const url = `${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}/bk/v1/reportes/carga-academica/pdf?${params.toString()}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    // For PDF export we usually use a window.open or a custom fetch if authentication is needed via headers
    // Since it's a GET request and SnappyPdf returns a download/stream, we can use fetch with token or a temporary link
    
    const resp = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    
    if (resp.ok) {
        const blob = await resp.blob()
        const fileURL = URL.createObjectURL(blob)
        window.open(fileURL)
    } else {
        throw new Error('Error al generar PDF')
    }
}

export const cargaAcademicaService = {
    getCargaAcademica,
    getFiltros,
    exportPdf
}
