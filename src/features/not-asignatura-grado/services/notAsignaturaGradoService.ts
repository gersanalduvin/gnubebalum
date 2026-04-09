import { httpClient } from '@/utils/httpClient'

const BASE = '/bk/v1/not-asignatura-grado'

export interface NotAsignaturaGradoPayload {
  id?: number
  periodo_lectivo_id?: number
  grado_id?: number
  materia_id: number
  escala_id: number
  nota_aprobar: number
  nota_maxima: number
  incluir_en_promedio: boolean
  incluir_en_reporte_mined: boolean
  tipo_evaluacion: string
  es_para_educacion_iniciativa: boolean
  cortes: Array<{
    id?: number
    corte_id: number
    evidencias: Array<{
      id?: number
      evidencia: string
      indicador: null | { criterio?: string;[key: string]: any }
    }>
  }>
  parametros: Array<{ id?: number; parametro: string; valor: string }>
  hijas: Array<{ asignatura_hija_id: number }>
  custom_field?: string 
  horas_semanales?: number
  minutos?: number
  bloque_continuo?: number
  compartida?: boolean
}

const getPeriodosYGrados = async (): Promise<{ periodos: any[]; grados: any[]; escalas: any[]; materias: any[] }> => {
  const response = await httpClient.get<any>(`${BASE}/periodos-y-grados`)
  const payload = response?.data || {}
  return {
    periodos: Array.isArray(payload.periodos) ? payload.periodos : [],
    grados: Array.isArray(payload.grados) ? payload.grados : [],
    escalas: Array.isArray(payload.escalas) ? payload.escalas : [],
    materias: Array.isArray(payload.materias) ? payload.materias : []
  }
}

const list = async (params: URLSearchParams): Promise<any> => {
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  return response?.data
}

const getAll = async (params: URLSearchParams): Promise<any[]> => {
  const response = await httpClient.get<any>(`${BASE}/getall?${params.toString()}`)
  const payload = response?.data
  const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
  return list || []
}

const getAlternativas = async (
  periodo_lectivo_id: number,
  grado_id: number,
  asignatura_grado_id?: number,
  options?: { signal?: AbortSignal }
): Promise<{ asignaturas: any[]; parciales: any[] }> => {
  const params = new URLSearchParams()
  params.set('periodo_lectivo_id', String(periodo_lectivo_id))
  params.set('grado_id', String(grado_id))
  if (asignatura_grado_id) params.set('asignatura_grado_id', String(asignatura_grado_id))
  const response = await httpClient.get<any>(`${BASE}/alternativas?${params.toString()}`, options)
  const payload = response?.data || {}
  return {
    asignaturas: Array.isArray(payload.asignaturas) ? payload.asignaturas : [],
    parciales: Array.isArray(payload.parciales) ? payload.parciales : []
  }
}

const upsert = async (payload: NotAsignaturaGradoPayload): Promise<any> => {
  const response = await httpClient.post<any>(`${BASE}`, payload)
  return response?.data
}

const getById = async (id: number): Promise<any> => {
  const response = await httpClient.get<any>(`${BASE}/${id}`)
  return response?.data
}

const remove = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`)
}

const removeCorte = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/corte/${id}`)
}

const exportPDF = async (params: URLSearchParams): Promise<Blob> => {
  const response = await httpClient.get<any>(`${BASE}/export/pdf?${params.toString()}`, {
    headers: { Accept: 'application/pdf' }
  })
  return response?.data as Blob
}

const exportExcel = async (params: URLSearchParams): Promise<Blob> => {
  const url = `${BASE}/export/excel?${params.toString()}`
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const resp = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  if (!resp.ok) {
    const text = await resp.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch { }
    throw { status: resp.status, statusText: resp.statusText, data }
  }
  return await resp.blob()
}

const reorder = async (orders: Array<{ id: number; orden: number }>): Promise<any> => {
  const response = await httpClient.put<any>(`${BASE}/bulk/reorder`, { orders })
  return response?.data
}

const notAsignaturaGradoService = {
  getPeriodosYGrados,
  list,
  getAll,
  upsert,
  getById,
  getAlternativas,
  remove,
  removeCorte,
  exportPDF,
  exportExcel,
  reorder
}

export default notAsignaturaGradoService
