'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { Delete as DeleteIcon, Paid as PaidIcon, PictureAsPdf as PdfIcon, Person as PersonIcon, ReceiptLong as ReceiptIcon, Search as SearchIcon } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, Grid, IconButton, InputAdornment, InputLabel, Menu, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import AlumnoSearchModal from '../components/AlumnoSearchModal'
import ArancelesSearchModal from '../components/ArancelesSearchModal'
import CustomConceptModal from '../components/CustomConceptModal'
import FormasPagoModal from '../components/FormasPagoModal'
import PendingArancelesModal from '../components/PendingArancelesModal'
import ProductosSearchModal from '../components/ProductosSearchModal'
import recibosService from '../services/recibosService'
import type { Alumno, ReciboDetalleRequest } from '../types'

const RecibosPage: React.FC = () => {
  const { hasPermission } = usePermissions()
  const searchParams = useSearchParams()
  const canView = hasPermission('recibos.index')

  const [numeroRecibo, setNumeroRecibo] = useState('')
  const [tipo, setTipo] = useState<'interno' | 'externo'>('interno')
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [detalles, setDetalles] = useState<ReciboDetalleRequest[]>([])
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])

  const [alumnoModal, setAlumnoModal] = useState(false)
  const [pendientesModal, setPendientesModal] = useState(false)
  const [productosModal, setProductosModal] = useState(false)
  const [arancelesModal, setArancelesModal] = useState(false)
  const [customConceptModal, setCustomConceptModal] = useState(false)
  const [formasPagoModal, setFormasPagoModal] = useState(false)
  const [paramLoading, setParamLoading] = useState(false)
  const [conceptoAnchor, setConceptoAnchor] = useState<null | HTMLElement>(null)

  const total = useMemo(() => detalles.reduce((acc, d) => acc + (Number(d.cantidad) * Number(d.monto) - Number(d.descuento || 0)), 0), [detalles])

  const cargarNumeroRecibo = async (nuevoTipo: 'interno' | 'externo') => {
    try {
      setParamLoading(true)
      const resp = await recibosService.getParametrosCaja()
      if ((resp as any)?.success) {
        const data = (resp as any).data || {}
        const valor = nuevoTipo === 'interno' ? (data.consecutivo_recibo_interno ?? '') : (data.consecutivo_recibo_oficial ?? '')
        setNumeroRecibo(String(valor || ''))
      }
    } catch (error: any) {
      // Silencio según reglas
    } finally {
      setParamLoading(false)
    }
  }

  useEffect(() => {
    cargarNumeroRecibo('interno')
  }, [])

  // Cargar alumno desde Query Params (Deep Link)
  useEffect(() => {
    const studentId = searchParams.get('studentId')
    const autoOpen = searchParams.get('autoOpenPendientes')
    
    if (studentId && canView) {
      setParamLoading(true)
      recibosService.searchAlumnos('', 100).then(resp => {
        if (resp.success && resp.data) {
          const match = resp.data.find(a => String(a.id) === String(studentId))
          if (match) {
            setAlumno(match)
            if (match.formato === 'cualitativo') {
                handleTipoChange('interno')
            } else if (match.formato === 'cuantitativo') {
                handleTipoChange('externo')
            }
            if (autoOpen === 'true') {
              setTimeout(() => setPendientesModal(true), 500)
            }
          }
        }
      }).finally(() => setParamLoading(false))
    }
  }, [searchParams, canView])

  useEffect(() => {
    if (alumno) {
        setNombreCliente(`${alumno.primer_nombre} ${alumno.segundo_nombre || ''} ${alumno.primer_apellido} ${alumno.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim())
    } else {
        setNombreCliente('')
    }
  }, [alumno])

  const handleTipoChange = async (value: 'interno' | 'externo') => {
    setTipo(value)
    setTimeout(() => {
      cargarNumeroRecibo(value)
    }, 0)
  }

  const handleAfterSuccess = async () => {
    await cargarNumeroRecibo(tipo)
    setDetalles([])
    setAlumno(null)
    setNombreCliente('')
    setFecha(new Date().toISOString().split('T')[0])
  }

  const handleAddDetalle = (detalle: ReciboDetalleRequest) => {
    const isProducto = typeof detalle.producto_id === 'number' && detalle.producto_id !== undefined
    const isArancel = (typeof detalle.aranceles_id === 'number' && detalle.aranceles_id !== undefined) || (typeof detalle.rubro_id === 'number' && detalle.rubro_id !== undefined)

    if (isProducto) {
      const idx = detalles.findIndex(d => d.producto_id === detalle.producto_id)
      if (idx >= 0) {
        const updated = [...detalles]
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + (detalle.cantidad || 1) }
        setDetalles(updated)
        toast.success('Cantidad del producto actualizada')
        return
      }
    }

    if (isArancel) {
      // Validación de orden_mes: bloquear rubros posteriores si hay anteriores pendientes sin agregar
      if (alumno) {
        const pendList = (alumno as any).arancelesPendientes || (alumno as any).aranceles_pendientes || []
        const toNumber = (v: any) => {
          const n = typeof v === 'string' ? parseInt(v, 10) : v
          return Number.isFinite(n) ? n : undefined
        }
        const match = pendList.find((p: any) => (p.rubro_id && p.rubro_id === detalle.rubro_id) || (p.aranceles_id && p.aranceles_id === detalle.aranceles_id))
        let currentOrden = toNumber(match?.rubro?.orden_mes ?? match?.orden_mes)
        if (typeof currentOrden === 'undefined') {
          currentOrden = toNumber((detalle as any)?.orden_mes)
        }
        if (typeof currentOrden !== 'undefined') {
          const pendientesNoAgregados = pendList.filter((p: any) => {
            const ord = toNumber(p?.rubro?.orden_mes ?? p?.orden_mes)
            const isPend = String(p?.estado || '').toLowerCase() === 'pendiente'
            const yaAgregado = detalles.some(d => (p.rubro_id && d.rubro_id === p.rubro_id) || (p.aranceles_id && d.aranceles_id === p.aranceles_id))
            return typeof ord !== 'undefined' && isPend && !yaAgregado
          })
          const minOrd = pendientesNoAgregados.reduce((min: number | undefined, p: any) => {
            const ord = toNumber(p?.rubro?.orden_mes ?? p?.orden_mes)
            return typeof min === 'undefined' ? ord : Math.min(min, ord as number)
          }, undefined)
          if (typeof minOrd !== 'undefined' && currentOrden > minOrd) {
            toast.error('Debe pagar primero los rubros de meses anteriores')
            return
          }
        }
      }

      const exists = detalles.some(d => (typeof d.aranceles_id === 'number' && d.aranceles_id === detalle.aranceles_id) || (typeof d.rubro_id === 'number' && d.rubro_id === detalle.rubro_id))
      if (exists) {
        toast.error('El arancel ya está agregado en el recibo')
        return
      }
    }

    setDetalles(prev => [...prev, { ...detalle, descuento: 0 }])
    toast.success('Detalle agregado')
  }

  const handleRemoveDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  const resetAll = () => {
    setNumeroRecibo('')
    setTipo('interno')
    setAlumno(null)
    setNombreCliente('')
    setDetalles([])
    setFecha(new Date().toISOString().split('T')[0])
  }

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tienes permisos para ver esta página</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon />
              Recibos
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, py: 1.25, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: 4 }}>
                <PaidIcon sx={{ fontSize: 24 }} />
                <Box sx={{ fontSize: '1rem', fontWeight: 700 }}>Total</Box>
                <Box sx={{ fontSize: '1.25rem', fontWeight: 800 }}>C$ {total.toFixed(2)}</Box>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Número de Recibo"
                value={numeroRecibo}
                onChange={e => setNumeroRecibo(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: paramLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : undefined
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={tipo} label="Tipo" onChange={e => handleTipoChange(e.target.value as any)}>
                    <MenuItem value="interno">Jardín Infantil Los Picapiedras</MenuItem>
                    <MenuItem value="externo">Colegio Balum Botan</MenuItem>
                  </Select>
                </FormControl>
                {paramLoading && <CircularProgress size={18} />}
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                  type="date"
                  label="Fecha"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  InputLabelProps={{
                      shrink: true,
                  }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'start', md: 'end' } }}>
                 <Button variant="contained" size="small" startIcon={<PersonIcon />} onClick={() => setAlumnoModal(true)}>
                  Seleccionar Alumno
                </Button>
                <Button variant="outlined" size="small" startIcon={<PaidIcon />} onClick={(e) => setConceptoAnchor(e.currentTarget)}>
                  Concepto
                </Button>
                <Menu
                  anchorEl={conceptoAnchor}
                  open={Boolean(conceptoAnchor)}
                  onClose={() => setConceptoAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  <MenuItem onClick={() => { setConceptoAnchor(null); setPendientesModal(true) }} disabled={!alumno}>Rubros Pendientes</MenuItem>
                  <MenuItem onClick={() => { setConceptoAnchor(null); setProductosModal(true) }}>Agregar Producto</MenuItem>
                  <MenuItem onClick={() => { setConceptoAnchor(null); setArancelesModal(true) }}>Agregar Arancel</MenuItem>
                  <MenuItem onClick={() => { setConceptoAnchor(null); setCustomConceptModal(true) }}>Concepto Personalizado</MenuItem>
                </Menu>
              </Box>
            </Grid>
          </Grid>
          
           <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField 
                    label="Nombre del Cliente" 
                    size="small" 
                    fullWidth 
                    value={nombreCliente} 
                    onChange={(e) => !alumno && setNombreCliente(e.target.value)}
                    disabled={!!alumno}
                />
                 {alumno && (
                    <Button variant="outlined" color="warning" size="small" onClick={() => { setAlumno(null); setNombreCliente(''); }}>
                        Limpiar
                    </Button>
                 )}
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Descuento</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No hay detalles agregados
                    </TableCell>
                  </TableRow>
                ) : (
                  detalles.map((d, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{d.concepto}</TableCell>
                      <TableCell>{d.cantidad}</TableCell>
                      <TableCell>{(typeof (d as any).monto === 'number' ? (d as any).monto : parseFloat(String((d as any).monto || 0))).toFixed(2)}</TableCell>
                      <TableCell>
                         <TextField
                            size="small"
                            type="number"
                            value={d.descuento || 0}
                            disabled={typeof d.rubro_id !== 'undefined' && d.rubro_id !== null}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value)
                              if (val < 0) return
                              
                              const subtotal = Number(d.cantidad) * (typeof (d as any).monto === 'number' ? (d as any).monto : parseFloat(String((d as any).monto || 0)))
                              if (val > subtotal) {
                                toast.error(`El descuento no puede ser mayor al monto (${subtotal.toFixed(2)})`)
                                return
                              }

                              const updated = [...detalles]
                              updated[idx] = { ...updated[idx], descuento: isNaN(val) ? 0 : val }
                              setDetalles(updated)
                            }}
                            InputProps={{ inputProps: { min: 0 } }}
                            sx={{ width: 100 }}
                         />
                      </TableCell>
                      <TableCell>{((Number(d.cantidad) * (typeof (d as any).monto === 'number' ? (d as any).monto : parseFloat(String((d as any).monto || 0)))) - Number(d.descuento || 0)).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => handleRemoveDetalle(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button variant="outlined" onClick={resetAll}>Limpiar</Button>
            <Button variant="contained" startIcon={<PdfIcon />} onClick={() => setFormasPagoModal(true)} disabled={(!alumno && !nombreCliente.trim()) || !numeroRecibo || detalles.length === 0}>
              Crear
            </Button>
          </Box>

          <AlumnoSearchModal
            open={alumnoModal}
            onClose={() => setAlumnoModal(false)}
            onSelect={(al) => {
              setAlumno(al)
              if (al.formato === 'cualitativo') {
                handleTipoChange('interno')
              } else if (al.formato === 'cuantitativo') {
                handleTipoChange('externo')
              }
            }}
          />

          <PendingArancelesModal
            open={pendientesModal}
            alumno={alumno}
            onClose={() => setPendientesModal(false)}
            onAdd={handleAddDetalle}
            detalles={detalles}
          />

          <ProductosSearchModal
            open={productosModal}
            onClose={() => setProductosModal(false)}
            onAdd={handleAddDetalle}
          />

          <ArancelesSearchModal
            open={arancelesModal}
            onClose={() => setArancelesModal(false)}
            onAdd={handleAddDetalle}
          />

          <CustomConceptModal
            open={customConceptModal}
            onClose={() => setCustomConceptModal(false)}
            onAdd={handleAddDetalle}
          />

          <FormasPagoModal
            open={formasPagoModal}
            onClose={() => setFormasPagoModal(false)}
            alumno={alumno}
            nombreCliente={nombreCliente}
            numeroRecibo={numeroRecibo}
            tipo={tipo}
            detalles={detalles}
            onSuccess={handleAfterSuccess}
            fecha={fecha}
          />

        </CardContent>
      </Card>
    </Box>
  )
}

export default RecibosPage
