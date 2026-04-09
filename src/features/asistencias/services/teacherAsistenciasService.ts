import { httpClient } from '@/utils/httpClient'
import type {
  AsistenciaEstado,
  ExcepcionInput,
  ExcepcionRegistro,
  GrupoResumenPorTurno,
  PeriodoLectivo,
  ReporteGeneralPorGradoRespuesta,
  ReporteGeneralPorGrupoRespuesta,
  ReporteGeneralRespuesta,
  ReportePorCorteRespuesta,
  UsuarioGrupo
} from '../types'

const BASE_URL = '/bk/v1/docente-portal/asistencias'

interface TeacherGroup {
  id: number
  grado: string
  seccion: string
  turno: string
  periodo: string
  periodo_lectivo_id: number
}

export const getMyActiveGroups = async (): Promise<TeacherGroup[]> => {
  const resp = await httpClient.get<any>('/bk/v1/docente-portal/my-active-groups')
  return resp.data || []
}

export const getPeriodosLectivos = async (): Promise<PeriodoLectivo[]> => {
  const resp = await httpClient.get<any>(`${BASE_URL}/periodos-lectivos`)
  return resp.data || []
}

export const getGruposPorTurno = async (periodoId: number): Promise<GrupoResumenPorTurno> => {
  const resp = await httpClient.get<any>(`${BASE_URL}/grupos-por-turno?periodo_id=${periodoId}`)
  return resp.data || {}
}

export const getUsuariosGrupo = async (grupoId: number): Promise<UsuarioGrupo[]> => {
  const resp = await httpClient.get<any>(`${BASE_URL}/grupos/${grupoId}/usuarios`)
  return resp.data || []
}

export const getExcepciones = async (
  grupoId: number,
  fecha: string,
  corte: AsistenciaEstado['corte']
): Promise<ExcepcionRegistro[]> => {
  const resp = await httpClient.get<any>(`${BASE_URL}/grupo/${grupoId}/fecha/${fecha}/corte/${corte}`)
  return resp.data || []
}

export const registrarGrupo = async (payload: {
  grupo_id: number
  fecha: string
  corte: AsistenciaEstado['corte']
  excepciones: ExcepcionInput[]
}): Promise<{ created: ExcepcionRegistro[] }> => {
  const resp = await httpClient.post<any>(`${BASE_URL}/registrar-grupo`, payload)
  return { created: resp.data || [] }
}

export const updateAsistencia = async (
  id: number,
  payload: Partial<Pick<ExcepcionInput, 'estado' | 'justificacion' | 'hora_registro'>>
): Promise<ExcepcionRegistro> => {
  const resp = await httpClient.put<any>(`${BASE_URL}/${id}`, payload)
  return resp.data
}

export const deleteAsistencia = async (id: number): Promise<boolean> => {
  await httpClient.delete(`${BASE_URL}/${id}`)
  return true
}

export const getFechasRegistradas = async (grupoId: number, corte: AsistenciaEstado['corte']): Promise<string[]> => {
  const resp = await httpClient.get<any>(`${BASE_URL}/fechas-registradas/${grupoId}/${corte}`)
  return resp.data || []
}

export const getReportePorCorte = async (
  grupoId: number,
  corte: AsistenciaEstado['corte'],
  params?: { fecha_inicio?: string; fecha_fin?: string }
): Promise<ReportePorCorteRespuesta> => {
  const qs = new URLSearchParams()
  if (params?.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
  if (params?.fecha_fin) qs.set('fecha_fin', params.fecha_fin)
  const url = `${BASE_URL}/reporte/${grupoId}/corte/${corte}${qs.toString() ? `?${qs.toString()}` : ''}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const getReporteGeneral = async (
  grupoId: number,
  params?: { fecha_inicio?: string; fecha_fin?: string }
): Promise<ReporteGeneralRespuesta> => {
  const qs = new URLSearchParams()
  if (params?.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
  if (params?.fecha_fin) qs.set('fecha_fin', params.fecha_fin)
  const url = `${BASE_URL}/reporte-general/${grupoId}${qs.toString() ? `?${qs.toString()}` : ''}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const exportReportePorCorte = async (
  grupoId: number,
  corte: AsistenciaEstado['corte'],
  params: { fecha_inicio?: string; fecha_fin?: string; format: 'pdf' | 'xlsx' }
): Promise<Blob> => {
  const qs = new URLSearchParams()
  if (params.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
  if (params.fecha_fin) qs.set('fecha_fin', params.fecha_fin)
  qs.set('format', params.format)
  const resp = await httpClient.get<any>(`${BASE_URL}/reporte/${grupoId}/corte/${corte}/export?${qs.toString()}`)
  const payload = resp.data || {}
  const content = payload.content as string
  const mime =
    params.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
  if (!content) throw { status: 422, statusText: 'Unprocessable Entity', data: payload }
  const dataUrl = `data:${mime};base64,${content}`
  const r = await fetch(dataUrl)
  const blob = await r.blob()
  return blob
}

export const exportReporteGeneral = async (
  grupoId: number,
  params: { fecha_inicio?: string; fecha_fin?: string; format: 'pdf' | 'xlsx' }
): Promise<Blob> => {
  const qs = new URLSearchParams()
  if (params.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
  if (params.fecha_fin) qs.set('fecha_fin', params.fecha_fin)
  qs.set('format', params.format)
  const resp = await httpClient.get<any>(`${BASE_URL}/reporte-general/${grupoId}/export?${qs.toString()}`)
  const payload = resp.data || {}
  const content = payload.content as string
  const mime =
    params.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
  if (!content) throw { status: 422, statusText: 'Unprocessable Entity', data: payload }
  const dataUrl = `data:${mime};base64,${content}`
  const r = await fetch(dataUrl)
  const blob = await r.blob()
  return blob
}

export const getReporteGeneralPorGrupo = async (periodoLectivoId: number): Promise<ReporteGeneralPorGrupoRespuesta> => {
  const url = `${BASE_URL}/reporte-general-por-grupo?periodo_lectivo_id=${periodoLectivoId}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const exportReporteGeneralPorGrupo = async (
  periodoLectivoId: number,
  params: { format: 'pdf' | 'xlsx' }
): Promise<Blob> => {
  const qs = new URLSearchParams()
  qs.set('format', params.format)
  qs.set('periodo_lectivo_id', String(periodoLectivoId))
  const resp = await httpClient.get<any>(`${BASE_URL}/reporte-general-por-grupo/export?${qs.toString()}`)
  const payload = resp.data || {}
  const content = payload.content as string
  const mime =
    params.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
  if (!content) throw { status: 422, statusText: 'Unprocessable Entity', data: payload }
  const dataUrl = `data:${mime};base64,${content}`
  const r = await fetch(dataUrl)
  const blob = await r.blob()
  return blob
}

export const getReporteGeneralPorGrado = async (periodoLectivoId: number): Promise<ReporteGeneralPorGradoRespuesta> => {
  const url = `${BASE_URL}/reporte-general-por-grado?periodo_lectivo_id=${periodoLectivoId}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const exportReporteGeneralPorGrado = async (
  periodoLectivoId: number,
  params: { format: 'pdf' | 'xlsx' }
): Promise<Blob> => {
  const qs = new URLSearchParams()
  qs.set('format', params.format)
  qs.set('periodo_lectivo_id', String(periodoLectivoId))
  const resp = await httpClient.get<any>(`${BASE_URL}/reporte-general-por-grado/export?${qs.toString()}`)
  const payload = resp.data || {}
  const content = payload.content as string
  const mime =
    params.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
  if (!content) throw { status: 422, statusText: 'Unprocessable Entity', data: payload }
  const dataUrl = `data:${mime};base64,${content}`
  const r = await fetch(dataUrl)
  const blob = await r.blob()
  return blob
}
export const getReporteSemanalPorGrupoYAlumno = async (
  grupoId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<any> => {
  const url = `${BASE_URL}/reportes/grupo-alumno-semanal?grupo_id=${grupoId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const exportReporteSemanalPorGrupoYAlumno = async (
  grupoId: number,
  fechaInicio: string,
  fechaFin: string,
  format: 'pdf' | 'xlsx'
): Promise<Blob> => {
  const url = `${BASE_URL}/reportes/grupo-alumno-semanal?grupo_id=${grupoId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&export=${format}`
  const resp = await httpClient.get<any>(url)
  const content = resp.data?.content
  if (!content) throw { status: 422, statusText: 'Unprocessable Entity', data: resp.data }
  const mime =
    format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
  const dataUrl = `data:${mime};base64,${content}`
  const r = await fetch(dataUrl)
  return await r.blob()
}

export const getReporteInasistenciasGrupo = async (
  grupoId: number,
  fechaInicio: string,
  fechaFin: string,
  periodoLectivoId?: number
): Promise<any> => {
  const qs = new URLSearchParams()
  qs.set('grupo_id', String(grupoId))
  qs.set('fecha_inicio', fechaInicio)
  qs.set('fecha_fin', fechaFin)
  if (periodoLectivoId) qs.set('periodo_lectivo_id', String(periodoLectivoId))

  const url = `${BASE_URL}/reportes/inasistencias-grupo?${qs.toString()}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const exportReporteInasistenciasGrupo = async (
  grupoId: number,
  fechaInicio: string,
  fechaFin: string,
  periodoLectivoId: number | undefined,
  format: 'pdf' | 'xlsx'
): Promise<Blob> => {
  const qs = new URLSearchParams()
  qs.set('grupo_id', String(grupoId))
  qs.set('fecha_inicio', fechaInicio)
  qs.set('fecha_fin', fechaFin)
  qs.set('export', format)
  if (periodoLectivoId) qs.set('periodo_lectivo_id', String(periodoLectivoId))

  const url = `${BASE_URL}/reportes/inasistencias-grupo?${qs.toString()}`
  const resp = await httpClient.get<any>(url)
  const content = resp.data?.content
  if (!content) throw { status: 422, statusText: 'Unprocessable Entity', data: resp.data }
  const mime =
    format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
  const dataUrl = `data:${mime};base64,${content}`
  const r = await fetch(dataUrl)
  return await r.blob()
}

export const getReporteSemanalPorGrupo = async (fechaInicio: string, fechaFin: string): Promise<any> => {
  const url = `${BASE_URL}/reportes/grupo-semanal?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}

export const getReporteGlobalRango = async (
  periodoLectivoId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<any> => {
  const url = `${BASE_URL}/reportes/global-rango?periodo_lectivo_id=${periodoLectivoId}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
  const resp = await httpClient.get<any>(url)
  return resp.data
}
