export type PeriodoLectivo = { id: number; nombre: string }
export type Turno = { id: number; nombre: string; orden?: number }
export type Grupo = { id: number; nombre: string }

export type CatalogosListasGrupo = {
  periodos_lectivos: PeriodoLectivo[]
  turnos: Turno[]
  grupos: Grupo[]
}

export type AlumnoGrupoItem = {
  user_id: number
  nombre_completo: string
  correo: string
  sexo: string
  grupo_id: number
  grupo_nombre: string
  total_pendiente: number
}
