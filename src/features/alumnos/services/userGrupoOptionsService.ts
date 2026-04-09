import { httpClient } from '@/utils/httpClient'
import type { ApiResponse } from '../types'

const API_BASE = '/bk/v1/users-grupos'

export interface PeriodoLectivo {
  id: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
}

export interface Grado {
  id: number
  nombre: string
  nivel: string
  orden: number
  activo: boolean
}

export interface Grupo {
  id: number
  nombre: string
  grado_id: number
  turno_id: number
  periodo_lectivo_id: number
  capacidad_maxima: number
  activo: boolean
  grado?: {
    id: number
    nombre: string
  }
  turno?: {
    id: number
    nombre: string
  }
}

export interface Turno {
  id: number
  nombre: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

export class UserGrupoOptionsService {
  /**
   * Obtener períodos lectivos para select
   */
  static async getPeriodosLectivos(): Promise<PeriodoLectivo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/periodos-lectivos/list`
      )
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener períodos lectivos:', error)
      return []
    }
  }

  /**
   * Obtener grados para select
   */
  static async getGrados(): Promise<Grado[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/grados/list`
      )
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener grados:', error)
      return []
    }
  }

  /**
   * Obtener grupos para select
   */
  static async getGrupos(filters?: {
    periodo?: number
    grado?: number
    turno?: number
  }): Promise<Grupo[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.periodo) params.append('periodo', filters.periodo.toString())
      if (filters?.grado) params.append('grado', filters.grado.toString())
      if (filters?.turno) params.append('turno', filters.turno.toString())

      const queryString = params.toString()
      const endpoint = queryString ? `${API_BASE}/grupos/list?${queryString}` : `${API_BASE}/grupos/list`

      const response = await httpClient.get<any>(endpoint)
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener grupos:', error)
      return []
    }
  }

  /**
   * Obtener grupos filtrados
   */
  static async getGruposFiltered(filters: {
    periodo?: number
    grado?: number
    turno?: number
  }): Promise<Grupo[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters.periodo) params.append('periodo', filters.periodo.toString())
      if (filters.grado) params.append('grado', filters.grado.toString())
      if (filters.turno) params.append('turno', filters.turno.toString())

      const queryString = params.toString()
      const endpoint = queryString ? `${API_BASE}/grupos/filtered?${queryString}` : `${API_BASE}/grupos/filtered`

      const response = await httpClient.get<any>(endpoint)
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener grupos filtrados:', error)
      return []
    }
  }

  /**
   * Obtener grupos por período lectivo
   */
  static async getGruposByPeriodo(periodoId: number): Promise<Grupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/grupos/by-periodo/${periodoId}`
      )
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener grupos por período:', error)
      return []
    }
  }

  /**
   * Obtener grupos por grado
   */
  static async getGruposByGrado(gradoId: number): Promise<Grupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/grupos/by-grado/${gradoId}`
      )
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener grupos por grado:', error)
      return []
    }
  }

  /**
   * Obtener grupos por turno
   */
  static async getGruposByTurno(turnoId: number): Promise<Grupo[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/grupos/by-turno/${turnoId}`
      )
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener grupos por turno:', error)
      return []
    }
  }

  /**
   * Obtener turnos para select
   */
  static async getTurnos(): Promise<Turno[]> {
    try {
      const response = await httpClient.get<any>(
        `${API_BASE}/turnos/list`
      )
      return response?.data || []
    } catch (error: any) {
      console.error('Error al obtener turnos:', error)
      return []
    }
  }
}
