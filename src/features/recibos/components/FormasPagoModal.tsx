'use client'

import { AttachMoney as MoneyIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material'
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, List, ListItem, ListItemText, TextField } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import recibosService from '../services/recibosService'
import type { Alumno, FormaPagoCatalogo, FormaPagoEntry, ReciboDetalleRequest } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  alumno: Alumno | null
  nombreCliente?: string
  numeroRecibo: string
  tipo: 'interno' | 'externo'
  detalles: ReciboDetalleRequest[]
  onSuccess: () => void
  fecha: string
}

const FormasPagoModal: React.FC<Props> = ({ open, onClose, alumno, nombreCliente, numeroRecibo, tipo, detalles, onSuccess, fecha }) => {
  const [loading, setLoading] = useState(false)
  const [catalogo, setCatalogo] = useState<FormaPagoCatalogo[]>([])
  const [montos, setMontos] = useState<Record<number, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [tasaCambio, setTasaCambio] = useState<number>(0)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const total = useMemo(() => detalles.reduce((acc, d) => acc + (d.cantidad * d.monto) - (d.descuento || 0), 0), [detalles])

  useEffect(() => {
    if (open) {
      setError(null)
      setMontos({})
      loadCatalogo()
      loadParametros()
    }
  }, [open])

  useEffect(() => {
    if (open && catalogo.length > 0) {
      setTimeout(() => {
        const firstId = catalogo[0]?.id
        if (firstId && inputRefs.current[firstId]) {
          inputRefs.current[firstId]?.focus()
        }
      }, 100)
    }
  }, [open, catalogo])

  const loadCatalogo = async () => {
    try {
      const response = await recibosService.getFormasPago()
      if ((response as any).success) {
        setCatalogo((response as any).data || [])
      } else {
        toast.error((response as any).message || 'Error al cargar formas de pago')
        setCatalogo([])
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al cargar formas de pago')
      setCatalogo([])
    }
  }

  const loadParametros = async () => {
    try {
      const resp = await recibosService.getParametrosCaja()
      if ((resp as any)?.success) {
        const data = (resp as any).data || {}
        const fromKeys = (obj: any, keys: string[]): number => {
          for (const k of keys) {
            const v = obj?.[k]
            const n = Number(v)
            if (Number.isFinite(n) && n > 0) return n
          }
          return 0
        }
        let tasa = fromKeys(data, ['tasa_cambio_dolar', 'tasa_cambio', 'tasaCambio', 'tasa_dolar', 'tasa_usd', 'tasa', 'tc'])
        if (!tasa && typeof data.parametros === 'object') {
          tasa = fromKeys(data.parametros, ['tasa_cambio_dolar', 'tasa_cambio', 'tasaCambio', 'tasa_dolar', 'tasa_usd', 'tasa', 'tc'])
        }
        setTasaCambio(Number.isFinite(tasa) && tasa > 0 ? tasa : 0)
      }
    } catch {}
  }

  const esFormaPagoUSD = (fp: FormaPagoCatalogo): boolean => {
    const abbr = String((fp as any).abreviatura || '').toUpperCase()
    const name = String((fp as any).nombre || '').toUpperCase()
    const flag = (fp as any).moneda
    if (flag !== undefined && flag !== null) {
      return flag === true || flag === 1
    }
    const txt = `${abbr} ${name}`
    if (/C\$|CORDOBA|CÓRDOBA/.test(txt)) return false
    return /(US\$|USD|DOLAR|DÓLAR)/.test(txt)
  }

  const sumPagosCordoba = () => {
    return Object.entries(montos).reduce((acc, [idStr, val]) => {
      const id = Number(idStr)
      const fp = catalogo.find(f => f.id === id)
      const monto = Number(val) || 0
      if (!fp || monto <= 0) return acc
      const aporteC$ = esFormaPagoUSD(fp) && tasaCambio > 0 ? monto * tasaCambio : monto
      return acc + aporteC$
    }, 0)
  }

  const toCents = (n: number) => Math.round((Number(n) || 0) * 100)
  const totalCents = () => toCents(total)
  const sumaCents = () => toCents(sumPagosCordoba())
  const equalsWithinTolerance = () => Math.abs(totalCents() - sumaCents()) <= 1

  useEffect(() => {
    if (equalsWithinTolerance()) {
      setError(null)
    }
  }, [montos, catalogo, tasaCambio, detalles, total])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      const nextId = catalogo[index + 1]?.id
      if (nextId && inputRefs.current[nextId]) {
        inputRefs.current[nextId]?.focus()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevId = catalogo[index - 1]?.id
      if (prevId && inputRefs.current[prevId]) {
        inputRefs.current[prevId]?.focus()
      }
    }
  }

  const handleImprimir = async () => {
    if (!alumno && !nombreCliente) return
    setLoading(true)
    setError(null)
    try {
      const formas_pago: FormaPagoEntry[] = Object.entries(montos)
        .filter(([_, v]) => Number(v) > 0)
        .map(([k, v]) => ({ forma_pago_id: Number(k), monto: Number(v) }))

      const diffCents = totalCents() - sumaCents()
      if (Math.abs(diffCents) > 1) {
        setError('La suma de formas de pago debe igualar el total')
        return
      }

      const nombreUsuario = alumno
        ? `${alumno.primer_nombre} ${alumno.segundo_nombre || ''} ${alumno.primer_apellido} ${alumno.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()
        : (nombreCliente || 'Cliente General')
      
      const userIdVal = alumno ? alumno.id : null

      const payload = {
        numero_recibo: numeroRecibo,
        tipo,
        user_id: userIdVal,
        fecha,
        nombre_usuario: nombreUsuario,
        grado: alumno?.grado || 'N/A',
        seccion: alumno?.seccion || 'N/A',
        detalles,
        formas_pago
      }

      const createResponse = await recibosService.createRecibo(payload)
      if ((createResponse as any).success) {
        const id = (createResponse as any).data?.id
        const pdfResponse = await recibosService.imprimirPDF(id)
        if ((pdfResponse as any).data) {
          const blob = (pdfResponse as any).data as Blob
          const url = window.URL.createObjectURL(blob)
          window.open(url, '_blank')
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 1000)
          toast.success('Recibo creado e impresión preparada')
          setMontos({})
          onSuccess()
          onClose()
        } else {
          toast.error((pdfResponse as any).message || 'Error al generar el PDF')
        }
      } else {
        const err = createResponse as any
        if (err.errors) {
          const msgs = Object.values(err.errors).flat().join('. ')
          toast.error(msgs || err.message || 'Errores de validación')
          setError(msgs || err.message || 'Errores de validación')
        } else {
          toast.error(err.message || 'Error al crear el recibo')
          setError(err.message || 'Error al crear el recibo')
        }
      }
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
      } else {
        toast.error('Error al generar el PDF. Intente nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Detalle de pago
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ fontWeight: 700, fontSize: '1.25rem' }}>TOTAL A PAGAR</Box>
          <Alert severity="info" sx={{ m: 0, p: '8px 14px', fontSize: '1.25rem', fontWeight: 700 }}>C$ {total.toFixed(2)}</Alert>
        </Box>

        <List dense>
          {catalogo.map((fp, index) => (
            <ListItem key={fp.id}>
              <ListItemText primary={`${fp.abreviatura || fp.nombre}${esFormaPagoUSD(fp) ? ' (US$)' : ' (C$)'}`} />
              <Box sx={{ minWidth: 160 }}>
                <TextField
                  inputRef={(el) => (inputRefs.current[fp.id] = el)}
                  type="number"
                  size="small"
                  value={montos[fp.id] ?? 0}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onChange={e => setMontos(prev => ({ ...prev, [fp.id]: parseFloat(e.target.value || '0') }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ fontWeight: 700, fontSize: '1.25rem' }}>SALDO PENDIENTE</Box>
          {(() => {
            const rawDiff = totalCents() - sumaCents()
            const saldoCents = Math.max(0, rawDiff)
            const saldoC = saldoCents / 100
            return (
              <Alert severity={saldoCents > 0 ? 'warning' : 'success'} sx={{ m: 0, p: '8px 14px', fontSize: '1.25rem', fontWeight: 700 }}>C$ {saldoC.toFixed(2)}</Alert>
            )
          })()}
        </Box>

        {(() => {
          const saldoCents = Math.max(0, totalCents() - sumaCents())
          return saldoCents > 1 ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning">Complete el pago para continuar</Alert>
            </Box>
          ) : null
        })()}
        {error && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cerrar</Button>
        <Button variant="contained" startIcon={loading ? <CircularProgress size={16} /> : <PdfIcon />} onClick={handleImprimir} disabled={loading || (!alumno && !nombreCliente) || !numeroRecibo || detalles.length === 0 || Math.abs(totalCents() - sumaCents()) > 1}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormasPagoModal
