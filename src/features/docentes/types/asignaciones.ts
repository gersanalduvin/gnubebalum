
export interface NotAsignaturaGradoDocente {
  id: number
  user_id: number
  asignatura_grado_id: number
  grupo_id: number
  permiso_fecha_corte1: string | null
  permiso_fecha_corte2: string | null
  permiso_fecha_corte3: string | null
  permiso_fecha_corte4: string | null
  created_at: string
  updated_at: string
  asignatura_grado?: {
    id: number
    asignatura?: { nombre: string }
    materia?: { nombre: string }
    grado: { nombre: string }
  }
  grupo?: {
    id: number
    grado: { nombre: string }
    seccion: { nombre: string }
    turno: { nombre: string }
  }
}

export interface AsignaturaGradoOption {
  id: number
  asignatura: { nombre: string }
  grado: { nombre: string }
}

export interface GrupoOption {
  id: number
  nombre_completo: string
}
