export interface AcademicoPermisoAsignacion {
  id: number
  asignatura_grado: {
    materia: { nombre: string }
    asignatura: { nombre: string }
  }
  docente: {
    nombre: string
    apellido: string
    nombre_completo: string
  }
  permiso_fecha_corte1: string | null
  permiso_fecha_corte2: string | null
  permiso_fecha_corte3: string | null
  permiso_fecha_corte4: string | null
}

export interface AcademicoPermisosResponse {
  data: AcademicoPermisoAsignacion[]
}

export interface PermisoMasivoUpdate {
  asignaciones: Partial<AcademicoPermisoAsignacion>[]
}
