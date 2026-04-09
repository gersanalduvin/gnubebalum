'use client'

import { ActividadSemanaModal } from '@/features/reportes/components/ActividadSemanaModal'
import { boletinEscolarService } from '@/features/reportes/services/boletinEscolarService'
import {
  ReporteActividadesData,
  reporteActividadesService
} from '@/features/reportes/services/reporteActividadesService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const ActividadesSemanaPage = () => {
  const { hasPermission, isSuperAdmin } = usePermissions()
  const canView = isSuperAdmin || hasPermission('ver.actividades_semana')

  // Filter options
  const [periodos, setPeriodos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [cortes, setCortes] = useState<any[]>([])

  // Selected filters
  const [filters, setFilters] = useState({
    periodo_lectivo_id: '',
    grupo_id: '',
    corte_id: ''
  })

  // Loaders
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [loadingCortes, setLoadingCortes] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Report Data
  const [reportData, setReportData] = useState<ReporteActividadesData | null>(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalAsignatura, setModalAsignatura] = useState('')
  const [modalActividades, setModalActividades] = useState<any[]>([])

  const [printing, setPrinting] = useState(false)

  // Load academic periods on mount
  useEffect(() => {
    if (canView) {
      loadPeriodos()
    }
  }, [canView])

  // Load groups when period changes
  useEffect(() => {
    if (filters.periodo_lectivo_id) {
      loadGrupos(Number(filters.periodo_lectivo_id))
      loadCortes(Number(filters.periodo_lectivo_id))
    } else {
      setGrupos([])
      setCortes([])
    }
    // We only reset dependent dropdowns here
    setFilters(prev => ({ ...prev, grupo_id: '', corte_id: '' }))
  }, [filters.periodo_lectivo_id])

  // Auto-fetch data when all 3 filters are populated, or clear table if not
  useEffect(() => {
    if (filters.periodo_lectivo_id && filters.grupo_id && filters.corte_id) {
      handleConsultar()
    } else {
      setReportData(null)
    }
  }, [filters.periodo_lectivo_id, filters.grupo_id, filters.corte_id])

  const loadPeriodos = async () => {
    setLoadingPeriodos(true)
    try {
      const resp = await boletinEscolarService.getPeriodos()
      setPeriodos(resp?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar periodos')
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const loadGrupos = async (periodoId: number) => {
    setLoadingGrupos(true)
    try {
      const resp = await boletinEscolarService.getGrupos(periodoId)
      setGrupos(resp?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar grupos')
    } finally {
      setLoadingGrupos(false)
    }
  }

  const loadCortes = async (periodoId: number) => {
    setLoadingCortes(true)
    try {
      const resp = await boletinEscolarService.getCortes(periodoId)
      setCortes(resp?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar cortes')
    } finally {
      setLoadingCortes(false)
    }
  }

  const handleConsultar = async () => {
    if (!filters.periodo_lectivo_id || !filters.grupo_id || !filters.corte_id) {
      toast.error('Selecione todos los campos')
      return
    }

    setLoadingData(true)
    try {
      const response = await reporteActividadesService.generarReporte({
        periodo_lectivo_id: Number(filters.periodo_lectivo_id),
        grupo_id: Number(filters.grupo_id),
        corte_id: Number(filters.corte_id)
      })

      if (response) {
        if (response.success && response.data) {
          setReportData(response.data)
        } else if (response.semanas && response.lineas) {
          setReportData(response)
        } else {
          toast.error('Formato de datos no reconocido')
        }
      } else {
        toast.error('Error cargando el reporte')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error crítico consultando los datos')
    } finally {
      setLoadingData(false)
    }
  }

  const handleGenerarPDF = async () => {
    if (!filters.periodo_lectivo_id || !filters.grupo_id || !filters.corte_id) return

    setPrinting(true)
    try {
      await reporteActividadesService.generarPDF({
        periodo_lectivo_id: Number(filters.periodo_lectivo_id),
        grupo_id: Number(filters.grupo_id),
        corte_id: Number(filters.corte_id)
      })
    } catch (error) {
      console.error(error)
      toast.error('Error generando el PDF')
    } finally {
      setPrinting(false)
    }
  }

  const handleOpenCell = (cellData: any[], colTitle: string, asignaturaName: string) => {
    if (!cellData || cellData.length === 0) return
    setModalTitle(colTitle)
    setModalAsignatura(asignaturaName)
    setModalActividades(cellData)
    setModalOpen(true)
  }

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>No tiene permisos para acceder a este reporte.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title='Cantidad de actividades por semana'
          subheader='Visualice el número de tareas y evidencias diarias planificadas por docente y semana'
        />
        <CardContent>
          <Grid container spacing={3} sx={{ mb: 3, '@media print': { display: 'none' } }}>
            {/* Periodo Lectivo */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Seleccionar un Periodo Lectivo'
                value={filters.periodo_lectivo_id}
                onChange={e => setFilters(prev => ({ ...prev, periodo_lectivo_id: e.target.value }))}
                disabled={loadingPeriodos}
                InputProps={{
                  endAdornment: loadingPeriodos ? <CircularProgress size={20} /> : null
                }}
              >
                <MenuItem value=''>Seleccione un periodo</MenuItem>
                {periodos.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Grupo */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Seleccionar un Grupo'
                value={filters.grupo_id}
                onChange={e => setFilters(prev => ({ ...prev, grupo_id: e.target.value }))}
                disabled={!filters.periodo_lectivo_id || loadingGrupos}
                InputProps={{
                  endAdornment: loadingGrupos ? <CircularProgress size={20} /> : null
                }}
              >
                <MenuItem value=''>Seleccione un grupo</MenuItem>
                {grupos.map((g: any) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.grado?.nombre} - {g.seccion?.nombre} ({g.turno?.nombre})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Corte */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Seleccionar un Corte'
                value={filters.corte_id}
                onChange={e => setFilters(prev => ({ ...prev, corte_id: e.target.value }))}
                disabled={!filters.periodo_lectivo_id || loadingCortes}
                InputProps={{
                  endAdornment: loadingCortes ? <CircularProgress size={20} /> : null
                }}
              >
                <MenuItem value=''>Seleccione un corte</MenuItem>
                {cortes.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre} ({c.semestre_nombre})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                color='primary'
                onClick={handleGenerarPDF}
                disabled={loadingData || printing || !reportData || reportData.lineas.length === 0}
              >
                {printing ? 'Generando...' : 'Imprimir PDF'}
              </Button>
            </Grid>
          </Grid>

          {/* Table Render */}
          {reportData && reportData.lineas && reportData.semanas && (
            <TableContainer component={Paper} elevation={2} sx={{ mt: 3, maxHeight: '600px', overflowX: 'auto' }}>
              <Table stickyHeader size='small' sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 250, fontWeight: 'bold' }}>Asignatura</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Docente</TableCell>
                    {reportData.semanas.map((sem, i) => (
                      <TableCell
                        key={i}
                        align='center'
                        sx={{
                          fontWeight: 'bold',
                          // Vertical Text Formatting
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          whiteSpace: 'nowrap',
                          p: 2,
                          width: '40px'
                        }}
                      >
                        {sem.rango}
                      </TableCell>
                    ))}
                    <TableCell
                      align='center'
                      sx={{
                        fontWeight: 'bold',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap',
                        width: '40px',
                        p: 2
                      }}
                    >
                      TOTAL
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.lineas.map((linea, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{linea.asignatura}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{linea.docente}</TableCell>

                      {reportData.semanas.map((sem, i) => {
                        const val = linea.totales_por_semana[sem.key] || 0
                        const isEmpty = val === 0

                        return (
                          <TableCell
                            key={i}
                            align='center'
                            onClick={() => {
                              if (!isEmpty) {
                                handleOpenCell(linea.actividades_por_semana[sem.key], sem.rango, linea.asignatura)
                              }
                            }}
                            sx={{
                              color: isEmpty ? 'error.main' : 'primary.main',
                              cursor: isEmpty ? 'default' : 'pointer',
                              '&:hover': {
                                textDecoration: isEmpty ? 'none' : 'underline',
                                backgroundColor: isEmpty ? 'transparent' : 'action.hover'
                              }
                            }}
                          >
                            {val}
                          </TableCell>
                        )
                      })}

                      <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                        {linea.total_general}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* If no data */}
                  {reportData.lineas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={reportData.semanas.length + 3} align='center'>
                        <Typography variant='body2' sx={{ my: 3 }}>
                          No hay datos para mostrar
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <ActividadSemanaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        semanaRango={modalTitle}
        asignatura={modalAsignatura}
        actividades={modalActividades}
      />
    </Box>
  )
}

export default ActividadesSemanaPage
