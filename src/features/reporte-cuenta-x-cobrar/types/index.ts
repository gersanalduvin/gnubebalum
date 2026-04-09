export type PeriodoLectivo = { id: number; nombre: string }
export type Turno = { id: number; nombre: string; orden?: number }
export type Grado = { id: number; nombre: string; abreviatura?: string }
export type Seccion = { id: number; nombre: string; abreviatura?: string }
export type Grupo = {
  id: number
  nombre?: string
  grado_id?: number
  seccion_id?: number
  turno_id?: number
  periodo_lectivo_id?: number
  grado?: Grado
  seccion?: Seccion
}

export type CatalogosCuentaXCobrar = {
  periodos_lectivos: PeriodoLectivo[]
  turnos: Turno[]
}

export type UsuarioArancelRow = {
  alumno: string
  mat?: string
  ene?: string
  feb?: string
  mar?: string
  abr?: string
  may?: string
  jun?: string
  jul?: string
  ago?: string
  sep?: string
  oct?: string
  nov?: string
  dic?: string
  total: string
}

export type UsuariosArancelesResponse = {
  success: boolean
  data: {
    rows: UsuarioArancelRow[]
    totales_por_mes: Record<string, string>
    total_general: string
  }
  message: string
}
