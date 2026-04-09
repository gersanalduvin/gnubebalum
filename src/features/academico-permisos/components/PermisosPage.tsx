'use client'

import SaveIcon from '@mui/icons-material/Save'
import { Autocomplete, Button, Card, CardContent, CardHeader, CircularProgress, Grid, TextField } from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Services
// Services
// Services
import { academicoPermisosService } from '@/features/academico-permisos/services/academicoPermisosService'
import groupsService from '@/features/config-grupos/services/gruposService'
import periodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'

// Types
import { AcademicoPermisoAsignacion } from '@/features/academico-permisos/types'
import { ConfigGrupos } from '@/features/config-grupos/types'
import { ConfPeriodoLectivo } from '@/features/periodo-lectivo/types'

interface Corte { id: number; nombre: string; orden: number }

const CORTES_OPTIONS: Corte[] = [
    { id: 1, nombre: 'Corte 1', orden: 1 },
    { id: 2, nombre: 'Corte 2', orden: 2 },
    { id: 3, nombre: 'Corte 3', orden: 3 },
    { id: 4, nombre: 'Corte 4', orden: 4 },
]

const PermisosPage = () => {
  // State for filters
  const [selectedPeriodo, setSelectedPeriodo] = useState<ConfPeriodoLectivo | null>(null)
  const [selectedGrupo, setSelectedGrupo] = useState<ConfigGrupos | null>(null)
  const [selectedCorte, setSelectedCorte] = useState<Corte | null>(null)

  // State for data
  const [asignaciones, setAsignaciones] = useState<AcademicoPermisoAsignacion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Data Selects
  const [periodosLectivos, setPeriodosLectivos] = useState<ConfPeriodoLectivo[]>([])
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [cortes, setCortes] = useState<Corte[]>(CORTES_OPTIONS)
  const [loadingCortes, setLoadingCortes] = useState(false)
  const [grupos, setGrupos] = useState<ConfigGrupos[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(false)

  // Load Periodos on mount
  useEffect(() => {
    setLoadingPeriodos(true)
    periodoLectivoService.getAllPeriodosLectivos()
      .then(res => setPeriodosLectivos(res.data || []))
      .catch((err: any) => toast.error('Error al cargar periodos'))
      .finally(() => setLoadingPeriodos(false))
  }, [])

  // Fetch groups when period changes
  useEffect(() => {
    if (selectedPeriodo?.id) {
      setLoadingGrupos(true)
      groupsService.getGruposByPeriodoLectivo(selectedPeriodo.id)
        .then((res: any) => setGrupos(res.data || []))
        .catch((err: any) => toast.error('Error al cargar grupos'))
        .finally(() => setLoadingGrupos(false))
    } else {
        setGrupos([])
        setSelectedGrupo(null)
    }
  }, [selectedPeriodo])

  // Fetch assignments when Filters are ready (Group and Corte needed? Actually just Group determines subjects, Corte determines column)
  // The requirement says "Mostrar campos... dependiendo del corte seleccionado".
  // So we fetch by Group, then UI shows the relevant column.
  useEffect(() => {
    if (selectedGrupo?.id) {
      setLoading(true)
      academicoPermisosService.getByGrupo(selectedGrupo.id)
        .then(res => {
            // Ensure data is array
            const data = Array.isArray(res.data) ? res.data : (res as any).data || [] // Handle different response wrappers
            setAsignaciones(data)
        })
        .catch(err => {
            console.error(err)
            toast.error('Error al cargar asignaturas')
            setAsignaciones([])
        })
        .finally(() => setLoading(false))
    } else {
        setAsignaciones([])
    }
  }, [selectedGrupo])

  const handleDateChange = (id: number, date: string) => {
    if (!selectedCorte) return

    // Identify which field to update based on Corte
    // Assuming Corte has an ID or order. The request mentions "permiso_fecha_corte1", etc.
    // If dynamic, we need to map selectedCorte to field name.
    // Let's assume selectedCorte.orden is 1, 2, 3, 4. Or use a helper.
    // For now, I'll assume selectedCorte has a property to identify it.
    
    // Simplification: Let's assume the dropdown gives us an index 1..4
    // Or we map the select option to 'permiso_fecha_corteX'

    const fieldName = `permiso_fecha_corte${selectedCorte.orden}` as keyof AcademicoPermisoAsignacion

    setAsignaciones(prev => prev.map(item => {
        if (item.id === id) {
            return { ...item, [fieldName]: date }
        }
        return item
    }))
  }

  const handleSave = async () => {
    if (!selectedCorte) return

    setSaving(true)
    try {
        // Prepare payload with only modified or all items? Service accepts array.
        // Let's send all for simplicity or verify if service validates IDs.
    const payload = asignaciones
        .filter(item => item.id > 0) // Filter out unassigned items
        .map(item => ({
            id: item.id,
            permiso_fecha_corte1: item.permiso_fecha_corte1,
            permiso_fecha_corte2: item.permiso_fecha_corte2,
            permiso_fecha_corte3: item.permiso_fecha_corte3,
            permiso_fecha_corte4: item.permiso_fecha_corte4,
        }))

        if (payload.length === 0) {
            toast('No hay cambios para guardar', { icon: 'ℹ️' })
            setSaving(false)
            return
        }

        await academicoPermisosService.updateMasivo({ asignaciones: payload })
        toast.success('Permisos guardados correctamente')
    } catch (error) {
        toast.error('Error al guardar permisos')
    } finally {
        setSaving(false)
    }
  }

  // Determine active field based on selected corte
  // Assuming corte object has { id: 1, nombre: 'I BIMESTRE', orden: 1 }
  const getActiveField = () => {
      if (!selectedCorte) return null
      return `permiso_fecha_corte${selectedCorte.orden}`
  }

  const columns: GridColDef[] = [
    { 
        field: 'asignatura', 
        headerName: 'ASIGNATURA', 
        flex: 1,
        valueGetter: (value: any, row: any) => row.asignatura_grado?.materia?.nombre || row.asignatura_grado?.asignatura?.nombre || 'N/A'
    },
    { 
        field: 'docente', 
        headerName: 'DOCENTE', 
        flex: 1,
        valueGetter: (value: any, row: any) => row.user?.nombre_completo || row.docente?.nombre_completo || 'Sin Asignar'
    }
  ]

  const activeField = getActiveField()

  if (activeField) {
      columns.push({
          field: activeField,
          headerName: `CORTE ${selectedCorte?.orden || ''} - FECHA LÍMITE`,
          width: 250,
          renderCell: (params: GridRenderCellParams) => {
              const formattedValue = params.value ? String(params.value).replace(' ', 'T').slice(0, 16) : ''
              const isUnassigned = params.row.id < 0
              return (
                  <TextField 
                      type="datetime-local"
                      size="small"
                      fullWidth
                      value={formattedValue}
                      onChange={(e) => handleDateChange(params.row.id, e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={isUnassigned}
                  />
              )
          }
      })
  }

  return (
    <Card>
      <CardHeader title="Permisos de Calificaciones" />
      <CardContent>
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Periodo Lectivo */}
          <Grid item xs={12} md={4}>
            <Autocomplete
                size="small"
                options={periodosLectivos || []}
                getOptionLabel={(option) => option.nombre}
                value={selectedPeriodo}
                onChange={(_, newValue) => setSelectedPeriodo(newValue)}
                renderInput={(params) => <TextField {...params} label="Periodo Lectivo" placeholder="Seleccionar..." size="small" />}
                loading={loadingPeriodos}
            />
          </Grid>

          {/* Grupo */}
          <Grid item xs={12} md={4}>
            <Autocomplete
                size="small"
                options={grupos}
                getOptionLabel={(option) => `${option.grado?.nombre || ''} - ${option.seccion?.nombre || ''} (${option.turno?.nombre || ''})`}
                value={selectedGrupo}
                onChange={(_, newValue) => setSelectedGrupo(newValue)}
                renderInput={(params) => <TextField {...params} label="Grupo" placeholder="Seleccionar..." size="small" />}
                disabled={!selectedPeriodo}
                loading={loadingGrupos}
            />
          </Grid>

           {/* Corte */}
          <Grid item xs={12} md={4}>
            <Autocomplete
                size="small"
                options={cortes || []} 
                getOptionLabel={(option) => option.nombre}
                value={selectedCorte}
                onChange={(_, newValue) => setSelectedCorte(newValue)}
                renderInput={(params) => <TextField {...params} label="Corte" placeholder="Seleccionar..." size="small" />}
                loading={loadingCortes}
            />
          </Grid>
        </Grid>

        <div style={{ height: 500, width: '100%' }}>
            <DataGrid
                rows={asignaciones}
                columns={columns}
                rowHeight={60}
                loading={loading}
                disableRowSelectionOnClick
                hideFooter
                density="compact"
                getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'}
                sx={{
                    backgroundColor: 'background.paper',
                    '& .MuiDataGrid-row.odd': {
                        backgroundColor: (theme) => theme.palette.action.hover,
                    }
                }}
                localeText={{
                    noRowsLabel: selectedGrupo ? 'No hay asignaturas' : 'Seleccione un grupo'
                }}
            />
        </div>

        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={!selectedCorte || asignaciones.length === 0 || saving}
            >
                Guardar
            </Button>
        </Grid>

      </CardContent>
    </Card>
  )
}

export default PermisosPage
