'use client'
import { useEffect, useState } from 'react'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material'

import type { EscalaDetalle, ValidationErrors } from '../types'

interface Props {
  open: boolean
  detalle?: EscalaDetalle
  onClose: () => void
  onSave: (detalle: EscalaDetalle) => void
  errors?: ValidationErrors
}

const EscalaDetalleModal: React.FC<Props> = ({ open, detalle, onClose, onSave, errors }) => {
  const [form, setForm] = useState<EscalaDetalle>({
    nombre: '',
    abreviatura: '',
    rango_inicio: 0,
    rango_fin: 0,
    orden: 0
  })
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    if (detalle) setForm(detalle)
    else setForm({ nombre: '', abreviatura: '', rango_inicio: 0, rango_fin: 0, orden: 0 })
    setFieldErrors(errors || {})
  }, [detalle, open])

  useEffect(() => {
    setFieldErrors(errors || {})
  }, [errors])

  const handleChange = (field: keyof EscalaDetalle) => (e: any) => {
    const value = ['rango_inicio', 'rango_fin', 'orden'].includes(field as string)
      ? Number(e.target.value)
      : e.target.value
    setForm(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => ({ ...prev, [field as string]: [] }))
    }
  }

  const handleSubmit = () => {
    const newErrors: ValidationErrors = {}
    if (!form.nombre || !String(form.nombre).trim()) {
      newErrors.nombre = ['El nombre es requerido']
    }
    if (!form.abreviatura || !String(form.abreviatura).trim()) {
      newErrors.abreviatura = ['La abreviatura es requerida']
    }
    if (form.rango_inicio === undefined || form.rango_inicio === null || isNaN(Number(form.rango_inicio))) {
      newErrors.rango_inicio = ['El rango inicio es requerido']
    }
    if (form.rango_fin === undefined || form.rango_fin === null || isNaN(Number(form.rango_fin))) {
      newErrors.rango_fin = ['El rango fin es requerido']
    }
    if (Number(form.rango_inicio) > Number(form.rango_fin)) {
      newErrors.rango_inicio = [...(newErrors.rango_inicio || []), 'Debe ser menor o igual al rango fin']
      newErrors.rango_fin = [...(newErrors.rango_fin || []), 'Debe ser mayor o igual al rango inicio']
    }
    if (form.orden === undefined || form.orden === null || isNaN(Number(form.orden)) || Number(form.orden) < 1) {
      newErrors.orden = ['El orden debe ser un número mayor o igual a 1']
    }

    setFieldErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    onSave(form)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{detalle?.id ? 'Editar Detalle' : 'Agregar Detalle'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Nombre'
              value={form.nombre}
              onChange={handleChange('nombre')}
              fullWidth
              size='small'
              error={Boolean(fieldErrors.nombre && fieldErrors.nombre.length > 0)}
              helperText={fieldErrors.nombre?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Abreviatura'
              value={form.abreviatura}
              onChange={handleChange('abreviatura')}
              fullWidth
              size='small'
              error={Boolean(fieldErrors.abreviatura && fieldErrors.abreviatura.length > 0)}
              helperText={fieldErrors.abreviatura?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type='number'
              label='Rango Inicio'
              value={form.rango_inicio}
              onChange={handleChange('rango_inicio')}
              fullWidth
              size='small'
              error={Boolean(fieldErrors.rango_inicio && fieldErrors.rango_inicio.length > 0)}
              helperText={fieldErrors.rango_inicio?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type='number'
              label='Rango Fin'
              value={form.rango_fin}
              onChange={handleChange('rango_fin')}
              fullWidth
              size='small'
              error={Boolean(fieldErrors.rango_fin && fieldErrors.rango_fin.length > 0)}
              helperText={fieldErrors.rango_fin?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type='number'
              label='Orden'
              value={form.orden}
              onChange={handleChange('orden')}
              fullWidth
              size='small'
              error={Boolean(fieldErrors.orden && fieldErrors.orden.length > 0)}
              helperText={fieldErrors.orden?.[0] || ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant='contained' onClick={handleSubmit}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EscalaDetalleModal
