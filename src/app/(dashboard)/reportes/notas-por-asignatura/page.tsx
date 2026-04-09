'use client'

import gruposService from '@/features/config-grupos/services/gruposService'
import periodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'
import ReporteNotasTable from '@/features/reportes/components/ReporteNotasTable'
import { reporteNotasService } from '@/features/reportes/services/reporteNotasService'
import { usePermissions } from '@/hooks/usePermissions'
import { FileDownload as FileDownloadIcon, PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Grid,
    IconButton,
    MenuItem,
    TextField,
    Tooltip
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const ReporteNotasPage = () => {
    // Permission Hook
    const { hasPermission, isSuperAdmin, user } = usePermissions()

    // Permission Logic
    const canView = isSuperAdmin || hasPermission('notas.por.asignatura') || hasPermission('operaciones.docentes')


  // Filters State
  const [periodos, setPeriodos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [asignaturas, setAsignaturas] = useState<any[]>([])
  const [cortes, setCortes] = useState<any[]>([])

  const [filters, setFilters] = useState({
    periodo_id: '',
    grupo_id: '',
    asignatura_id: '',
    corte_id: ''
  })

  // Data State
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  // Loaders State
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [loadingAsignaturas, setLoadingAsignaturas] = useState(false)

  // Loaders
  const loadPeriodos = async () => {
    setLoadingPeriodos(true)
    try {
      const resp = await periodoLectivoService.getAllPeriodosLectivos()
      setPeriodos(resp.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar periodos')
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const loadGrupos = async (periodoId?: string) => {
    setLoadingGrupos(true)
    try {
      if (hasPermission('operaciones.docentes') && !isSuperAdmin) {
          // Docente View: Load My Active Groups
          const resp = await gruposService.getMyActiveGroups()
          setGrupos(resp.data || [])
      } else {
          // Admin View
          if (!periodoId) return
          const resp = await gruposService.getGruposByPeriodoLectivo(Number(periodoId))
          setGrupos(resp.data || [])
      }
    } catch (error) {
      console.error(error)
      setGrupos([])
    } finally {
      setLoadingGrupos(false)
    }
  }

  const loadAlternativas = async (grupoId: string) => {
    if (!grupoId) return
    setLoadingAsignaturas(true)
    try {
        const selectedGrupo = grupos.find(g => g.id === Number(grupoId))
        if (selectedGrupo) {
            // Fix: Ensure grado_id exists. If not, try checking nested object if structure is different
            // or just log it to debug pending verification.
            const gradoId = selectedGrupo.grado_id || selectedGrupo.grado?.id
            
            if (gradoId) {
                 const data = await reporteNotasService.getAlternativas(
                    Number(filters.periodo_id || selectedGrupo.periodo_lectivo_id),
                    gradoId,
                    Number(grupoId)
                )
                setAsignaturas(data.asignaturas || [])
                // If api returns empty or null for partials, keep existing if any or empty? 
                // Usually alternatives endpoint returns both.
                if (data.parciales) setCortes(data.parciales)
            } else {
                console.warn('Grupo does not have grado_id', selectedGrupo)
            }
        }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar asignaturas')
      setAsignaturas([])
      setCortes([])
    } finally {
      setLoadingAsignaturas(false)
    }
  }

  // Handlers
  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    // Reset dependent fields
    if (field === 'periodo_id') {
      setFilters(prev => ({ ...prev, periodo_id: value, grupo_id: '', asignatura_id: '', corte_id: '' }))
      loadGrupos(value)
      setAsignaturas([])
      setCortes([])
    }
    if (field === 'grupo_id') {
      const selectedGrupo = grupos.find(g => g.id === Number(value))
      setFilters(prev => ({ 
          ...prev, 
          grupo_id: value, 
          asignatura_id: '', 
          corte_id: '',
          // If teacher (or just to be safe), take period from group if missing or always sync?
          // Better to sync always if group dictates period.
          periodo_id: selectedGrupo?.periodo_lectivo_id ? String(selectedGrupo.periodo_lectivo_id) : prev.periodo_id
      }))
      loadAlternativas(value)
    }
    if (field === 'asignatura_id') {
      setFilters(prev => ({ ...prev, asignatura_id: value, corte_id: '' }))
    }
  }

  useEffect(() => {
    const fetchReport = async () => {
        if (!filters.corte_id || !filters.asignatura_id || !filters.grupo_id) {
            setReportData(null)
            return
        }

        setLoading(true)
        try {
            const data = await reporteNotasService.getReporte({
                grupo_id: Number(filters.grupo_id),
                asignatura_id: Number(filters.asignatura_id),
                corte_id: Number(filters.corte_id)
            })
            setReportData(data)
        } catch (error) {
            toast.error('Error al generar reporte')
            setReportData(null)
        } finally {
            setLoading(false)
        }
    }
    fetchReport()
  }, [filters.corte_id, filters.asignatura_id, filters.grupo_id])

  const handleExport = async (type: 'excel' | 'pdf') => {
    if (!filters.corte_id || !filters.asignatura_id || !filters.grupo_id) return
    
    const toastId = toast.loading('Exportando...')
    try {
        if (type === 'excel') {
            await reporteNotasService.downloadExcel({
                grupo_id: Number(filters.grupo_id),
                asignatura_id: Number(filters.asignatura_id),
                corte_id: Number(filters.corte_id)
            })
        } else {
             await reporteNotasService.downloadPdf({
                grupo_id: Number(filters.grupo_id),
                asignatura_id: Number(filters.asignatura_id),
                corte_id: Number(filters.corte_id)
            })
        }
        toast.success('Exportación completada', { id: toastId })
    } catch (error) {
        toast.error('Error al exportar', { id: toastId })
    }
  }

  useEffect(() => {
    if (!user) return // Wait for user to load

    if (hasPermission('operaciones.docentes') && !isSuperAdmin) {
        // Teacher: Load groups directly
        loadGrupos()
    } else {
        // Admin: Load Periods first
        loadPeriodos()
    }
  }, [user, isSuperAdmin])

  if (!canView) {
      return (
          <Alert severity="error" sx={{ m: 2 }}>
              No tiene permisos para visualizar este reporte.
          </Alert>
      )
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Reporte de Notas por Asignatura" 
            subheader="Calificaciones detalladas por corte evaluativo"
            action={
                reportData && (
                    <Box>
                         <Tooltip title="Exportar Excel">
                            <IconButton onClick={() => handleExport('excel')} color="success">
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Exportar PDF">
                            <IconButton onClick={() => handleExport('pdf')} color="error">
                                <PictureAsPdfIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )
            }
          />
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {!(!isSuperAdmin && hasPermission('operaciones.docentes')) && (
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Periodo Lectivo"
                  value={filters.periodo_id}
                  onChange={(e) => handleFilterChange('periodo_id', e.target.value)}
                  size="small"
                  disabled={loadingPeriodos}
                  SelectProps={{
                      MenuProps: { PaperProps: { sx: { maxHeight: 300 } } }
                  }}
                >
                  {loadingPeriodos ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                   periodos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              )}
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Grupo"
                  value={filters.grupo_id}
                  onChange={(e) => handleFilterChange('grupo_id', e.target.value)}
                  disabled={((!isSuperAdmin && hasPermission('operaciones.docentes')) ? false : !filters.periodo_id) || loadingGrupos}
                  size="small"
                >
                  {loadingGrupos ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                   grupos.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                        {g.grado?.nombre} - {g.seccion?.nombre} ({g.turno?.nombre})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Asignatura"
                  value={filters.asignatura_id}
                  onChange={(e) => handleFilterChange('asignatura_id', e.target.value)}
                  disabled={!filters.grupo_id || loadingAsignaturas}
                  size="small"
                >
                  {loadingAsignaturas ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                   asignaturas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                        {a.nombre || a.asignatura?.nombre || a.materia?.nombre || a.materia}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Corte Evaluativo"
                  value={filters.corte_id}
                  onChange={(e) => handleFilterChange('corte_id', e.target.value)}
                  disabled={!filters.grupo_id}
                  size="small"
                >
                  {cortes.filter(c => {
                      if (!filters.asignatura_id) return true
                      const selectedAsignatura = asignaturas.find(a => a.id === Number(filters.asignatura_id)) as any
                      if (selectedAsignatura?.cortes_ids?.length > 0) {
                          return selectedAsignatura.cortes_ids.includes(c.id)
                      }
                      return true
                  }).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : reportData ? (
                    <ReporteNotasTable 
                        tasks={reportData.tasks} 
                        students={reportData.students} 
                        metadata={reportData.metadata}
                    />
                ) : null}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ReporteNotasPage
