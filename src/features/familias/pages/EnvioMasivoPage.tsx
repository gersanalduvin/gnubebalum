'use client'

import { PermissionGuard } from '@/components/PermissionGuard'
import { httpClient } from '@/utils/httpClient'
import { Print as PrintIcon, Refresh as RefreshIcon, Send as SendIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { FamiliasService } from '../services/familiasService'

export default function EnvioMasivoPage() {
  const [periodos, setPeriodos] = useState<any[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('')
  const [reporte, setReporte] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(reporte.map(fam => fam.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (event: React.ChangeEvent<HTMLInputElement>, id: number) => {
    if (event.target.checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  // Fetch Periodos Lectivos for the filter
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const response = await httpClient.get<any>('/bk/v1/config-grupos/opciones/periodos-lectivos')
        const data = Array.isArray(response.data) ? response.data : response?.data?.data || []
        setPeriodos(data)
        if (data.length > 0) {
          // preseleccionar el activo o el primero
          const activo = data.find((p: any) => p.activo)
          setSelectedPeriodo(activo ? String(activo.id) : String(data[0].id))
        }
      } catch (error) {
        toast.error('Error al cargar periodos lectivos')
      }
    }
    fetchPeriodos()
  }, [])

  const handleFetchReporte = async () => {
    setLoading(true)
    try {
      const response = await FamiliasService.reporteCredencialesFamilias(selectedPeriodo)
      if (response.success) {
        setReporte(response.data)
        setSelectedIds([]) // Clear selection when generating a new report
        if (response.data.length === 0) {
          toast.success('No se encontraron familias para este periodo.')
        } else {
          toast.success('Reporte generado correctamente')
        }
      } else {
        toast.error(response.message || 'Error al generar reporte')
      }
    } catch (error: any) {
      toast.error('Ocurrió un error inesperado al listar')
    } finally {
      setLoading(false)
    }
  }

  const handleResetMasivo = async () => {
    setResetLoading(true)
    try {
      const response = await FamiliasService.resetMasivoFamilias(selectedPeriodo, selectedIds)
      if (response.success) {
        toast.success(response.message || 'Correos encolados exitosamente')
        // Automatically fetch report to see the update
        handleFetchReporte()
      } else {
        toast.error(response.message || 'Error al iniciar envío masivo')
      }
    } catch (error: any) {
      toast.error('Ocurrió un error inesperado durante el envío masivo')
    } finally {
      setResetLoading(false)
      setConfirmOpen(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <PermissionGuard permission='usuarios.familias.envio_masivo'>
      <Box
        className='print-container'
        sx={{
          '@media print': {
            '.no-print': { display: 'none !important' },
            '.print-only': { display: 'block !important' },
            padding: 0,
            margin: 0
          }
        }}
      >
        {/* ENCABEZADO OCULTO QUE SOLO SALE AL IMPRIMIR */}
        <Box className='print-only' sx={{ display: 'none', mb: 4, textAlign: 'center' }}>
          <Typography variant='h5' fontWeight='bold'>
            Reporte de Credenciales de Familias
          </Typography>
          <Typography variant='subtitle1'>
            Periodo Lectivo: {periodos.find(p => String(p.id) === selectedPeriodo)?.nombre || 'Todos'}
          </Typography>
        </Box>

        <Card className='no-print' sx={{ mb: 4 }}>
          <CardHeader title='Envío Masivo de Credenciales a Familias' />
          <CardContent>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Periodo Lectivo</InputLabel>
                  <Select
                    value={selectedPeriodo}
                    label='Periodo Lectivo'
                    onChange={e => setSelectedPeriodo(e.target.value)}
                  >
                    <MenuItem value=''>
                      <em>Todos los periodos</em>
                    </MenuItem>
                    {periodos.map(p => (
                      <MenuItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={8} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleFetchReporte} disabled={loading}>
                  Generar Reporte
                </Button>

                <Button
                  variant='contained'
                  color='error'
                  startIcon={<SendIcon />}
                  onClick={() => setConfirmOpen(true)}
                  disabled={loading || resetLoading || reporte.length === 0}
                >
                  {selectedIds.length > 0 ? `Resetear y Enviar (${selectedIds.length})` : 'Resetear y Enviar Todos'}
                </Button>

                <Button
                  variant='contained'
                  color='secondary'
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={reporte.length === 0}
                >
                  Imprimir
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card
          sx={{
            '@media print': {
              boxShadow: 'none',
              border: 'none',
              '& .MuiCardContent-root': { padding: 0 }
            }
          }}
        >
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : reporte.length > 0 ? (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: '1px solid #e0e0e0', '@media print': { border: 'none' } }}
              >
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell padding='checkbox' className='no-print'>
                        <Checkbox
                          indeterminate={selectedIds.length > 0 && selectedIds.length < reporte.length}
                          checked={reporte.length > 0 && selectedIds.length === reporte.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>
                        <strong>Familia</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Correo Institucional</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Alumnos / Grados</strong>
                      </TableCell>
                      <TableCell align='right'>
                        <strong>Acción Pendiente</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporte.map(fam => (
                      <TableRow key={fam.id}>
                        <TableCell padding='checkbox' className='no-print'>
                          <Checkbox checked={selectedIds.includes(fam.id)} onChange={e => handleSelectOne(e, fam.id)} />
                        </TableCell>
                        <TableCell>{fam.nombre_familia}</TableCell>
                        <TableCell>{fam.email}</TableCell>
                        <TableCell>
                          {fam.hijos && fam.hijos.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                              {fam.hijos.map((h: any) => (
                                <li key={h.id}>
                                  {h.nombre_completo}{' '}
                                  <Typography variant='caption' color='textSecondary'>
                                    ({h.ubicacion})
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Typography variant='caption' color='error'>
                              Sin estudiantes matriculados
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Box
                            sx={{
                              backgroundColor: '#fff4e5',
                              color: '#663c00',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}
                          >
                            Pendiente Actualizar
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color='textSecondary'>
                  No hay datos para mostrar. Seleccione un periodo y genere el reporte.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Modal Confirmación Reset Masivo */}
        <Dialog open={confirmOpen} onClose={() => !resetLoading && setConfirmOpen(false)} className='no-print'>
          <DialogTitle>Confirmar Envío Masivo</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Está seguro que desea resetear y enviar las credenciales a{' '}
              <strong>
                {selectedIds.length > 0 ? `${selectedIds.length} familias seleccionadas` : 'TODAS las familias'}
              </strong>{' '}
              que coinciden con el filtro de periodo lectivo seleccionado?
              <br />
              <br />
              Esta acción generará nuevas contraseñas y las enviará a través del servicio de correo.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={resetLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleResetMasivo}
              color='error'
              variant='contained'
              disabled={resetLoading}
              startIcon={resetLoading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              Sí, Resetear y Enviar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  )
}
