import { httpClient } from '@/utils/httpClient'

export interface ChildData {
  id: number
  codigo_unico: string
  nombre_completo: string
  foto_url: string
  grado: string
  seccion: string
  turno: string
  grupo_id: number | null
  docente_guia_nombre?: string
}

export interface AcademicLoad {
  grupo: {
    id: number
    nombre: string
    periodo: string
  }
  asignaturas: {
    id: number
    nombre: string
    area: string
  }[]
}

export interface Teacher {
  id: number
  primer_nombre: string
  primer_apellido: string
}

export interface ScheduleBlock {
  id: number
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  materia: string
  docente: string
  aula: string
}

export interface DashboardData {
  estudiantes: {
    id: number
    codigo_unico: string
    nombre_completo: string
    foto_url: string
    grado: string
    seccion: string
    asistencia_porcentaje: string
    promedio_actual: string
    docente_guia_nombre?: string
  }[]
  resumen: {
    avisos_pendientes: number
    eventos_hoy: number
    total_pagos_vencidos: number
  }
  actividad: {
    id: string
    tipo: 'aviso' | 'evento'
    titulo: string
    fecha: string
    descripcion: string
  }[]
}

export class ParentAccessService {
  private static BASE_URL = '/bk/v1/familias'

  static async getChildren(): Promise<ChildData[]> {
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getAcademicLoad(studentId: number): Promise<AcademicLoad> {
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/carga-academica`)
    return res?.data || res
  }

  static async getGrades(studentId: number): Promise<any[]> {
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/notas`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getAttendance(studentId: number): Promise<any> {
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/asistencia`)
    return res?.data || res
  }

  static async getSchedule(studentId: number): Promise<ScheduleBlock[]> {
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/horario`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getBilling(studentId: number, params?: any): Promise<any> {
    const query = new URLSearchParams(params).toString()
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/recibos?${query}`)
    return res?.data || res
  }

  static async getFees(studentId: number): Promise<any[]> {
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/aranceles`)
    return res?.data || (Array.isArray(res) ? res : [])
  }

  static async getMessages(studentId: number, params?: any): Promise<any> {
    const query = new URLSearchParams(params).toString()
    const res: any = await httpClient.get(`${this.BASE_URL}/hijos/${studentId}/mensajes?${query}`)
    return res?.data || res
  }

  static async getDashboard(): Promise<DashboardData> {
    const res: any = await httpClient.get(`${this.BASE_URL}/dashboard`)
    return res?.data || res
  }
}
