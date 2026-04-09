'use client'

import React, { useEffect, useRef, useState } from 'react'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'

import { PictureAsPdf as PdfIcon, CalendarToday as CalendarIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import { reporteNuevoIngresoService } from '../services/reporteNuevoIngresoService'
import type { PeriodoLectivo } from '@/features/reporte-matricula/types'

export default function ReporteNuevoIngresoPage() {
  const [periodosLectivos, setPeriodosLectivos] = useState<PeriodoLectivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [loadingPeriodos, setLoadingPeriodos] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadPeriodosLectivos()
    }
  }, [])

  const loadPeriodosLectivos = async () => {
    try {
      setLoadingPeriodos(true)
      const periodos = await reporteNuevoIngresoService.getPeriodosLectivos()
      setPeriodosLectivos(periodos)
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Error al cargar los períodos lectivos'
      toast.error(errorMessage)
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const handleVisualizarPdf = async () => {
    if (!selectedPeriodo) {
      toast.error('Debe seleccionar un período lectivo')
      return
    }

    try {
      setExportLoading(true)
      const blob = await reporteNuevoIngresoService.exportPdf(selectedPeriodo as number)
      const url = window.URL.createObjectURL(blob)

      window.open(url, '_blank')

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)

      toast.success('PDF generado correctamente')
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al generar el PDF. Intente nuevamente.'
      toast.error(message)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon />
          Alumnos Nuevo Ingreso
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleccione un período lectivo y visualice el reporte en PDF
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={9}>
              <FormControl fullWidth>
                <InputLabel>Período Lectivo</InputLabel>
                <Select
                  value={selectedPeriodo}
                  onChange={(e) => setSelectedPeriodo(e.target.value as number | '')}
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

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={exportLoading ? <CircularProgress size={20} /> : <PdfIcon />}
                  onClick={handleVisualizarPdf}
                  disabled={!selectedPeriodo || exportLoading}
                  fullWidth
                >
                  {exportLoading ? 'Generando...' : 'Visualizar PDF'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}