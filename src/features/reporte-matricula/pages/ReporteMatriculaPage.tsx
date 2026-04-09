'use client'

import React, { useEffect, useRef, useState } from 'react'

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'

import {
    CalendarToday as CalendarIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    Assessment as ReportIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import { reporteMatriculaService } from '../services/reporteMatriculaService'
import type {
    Modalidad,
    PeriodoLectivo,
    ReporteMatriculaData
} from '../types'

export default function ReporteMatriculaPage() {
  const [periodosLectivos, setPeriodosLectivos] = useState<PeriodoLectivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [modalidades, setModalidades] = useState<Modalidad[]>([])
  const [selectedModalidad, setSelectedModalidad] = useState<number | 'Todos' | ''>('Todos')
  const [reporteData, setReporteData] = useState<ReporteMatriculaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)
  const [loadingModalidades, setLoadingModalidades] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Ref para evitar doble carga en StrictMode
  const hasLoadedRef = useRef(false)

  // Cargar períodos lectivos al montar el componente
  useEffect(() => {
    // Evitar doble carga en StrictMode: cargar una sola vez
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadPeriodosLectivos()
      loadModalidades()
    }
  }, [])

  const loadPeriodosLectivos = async () => {
    try {
      setLoadingPeriodos(true)
      setError(null)
      const periodos = await reporteMatriculaService.getPeriodosLectivos()
      setPeriodosLectivos(periodos)
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Error al cargar los períodos lectivos'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const loadModalidades = async () => {
    try {
      setLoadingModalidades(true)
      const mods = await reporteMatriculaService.getModalidades()
      setModalidades(mods)
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Error al cargar las modalidades'
      toast.error(errorMessage)
    } finally {
      setLoadingModalidades(false)
    }
  }

  const loadEstadisticas = async (periodoId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await reporteMatriculaService.getEstadisticas({
        periodoLectivoId: periodoId,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        modalidadId: selectedModalidad === '' ? undefined : selectedModalidad
      })
      setReporteData(response.data)
      
      // Verificar si hay datos - la estructura correcta según el backend
      const hasData = response.data && (
        (response.data.estadisticas_grupo_turno?.estadisticas?.length > 0) ||
        (response.data.estadisticas_grado_turno?.estadisticas?.length > 0) ||
        (response.data.estadisticas_por_dia?.estadisticas?.length > 0) ||
        (response.data.estadisticas_por_usuario?.estadisticas?.length > 0)
      )
      
      if (hasData) {
        toast.success('Estadísticas cargadas correctamente')
      } else {
        toast.success('No hay datos de matrícula para el período seleccionado')
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Error al cargar las estadísticas'
      setError(errorMessage)
      toast.error(errorMessage)
      setReporteData(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodoChange = (periodoId: number | '') => {
    // Actualizar estado y limpiar resultados; la búsqueda se hace solo con el botón
    setSelectedPeriodo(periodoId)
    setReporteData(null)
    setError(null)
  }

  const handleAplicarFiltros = () => {
    if (!selectedPeriodo) {
      toast.error('Debe seleccionar un período lectivo')
      return
    }
    loadEstadisticas(selectedPeriodo as number)
  }

  const handlePrintPDF = async () => {
    if (!selectedPeriodo) {
      toast.error('Debe seleccionar un período lectivo')
      return
    }

    try {
      setPrintLoading(true)
      const response = await reporteMatriculaService.generarPdfEstadisticas({
        periodoLectivoId: selectedPeriodo as number,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        modalidadId: selectedModalidad === '' ? undefined : selectedModalidad
      })
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Abrir en nueva pestaña para visualización
      window.open(url, '_blank')
      
      // Limpiar memoria después de 1 segundo
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
      
      toast.success('PDF generado para impresión')
    } catch (error: any) {
      handlePdfError(error)
    } finally {
      setPrintLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedPeriodo) {
      toast.error('Debe seleccionar un período lectivo')
      return
    }

    try {
      setDownloadLoading(true)
      const response = await reporteMatriculaService.generarPdfEstadisticas({
        periodoLectivoId: selectedPeriodo as number,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        modalidadId: selectedModalidad === '' ? undefined : selectedModalidad
      })
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      a.download = `estadisticas_matricula_${timestamp}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Limpiar memoria después de 1 segundo
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
      
      toast.success('PDF descargado')
    } catch (error: any) {
      handlePdfError(error)
    } finally {
      setDownloadLoading(false)
    }
  }

  const handlePdfError = (error: any) => {
    if (error.status === 401) {
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
      window.location.href = '/auth/login'
      return
    }
    
    toast.error('Error al generar el PDF. Intente nuevamente.')
  }

  const formatDate = (dateString: string) => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    
    return localDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          Estadística de Matrícula
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulte las estadísticas de matrícula por período lectivo
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-start">
            {/* Columna izquierda: inputs */}
            <Grid item xs={12} md={9}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Período Lectivo</InputLabel>
                    <Select
                      value={selectedPeriodo}
                      onChange={(e) => handlePeriodoChange(e.target.value as number | '')}
                      label="Período Lectivo"
                      disabled={loadingPeriodos}
                      startAdornment={<CalendarIcon sx={{ mr: 1, color: 'action.active' }} />}
                      size="small"
                    >
                      <MenuItem value="">Seleccione un período</MenuItem>
                      {periodosLectivos.map((periodo) => (
                        <MenuItem key={periodo.id} value={periodo.id}>
                          {periodo.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Fecha inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => { setFechaInicio(e.target.value); setReporteData(null); setError(null); }}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Fecha fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => { setFechaFin(e.target.value); setReporteData(null); setError(null); }}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Modalidad</InputLabel>
                    <Select
                      value={selectedModalidad}
                      onChange={(e) => { setSelectedModalidad(e.target.value as number | 'Todos' | ''); setReporteData(null); setError(null); }}
                      label="Modalidad"
                      disabled={loadingModalidades}
                      size="small"
                    >
                      <MenuItem value={'Todos'}>Todos</MenuItem>
                      {modalidades.map(mod => (
                        <MenuItem key={mod.id} value={mod.id}>{mod.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Columna derecha: botones */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => { setFechaInicio(''); setFechaFin(''); setSelectedModalidad('Todos'); setReporteData(null); setError(null) }}
                  disabled={loading}
                  fullWidth
                >
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ReportIcon />}
                  onClick={handleAplicarFiltros}
                  disabled={!selectedPeriodo || loading}
                  fullWidth
                >
                  Buscar
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={printLoading ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                  onClick={handlePrintPDF}
                  disabled={!selectedPeriodo || loading || printLoading || downloadLoading}
                  fullWidth
                >
                  {printLoading ? 'Generando...' : 'Imprimir PDF'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={downloadLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownloadPDF}
                  disabled={!selectedPeriodo || loading || printLoading || downloadLoading}
                  fullWidth
                >
                  {downloadLoading ? 'Descargando...' : 'Descargar PDF'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Cargando estadísticas...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {reporteData && !loading && (
        <Box sx={{ space: 3 }}>
          {/* Información del período */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Período
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Período:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {reporteData.periodo_lectivo?.nombre || 'Período no identificado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Generado:
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(reporteData.fecha_generacion)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Estadísticas por Grupo y Turno */}
          {reporteData.estadisticas_grupo_turno?.estadisticas?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estadísticas por Grupo y Turno
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Grupo</strong></TableCell>
                        <TableCell><strong>Turno</strong></TableCell>
                        <TableCell align="center"><strong>Varones</strong></TableCell>
                        <TableCell align="center"><strong>Mujeres</strong></TableCell>
                        <TableCell align="center"><strong>Nuevo Ingreso</strong></TableCell>
                        <TableCell align="center"><strong>Reingreso</strong></TableCell>
                        <TableCell align="center"><strong>Traslado</strong></TableCell>
                        <TableCell align="center"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reporteData.estadisticas_grupo_turno.estadisticas.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.grupo}</TableCell>
                          <TableCell>{item.turno}</TableCell>
                          <TableCell align="center">{item.varones}</TableCell>
                          <TableCell align="center">{item.mujeres}</TableCell>
                          <TableCell align="center">{item.nuevos_ingresos}</TableCell>
                          <TableCell align="center">{item.reingresos}</TableCell>
                          <TableCell align="center">{item.traslados}</TableCell>
                          <TableCell align="center">
                            <Chip label={item.total} color="primary" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fila de totales */}
                      {reporteData.estadisticas_grupo_turno.totales && (
                        <TableRow sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                          <TableCell colSpan={2}><strong>TOTAL</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grupo_turno.totales.varones}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grupo_turno.totales.mujeres}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grupo_turno.totales.nuevos_ingresos}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grupo_turno.totales.reingresos}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grupo_turno.totales.traslados}</strong></TableCell>
                          <TableCell align="center">
                            <Chip label={reporteData.estadisticas_grupo_turno.totales.total} color="secondary" size="small" />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas por Grado y Turno */}
          {reporteData.estadisticas_grado_turno?.estadisticas?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estadísticas por Grado y Turno
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Grado</strong></TableCell>
                        <TableCell><strong>Turno</strong></TableCell>
                        <TableCell align="center"><strong>Varones</strong></TableCell>
                        <TableCell align="center"><strong>Mujeres</strong></TableCell>
                        <TableCell align="center"><strong>Nuevo Ingreso</strong></TableCell>
                        <TableCell align="center"><strong>Reingreso</strong></TableCell>
                        <TableCell align="center"><strong>Traslado</strong></TableCell>
                        <TableCell align="center"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reporteData.estadisticas_grado_turno.estadisticas.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.grado}</TableCell>
                          <TableCell>{item.turno}</TableCell>
                          <TableCell align="center">{item.varones}</TableCell>
                          <TableCell align="center">{item.mujeres}</TableCell>
                          <TableCell align="center">{item.nuevos_ingresos}</TableCell>
                          <TableCell align="center">{item.reingresos}</TableCell>
                          <TableCell align="center">{item.traslados}</TableCell>
                          <TableCell align="center">
                            <Chip label={item.total} color="primary" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fila de totales */}
                      {reporteData.estadisticas_grado_turno.totales && (
                        <TableRow sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                          <TableCell colSpan={2}><strong>TOTAL</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grado_turno.totales.varones}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grado_turno.totales.mujeres}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grado_turno.totales.nuevos_ingresos}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grado_turno.totales.reingresos}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_grado_turno.totales.traslados}</strong></TableCell>
                          <TableCell align="center">
                            <Chip label={reporteData.estadisticas_grado_turno.totales.total} color="secondary" size="small" />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas por Día */}
          {reporteData.estadisticas_por_dia?.estadisticas?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estadísticas por Día
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Grado</strong></TableCell>
                        <TableCell><strong>Turno</strong></TableCell>
                        <TableCell align="center"><strong>Masculino</strong></TableCell>
                        <TableCell align="center"><strong>Femenino</strong></TableCell>
                        <TableCell align="center"><strong>Nuevo Ingreso</strong></TableCell>
                        <TableCell align="center"><strong>Reingreso</strong></TableCell>
                        <TableCell align="center"><strong>Traslado</strong></TableCell>
                        <TableCell align="center"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reporteData.estadisticas_por_dia.estadisticas.map((diaItem, diaIndex) => (
                        <React.Fragment key={`dia-${diaIndex}-${diaItem.fecha}`}>
                          {/* Fila de encabezado de fecha */}
                          <TableRow key={`fecha-header-${diaIndex}`} sx={{ bgcolor: 'primary.100' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }} colSpan={9}>
                              📅 {(() => {
                                // Crear fecha local para evitar problemas de zona horaria
                                const [year, month, day] = diaItem.fecha.split('-').map(Number)
                                const localDate = new Date(year, month - 1, day)
                                
                                return localDate.toLocaleDateString('es-ES', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              })()}
                            </TableCell>
                          </TableRow>

                          {/* Fila de totales del día */}
                          <TableRow key={`fecha-total-${diaIndex}`} sx={{ bgcolor: 'primary.50' }}>
                            <TableCell sx={{ fontWeight: 'bold', pl: 2 }}>
                              TOTAL DEL DÍA
                            </TableCell>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
                              —
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              {diaItem.estadisticas?.reduce((sum, detalle) => sum + detalle.varones, 0) || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              {diaItem.estadisticas?.reduce((sum, detalle) => sum + detalle.mujeres, 0) || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              {diaItem.estadisticas?.reduce((sum, detalle) => sum + detalle.nuevos_ingresos, 0) || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              {diaItem.estadisticas?.reduce((sum, detalle) => sum + detalle.reingresos, 0) || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                              {diaItem.estadisticas?.reduce((sum, detalle) => sum + detalle.traslados, 0) || 0}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={diaItem.estadisticas?.reduce((sum, detalle) => sum + detalle.total, 0) || 0} 
                                color="primary" 
                                size="small" 
                                sx={{ fontWeight: 'bold' }} 
                              />
                            </TableCell>
                          </TableRow>
                          
                          {/* Filas de detalles por grado y turno */}
                          {diaItem.estadisticas?.map((detalle, detalleIndex) => (
                            <TableRow key={`detalle-${diaIndex}-${detalleIndex}`} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                              <TableCell sx={{ pl: 4, color: 'text.secondary', fontSize: '0.875rem' }}>
                                {/* Fecha vacía para detalles */}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.875rem' }}>{detalle.grado}</TableCell>
                              <TableCell sx={{ fontSize: '0.875rem' }}>{detalle.turno}</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.875rem' }}>{detalle.varones}</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.875rem' }}>{detalle.mujeres}</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.875rem' }}>{detalle.nuevos_ingresos}</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.875rem' }}>{detalle.reingresos}</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.875rem' }}>{detalle.traslados}</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.875rem' }}>{detalle.total}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Fila de totales generales */}
                      {reporteData.estadisticas_por_dia.totales && (
                        <TableRow sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
                          <TableCell colSpan={3}><strong>TOTAL GENERAL</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_por_dia.totales.varones}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_por_dia.totales.mujeres}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_por_dia.totales.nuevos_ingresos}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_por_dia.totales.reingresos}</strong></TableCell>
                          <TableCell align="center"><strong>{reporteData.estadisticas_por_dia.totales.traslados}</strong></TableCell>
                          <TableCell align="center">
                            <Chip label={reporteData.estadisticas_por_dia.totales.total} color="secondary" size="small" />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas por Usuario */}
          {reporteData.estadisticas_por_usuario?.estadisticas?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estadísticas por Usuario
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Usuario</strong></TableCell>
                        <TableCell align="center"><strong>Varones</strong></TableCell>
                        <TableCell align="center"><strong>Mujeres</strong></TableCell>
                        <TableCell align="center"><strong>Nuevo Ingreso</strong></TableCell>
                        <TableCell align="center"><strong>Reingreso</strong></TableCell>
                        <TableCell align="center"><strong>Traslado</strong></TableCell>
                        <TableCell align="center"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reporteData.estadisticas_por_usuario.estadisticas.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.usuario}</TableCell>
                          <TableCell align="center">
                            <Chip label={item.varones} color="info" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.mujeres} color="secondary" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.nuevos_ingresos} color="success" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.reingresos} color="warning" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.traslados} color="default" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.total} color="primary" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fila de totales */}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          <strong>Total General</strong>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip 
                            label={reporteData.estadisticas_por_usuario.varones_general || 0} 
                            color="info" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip 
                            label={reporteData.estadisticas_por_usuario.mujeres_general || 0} 
                            color="secondary" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip 
                            label={reporteData.estadisticas_por_usuario.nuevos_ingresos_general || 0} 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip 
                            label={reporteData.estadisticas_por_usuario.reingresos_general || 0} 
                            color="warning" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip 
                            label={reporteData.estadisticas_por_usuario.traslados_general || 0} 
                            color="default" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip 
                            label={reporteData.estadisticas_por_usuario.total_general || 0} 
                            color="primary" 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Estado vacío - Sin datos */}
      {reporteData && !loading && !error && (
        !reporteData.estadisticas_grupo_turno?.estadisticas?.length &&
        !reporteData.estadisticas_grado_turno?.estadisticas?.length &&
        !reporteData.estadisticas_por_dia?.estadisticas?.length &&
        !reporteData.estadisticas_por_usuario?.estadisticas?.length
      ) && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay datos de matrícula disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se encontraron estudiantes matriculados para el período seleccionado "{reporteData.periodo_lectivo?.nombre || 'Seleccionado'}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Verifique que existan matrículas registradas para este período lectivo.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío - No hay período seleccionado */}
      {!reporteData && !loading && !error && selectedPeriodo && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay datos disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se encontraron estadísticas para el período seleccionado
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Mensaje inicial */}
      {!selectedPeriodo && !loadingPeriodos && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Seleccione un período lectivo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Elija un período lectivo para ver las estadísticas de matrícula
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
