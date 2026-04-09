'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Box, Card, CardContent, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Save as SaveIcon, PictureAsPdf as PdfIcon, Description as CsvIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import { organizarListasService } from '../services/organizarListasService'
import type { PeriodoLectivo, Grado, Turno, AlumnoListItem, Grupo } from '../types'

export default function OrganizarListasPage() {
  const [periodos, setPeriodos] = useState<PeriodoLectivo[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedGrado, setSelectedGrado] = useState<number | ''>('')
  const [selectedTurno, setSelectedTurno] = useState<number | ''>('')
  const [alumnos, setAlumnos] = useState<AlumnoListItem[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [asignaciones, setAsignaciones] = useState<Record<number, number>>({})
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadCatalogos()
    }
  }, [])

  const loadCatalogos = async () => {
    try {
      setLoadingCatalogos(true)
      const data = await organizarListasService.getCatalogos()
      setPeriodos(data.periodos_lectivos)
      setGrados(data.grados)
      setTurnos(data.turnos)
    } catch (error: any) {
      const msg = error?.data?.message || 'Error al cargar catálogos'
      toast.error(msg)
    } finally {
      setLoadingCatalogos(false)
    }
  }

  const loadData = async () => {
    try {
      setLoadingData(true)
      const params = {
        periodo_lectivo_id: selectedPeriodo || undefined,
        grado_id: selectedGrado || undefined,
        turno_id: selectedTurno || undefined
      }
      const [alumnosList, gruposList] = await Promise.all([
        organizarListasService.getAlumnos(params),
        organizarListasService.getGrupos(params)
      ])
      setAlumnos(alumnosList)
      setGrupos(gruposList)
      const initialAsignaciones = alumnosList.reduce((acc: Record<number, number>, al: any) => {
        if (al && typeof al.grupo_id === 'number' && al.grupo_id) {
          acc[al.user_id] = al.grupo_id
        }
        return acc
      }, {})
      setAsignaciones(initialAsignaciones)
      toast.success('Datos cargados')
    } catch (error: any) {
      const msg = error?.data?.message || 'Error al cargar datos'
      toast.error(msg)
      setAlumnos([])
      setGrupos([])
    } finally {
      setLoadingData(false)
    }
  }

  const handleGuardar = async () => {
    const entries = Object.entries(asignaciones).filter(([, grupoId]) => !!grupoId).map(([userId, grupoId]) => ({ user_id: Number(userId), grupo_id: Number(grupoId) }))
    if (entries.length === 0) {
      toast.error('No hay cambios para guardar')
      return
    }
    try {
      const resp = await organizarListasService.asignarGrupos(entries)
      if (resp.success) {
        toast.success(resp.message || 'Operación exitosa')
        await loadData()
      } else {
        toast.error('No se pudo guardar')
      }
    } catch (error: any) {
      const msg = error?.data?.message || 'Error al guardar cambios'
      toast.error(msg)
    }
  }

  const handleExportPdf = async () => {
    try {
      setPdfLoading(true)
      const blob = await organizarListasService.exportAlumnosPdf({ periodo_lectivo_id: selectedPeriodo || undefined, grado_id: selectedGrado || undefined, turno_id: selectedTurno || undefined })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF generado')
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al generar el PDF. Intente nuevamente.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      setCsvLoading(true)
      const blob = await organizarListasService.exportAlumnosCsv({ periodo_lectivo_id: selectedPeriodo || undefined, grado_id: selectedGrado || undefined, turno_id: selectedTurno || undefined })
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'lista_alumnos.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('CSV generado')
    } catch (error: any) {
      toast.error('Error al exportar CSV')
    } finally {
      setCsvLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Organizar Listas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleccione filtros y asigne grupos a alumnos
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={9}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Período Lectivo</InputLabel>
                    <Select value={selectedPeriodo} onChange={(e) => { setSelectedPeriodo(e.target.value as number | ''); setAlumnos([]); setGrupos([]); setAsignaciones({}) }} label="Período Lectivo" disabled={loadingCatalogos} size="small">
                      <MenuItem value="">Seleccione un período</MenuItem>
                      {periodos.map(p => (<MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Grado</InputLabel>
                    <Select value={selectedGrado} onChange={(e) => { setSelectedGrado(e.target.value as number | ''); setAlumnos([]); setGrupos([]); setAsignaciones({}) }} label="Grado" disabled={loadingCatalogos} size="small">
                      <MenuItem value="">Todos</MenuItem>
                      {grados.map(g => (<MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Turno</InputLabel>
                    <Select value={selectedTurno} onChange={(e) => { setSelectedTurno(e.target.value as number | ''); setAlumnos([]); setGrupos([]); setAsignaciones({}) }} label="Turno" disabled={loadingCatalogos} size="small">
                      <MenuItem value="">Todos</MenuItem>
                      {turnos.map(t => (<MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { setSelectedPeriodo(''); setSelectedGrado(''); setSelectedTurno(''); setAlumnos([]); setGrupos([]); setAsignaciones({}) }} disabled={loadingData} fullWidth>
                  Limpiar
                </Button>
                <Button variant="contained" onClick={loadData} disabled={!selectedPeriodo || loadingData} fullWidth>
                  Buscar
                </Button>
                <Button variant="contained" color="secondary" startIcon={pdfLoading ? <CircularProgress size={20} /> : <PdfIcon />} onClick={handleExportPdf} disabled={!selectedPeriodo || loadingData || pdfLoading} fullWidth>
                  {pdfLoading ? 'Generando...' : 'Generar PDF'}
                </Button>
                <Button variant="outlined" color="primary" startIcon={csvLoading ? <CircularProgress size={20} /> : <CsvIcon />} onClick={handleExportCsv} disabled={!selectedPeriodo || loadingData || csvLoading} fullWidth>
                  {csvLoading ? 'Generando...' : 'Exportar CSV'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loadingData && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Cargando datos...
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loadingData && alumnos.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Lista de Alumnos</Typography>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleGuardar} disabled={Object.keys(asignaciones).length === 0}>Guardar cambios</Button>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Sexo</TableCell>
                    <TableCell>Grupo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alumnos.map(al => (
                    <TableRow key={al.user_id}>
                      <TableCell>{al.nombre_completo}</TableCell>
                      <TableCell>{al.sexo}</TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select value={asignaciones[al.user_id] ?? (al as any).grupo_id ?? ''} onChange={(e) => setAsignaciones(prev => ({ ...prev, [al.user_id]: e.target.value as number }))} displayEmpty>
                            <MenuItem value="">Sin grupo</MenuItem>
                            {grupos.map(g => (
                              <MenuItem key={g.id} value={g.id}>{`${g.grado} ${g.seccion} - ${g.turno}`}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {!loadingData && selectedPeriodo && alumnos.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">No hay alumnos para los filtros seleccionados</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
