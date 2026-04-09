'use client'

import { Description as DescriptionIcon, AttachMoney as MoneyIcon, Numbers as NumbersIcon } from '@mui/icons-material'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, TextField } from '@mui/material'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import type { ReciboDetalleRequest } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (detalle: ReciboDetalleRequest) => void
}

const CustomConceptModal: React.FC<Props> = ({ open, onClose, onAdd }) => {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [cantidad, setCantidad] = useState('1')

  const handleAdd = () => {
    if (!concepto.trim()) {
      toast.error('El concepto es requerido')
      return
    }
    const montoVal = parseFloat(monto)
    if (isNaN(montoVal) || montoVal < 0) {
      toast.error('Monto inválido')
      return
    }
    const cantVal = parseFloat(cantidad)
    if (isNaN(cantVal) || cantVal <= 0) {
      toast.error('Cantidad inválida')
      return
    }

    onAdd({
      concepto: concepto.trim(),
      cantidad: cantVal,
      monto: montoVal,
      tipo_pago: 'total',
      // No rubro_id nor aranceles_id nor producto_id
    })
    
    // Reset and close
    setConcepto('')
    setMonto('')
    setCantidad('1')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Concepto Personalizado</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              fullWidth
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Monto Unitario"
              type="number"
              fullWidth
              value={monto}
              onChange={e => setMonto(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Cantidad"
              type="number"
              fullWidth
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NumbersIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleAdd} variant="contained" disabled={!concepto || !monto}>
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CustomConceptModal
