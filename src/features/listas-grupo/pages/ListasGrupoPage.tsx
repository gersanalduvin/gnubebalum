'use client'

import { Download as DownloadIcon, Description as ExcelIcon, Groups as GroupsIcon, Print as PrintIcon } from '@mui/icons-material'
import { Box, Button, Card, CardContent, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { listasGrupoService } from '../services/listasGrupoService'
import type { Grupo, PeriodoLectivo, Turno } from '../types'

export default function ListasGrupoPage() {
  const [periodos, setPeriodos] = useState<PeriodoLectivo[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedTurno, setSelectedTurno] = useState<number | ''>('')
  const [selectedGrupo, setSelectedGrupo] = useState<number | ''>('')
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [printLoading, setPrintLoading] = useState(false) // Was pdfLoading
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadCatalogos()
    }
  }, [])

  const loadCatalogos = async (filters?: { periodo_lectivo_id?: number; turno_id?: number }) => {
    try {
      setLoadingCatalogos(true)
      const data = await listasGrupoService.getCatalogos(filters || {})
      setPeriodos(data.periodos_lectivos)
      setTurnos(data.turnos)
      setGrupos(data.grupos)
    } catch (error: any) {
      const msg = error?.data?.message || 'Error al cargar catálogos'
      toast.error(msg)
    } finally {
      setLoadingCatalogos(false)
    }
  }

  const handlePeriodoChange = async (value: number | '') => {
    setSelectedPeriodo(value)
    setSelectedGrupo('')
    await loadCatalogos({ periodo_lectivo_id: (value as number) || undefined, turno_id: selectedTurno || undefined })
  }

  const handleTurnoChange = async (value: number | '') => {
    setSelectedTurno(value)
    setSelectedGrupo('')
    await loadCatalogos({ periodo_lectivo_id: selectedPeriodo || undefined, turno_id: (value as number) || undefined })
  }

  const handlePrintPdf = async () => {
    try {
      setPrintLoading(true)
      const blob = await listasGrupoService.exportPdf({ periodo_lectivo_id: selectedPeriodo || undefined, grupo_id: selectedGrupo || undefined, turno_id: selectedTurno || undefined })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF generado para impresión')
    } catch (error: any) {
      handlePdfError(error)
    } finally {
      setPrintLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadLoading(true)
      const blob = await listasGrupoService.exportPdf({ periodo_lectivo_id: selectedPeriodo || undefined, grupo_id: selectedGrupo || undefined, turno_id: selectedTurno || undefined })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lista_alumnos_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF descargado')
    } catch (error: any) {
      handlePdfError(error)
    } finally {
      setDownloadLoading(false)
    }
  }

  const handlePdfError = (error: any) => {
    if (error?.status === 401) {
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
      window.location.href = '/auth/login'
      return
    }
    toast.error('Error al generar el PDF. Intente nuevamente.')
  }

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true)
      const blob = await listasGrupoService.exportExcel({ periodo_lectivo_id: selectedPeriodo || undefined, grupo_id: selectedGrupo || undefined })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lista_alumnos_grupo.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('Excel generado')
    } catch (error: any) {
      toast.error('Error al exportar Excel')
    } finally {
      setExcelLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupsIcon />
          Listas por Grupo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleccione período, turno y grupo para generar los reportes
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
                    <Select value={selectedPeriodo} onChange={(e) => handlePeriodoChange(e.target.value as number | '')} label="Período Lectivo" disabled={loadingCatalogos} size="small">
                      <MenuItem value="">Seleccione un período</MenuItem>
                      {periodos.map(p => (<MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Turno</InputLabel>
                    <Select value={selectedTurno} onChange={(e) => handleTurnoChange(e.target.value as number | '')} label="Turno" disabled={loadingCatalogos} size="small">
                      <MenuItem value="">Seleccione un turno</MenuItem>
                      {turnos.map(t => (<MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo</InputLabel>
                    <Select value={selectedGrupo} onChange={(e) => setSelectedGrupo(e.target.value as number | '')} label="Grupo" disabled={loadingCatalogos || !selectedPeriodo} size="small">
                      <MenuItem value="">Seleccione un grupo</MenuItem>
                      <MenuItem value={0}>Todos</MenuItem>
                      {grupos.map(g => (<MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="contained" color="info" startIcon={printLoading ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />} onClick={handlePrintPdf} disabled={!selectedPeriodo || selectedGrupo === '' || printLoading || downloadLoading} fullWidth>
                  {printLoading ? 'Generando...' : 'Imprimir PDF'}
                </Button>
                <Button variant="contained" color="secondary" startIcon={downloadLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />} onClick={handleDownloadPdf} disabled={!selectedPeriodo || selectedGrupo === '' || printLoading || downloadLoading} fullWidth>
                  {downloadLoading ? 'Descargando...' : 'Descargar PDF'}
                </Button>
                <Button variant="outlined" color="primary" startIcon={excelLoading ? <CircularProgress size={20} /> : <ExcelIcon />} onClick={handleExportExcel} disabled={!selectedPeriodo || selectedGrupo === '' || excelLoading} fullWidth>
                  {excelLoading ? 'Generando...' : 'Exportar Excel'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
