'use client'

import configParametrosService from '@/features/config-parametros/services/configParametrosService'
import { usePermissions } from '@/hooks/usePermissions'
import { Print as PrintIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { arqueoCajaService } from '../services/arqueoCajaService'
import type { ArqueoRecord, GuardarDetalle, GuardarRequest, MonedaDenominacion, ResumenItem } from '../types'

export default function ArqueoCajaPage() {
  const { hasPermission } = usePermissions()

  const [fecha, setFecha] = useState<string>('')
  const [tasacambio, setTasacambio] = useState<number>(0)
  const [resumen, setResumen] = useState<ResumenItem[]>([])
  const [monedasCordoba, setMonedasCordoba] = useState<MonedaDenominacion[]>([])
  const [monedasDolar, setMonedasDolar] = useState<MonedaDenominacion[]>([])
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [tab, setTab] = useState<'dolar' | 'cordoba'>('dolar')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [savedArqueo, setSavedArqueo] = useState<ArqueoRecord | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [monedasResp, parametros] = await Promise.all([
          arqueoCajaService.getMonedas(),
          configParametrosService.getParametros().catch(() => ({} as any))
        ])
        const monedas = monedasResp?.data || { cordoba: [], dolar: [] }
        setMonedasCordoba((monedas.cordoba || []).sort((a, b) => a.orden - b.orden))
        setMonedasDolar((monedas.dolar || []).sort((a, b) => a.orden - b.orden))
        const tasa = Number((parametros as any)?.tasa_cambio_dolar) || 0
        if (tasa > 0) setTasacambio(tasa)
      } catch (err: any) {
        toast.error('Error al cargar configuración de monedas')
      }
    })()
  }, [])

  const handleAceptar = async () => {
    try {
      setLoading(true)
      const resp = await arqueoCajaService.getResumen({ fecha: fecha || undefined })
      setResumen(resp?.data?.detalles || [])

      const saved = resp?.data?.saved_arqueo
      if (saved) {
        setSavedArqueo(saved)
        if (saved.tasacambio) setTasacambio(saved.tasacambio)
        
        const newCantidades: Record<number, number> = {}
        saved.detalles.forEach((d) => {
          newCantidades[d.moneda_id] = d.cantidad
        })
        setCantidades(newCantidades)
        toast.success('Resumen y arqueo guardado cargados')
      } else {
        setSavedArqueo(null)
        setCantidades({})
        toast.success('Resumen obtenido')
      }
    } catch (err: any) {
      const msg = err?.data?.message || 'Error al obtener el resumen'
      toast.error(msg)
      setResumen([])
      setSavedArqueo(null)
      setCantidades({})
    } finally {
      setLoading(false)
    }
  }

  const setCantidad = (id: number, value: number) => {
    setCantidades(prev => ({ ...prev, [id]: value }))
  }

  const totalDolar = useMemo(() => {
    return monedasDolar.reduce((sum, m) => sum + ((cantidades[m.id] || 0) * m.multiplicador), 0)
  }, [cantidades, monedasDolar])

  const totalCordoba = useMemo(() => {
    return monedasCordoba.reduce((sum, m) => sum + ((cantidades[m.id] || 0) * m.multiplicador), 0)
  }, [cantidades, monedasCordoba])

  const totalArqueoC = useMemo(() => {
    return totalCordoba + (totalDolar * (tasacambio || 0))
  }, [totalCordoba, totalDolar, tasacambio])

  const totalEfectivoCordobizado = useMemo(() => {
    return resumen.reduce((sum, item) => {
      const nombre = (item.nombre || '').toUpperCase()
      const monto = Number(item.total) || 0
      if (nombre.includes('EFECTIVO')) {
        // Priorizar detección de Córdobas (C$)
        if (nombre.includes('C$') || nombre.includes('CÓRDOBA') || nombre.includes('CORDOBA')) {
          return sum + monto
        }
        // Detectar Dólares ($ sin C, o palabras clave)
        if (nombre.includes('$') || nombre.includes('DOLAR') || nombre.includes('DÓLAR') || nombre.includes('US')) {
          return sum + (monto * (tasacambio || 0))
        }
        return sum + monto
      }
      return sum
    }, 0)
  }, [resumen, tasacambio])

  const formatNumber = (v: number) => new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)

  const buildDetalles = (): GuardarDetalle[] => {
    const all = [...monedasCordoba, ...monedasDolar]
    return all
      .map(m => ({ moneda_id: m.id, cantidad: Number(cantidades[m.id] || 0) }))
      .filter(d => d.cantidad > 0)
  }

  const handleGuardar = async () => {
    try {
      const detalles = buildDetalles()
      if (!fecha) {
        toast.error('Debe especificar la fecha')
        return
      }
      if (!tasacambio || tasacambio <= 0) {
        toast.error('Debe especificar la tasa de cambio')
        return
      }
      if (detalles.length < 1) {
        toast.error('Debe ingresar al menos una cantidad')
        return
      }

      setSaving(true)
      const payload: GuardarRequest = { fecha, tasacambio, detalles }
      const resp = await arqueoCajaService.guardar(payload)
      const data = resp?.data?.arqueo
      setSavedArqueo(data || null)
      toast.success('Arqueo guardado')
    } catch (err: any) {
      if (err.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const errors = err?.data?.errors
      if (errors) {
        const firstField = Object.keys(errors)[0]
        const firstMsg = (errors[firstField] || [])[0] || err?.data?.message
        toast.error(firstMsg || 'Error de validación')
      } else {
        toast.error(err?.data?.message || 'Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = async () => {
    try {
      if (!savedArqueo?.id) {
        toast.error('Debe guardar el arqueo antes de imprimir')
        return
      }
      setPrintLoading(true)
      const blob = await arqueoCajaService.imprimirDetallesPdf(savedArqueo.id)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al generar el PDF. Intente nuevamente.')
    } finally {
      setPrintLoading(false)
    }
  }

  const renderDenominaciones = (items: MonedaDenominacion[]) => (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Denominación</strong></TableCell>
            <TableCell align="center"><strong>Cantidad</strong></TableCell>
            <TableCell align="right"><strong>Total</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(m => {
            const cant = cantidades[m.id] || 0
            const total = cant * m.multiplicador
            return (
              <TableRow key={m.id}>
                <TableCell>{m.denominacion}</TableCell>
                <TableCell align="center">
                  <TextField
                    size="small"
                    type="number"
                    value={cant}
                    onChange={e => setCantidad(m.id, Math.max(0, Number(e.target.value)))}
                    inputProps={{ min: 0 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Chip label={formatNumber(total)} size="small" color="primary" />
                </TableCell>
              </TableRow>
            )
          })}
          <TableRow>
            <TableCell colSpan={2}><strong>Total</strong></TableCell>
            <TableCell align="right">
              <Chip label={formatNumber(items === monedasDolar ? totalDolar : totalCordoba)} size="small" color="secondary" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Arqueo de Caja</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField label="Fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAceptar} disabled={loading}>{loading ? <CircularProgress size={20} /> : 'Aceptar'}</Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Forma de pago</Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Forma de Pago</strong></TableCell>
                        <TableCell align="right"><strong>Monto</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resumen.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{r.nombre}</TableCell>
                          <TableCell align="right">{formatNumber(Number(r.total) || 0)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell><strong>Total General Efectivo (C$)</strong></TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            {formatNumber(totalEfectivoCordobizado)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{ mt: 3 }}>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 2 }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Córdobas</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">{formatNumber(totalCordoba)}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Total Dólares</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">{formatNumber(totalDolar)}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell><strong>Total Arqueo (C$)</strong></TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            {formatNumber(totalArqueoC)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <TextField 
                  label="Tasa de cambio" 
                  type="number" 
                  value={tasacambio} 
                  onChange={e => setTasacambio(Number(e.target.value))} 
                  size="small" 
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Instrucciones</Typography>
                <Typography variant="body2">1. Digite la cantidad en la denominación que corresponde</Typography>
                <Typography variant="body2">2. Hacer clic en el botón Guardar</Typography>
              </Box>

              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
                <Tab value="dolar" label="Denominación en Dólar" />
                <Tab value="cordoba" label="Denominación en Córdoba" />
              </Tabs>

              {tab === 'dolar' && renderDenominaciones(monedasDolar)}
              {tab === 'cordoba' && renderDenominaciones(monedasCordoba)}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {hasPermission('arqueo_caja') && (
                  <Button variant="contained" startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />} onClick={handleGuardar} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                )}
                <Button variant="outlined" startIcon={printLoading ? <CircularProgress size={20} /> : <PrintIcon />} onClick={handleImprimir} disabled={printLoading || !savedArqueo?.id}>
                  {printLoading ? 'Generando...' : 'Imprimir'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
