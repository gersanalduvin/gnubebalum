import { httpClient } from '@/utils/httpClient'
import type { AreaAsignatura, Asignatura, AsignaturasPaginatedData, CreateAsignaturaPayload } from '../types'

const BASE = '/bk/v1/not-materias'

const list = async (params: URLSearchParams): Promise<AsignaturasPaginatedData> => {
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  return response.data
}

const create = async (payload: CreateAsignaturaPayload): Promise<Asignatura> => {
  const response = await httpClient.post<Asignatura>(`${BASE}`, { ...payload, orden: 0 })
  return response.data as Asignatura
}

const update = async (id: number, payload: CreateAsignaturaPayload): Promise<Asignatura> => {
  const response = await httpClient.put<Asignatura>(`${BASE}/${id}`, { ...payload, orden: 0 })
  return response.data as Asignatura
}

const getById = async (id: number): Promise<Asignatura> => {
  const response = await httpClient.get<any>(`${BASE}/${id}`)
  return response.data as Asignatura
}

const remove = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`)
}

const exportPDF = (params: URLSearchParams) => {
  return httpClient.get(`${BASE}/export/pdf?${params.toString()}`, {
    headers: { Accept: 'application/pdf' }
  })
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

const listAreas = async (): Promise<AreaAsignatura[]> => {
  const response = await httpClient.get<any>(`${BASE}/areas`, { headers: { Accept: 'application/json' } })
  const payload = response?.data
  const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
  return (list as any[]).map(item => ({
    id: Number(item?.id ?? item?.value),
    nombre: String(item?.nombre ?? item?.label ?? '')
  })).filter(a => !!a.id && !!a.nombre)
}

const listOptions = async (): Promise<{ id: number; nombre: string; abreviatura?: string }[]> => {
  const params = new URLSearchParams({ per_page: '1000' })
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  const payload = response?.data
  const list = Array.isArray(payload?.data) ? payload.data : []
  return list.map((item: any) => ({ id: Number(item?.id), nombre: String(item?.nombre || ''), abreviatura: item?.abreviatura }))
}

const asignaturasService = {
  list,
  create,
  update,
  getById,
  remove,
  exportPDF,
  exportExcel,
  listAreas
  ,listOptions
}

export default asignaturasService
