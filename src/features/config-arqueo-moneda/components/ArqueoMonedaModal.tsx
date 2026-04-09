'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material'
import { toast } from 'react-hot-toast'
import arqueoMonedaService from '../services/arqueoMonedaService'
import type { ConfigArqueoMoneda, CreateArqueoMonedaRequest } from '../types'

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  item?: ConfigArqueoMoneda
  onClose: () => void
  onSuccess: () => void
}

export default function ArqueoMonedaModal({ open, mode, item, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateArqueoMonedaRequest>({ moneda: false, denominacion: '', multiplicador: 1, orden: 1 })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        setForm({ moneda: !!item.moneda, denominacion: item.denominacion, multiplicador: item.multiplicador, orden: item.orden })
      } else {
        setForm({ moneda: false, denominacion: '', multiplicador: 1, orden: 1 })
      }
    }
  }, [open, mode, item])

  const handleChange = (field: keyof CreateArqueoMonedaRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.denominacion.trim()) {
      toast.error('Ingrese la denominación')
      return
    }
    try {
      setLoading(true)
      if (mode === 'create') {
        const resp = await arqueoMonedaService.create(form)
        if (resp.success) toast.success(resp.message || 'Creado exitosamente')
      } else if (item) {
        const resp = await arqueoMonedaService.update(item.id, form)
        if (resp.success) toast.success(resp.message || 'Actualizado exitosamente')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      const msg = error?.data?.message || 'Error al guardar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Nueva Denominación' : 'Editar Denominación'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Moneda</InputLabel>
              <Select value={form.moneda ? 1 : 0} label="Moneda" onChange={e => handleChange('moneda', Number(e.target.value) === 1)}>
                <MenuItem value={0}>Córdobas (C$)</MenuItem>
                <MenuItem value={1}>Dólares (US$)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Denominación" value={form.denominacion} onChange={e => handleChange('denominacion', e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Multiplicador" type="number" inputProps={{ step: '0.01' }} value={form.multiplicador} onChange={e => handleChange('multiplicador', Number(e.target.value))} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Orden" type="number" value={form.orden} onChange={e => handleChange('orden', Number(e.target.value))} fullWidth size="small" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : undefined}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </DialogActions>
    </Dialog>
  )
}

