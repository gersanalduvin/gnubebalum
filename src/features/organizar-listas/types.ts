export type PeriodoLectivo = { id: number; nombre: string }
export type Grado = { id: number; nombre: string }
export type Turno = { id: number; nombre: string }
export type Catalogos = { periodos_lectivos: PeriodoLectivo[]; grados: Grado[]; turnos: Turno[] }
export type AlumnoListItem = { user_id: number; nombre_completo: string; sexo: string; grupo_id?: number | null }
export type Grupo = { id: number; periodo_lectivo_id: number; grado: string; seccion: string; turno: string }