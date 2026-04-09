'use client'
import { useEffect, useMemo, useState } from 'react'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material'

import { formatDateForInput } from '@/utils/string'

import type { Parcial, ValidationErrors } from '../types'

interface Props {
  open: boolean
  parcial?: Parcial
  errors?: {
    nombre?: string[]
    abreviatura?: string[]
    orden?: string[]
    fecha_inicio_corte?: string[]
    fecha_fin_corte?: string[]
    fecha_inicio_publicacion_notas?: string[]
    fecha_fin_publicacion_notas?: string[]
  }
  onClose: () => void
  onSave: (parcial: Parcial) => void
}

const ParcialModal: React.FC<Props> = ({ open, parcial, errors, onClose, onSave }) => {
  const [nombre, setNombre] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [fechaInicioPub, setFechaInicioPub] = useState('')
  const [fechaFinPub, setFechaFinPub] = useState('')
  const [orden, setOrden] = useState<number>(1)
  const [localErrors, setLocalErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    if (open) {
      setNombre(parcial?.nombre || '')
      setAbreviatura(parcial?.abreviatura || '')
      setFechaInicio(formatDateForInput(parcial?.fecha_inicio_corte || ''))
      setFechaFin(formatDateForInput(parcial?.fecha_fin_corte || ''))
      setFechaInicioPub(formatDateForInput(parcial?.fecha_inicio_publicacion_notas || ''))
      setFechaFinPub(formatDateForInput(parcial?.fecha_fin_publicacion_notas || ''))
      setOrden(parcial?.orden ?? 1)
      setLocalErrors({})
    }
  }, [open, parcial])

  const mergedErrors: ValidationErrors = useMemo(() => {
    const incoming: ValidationErrors = (errors as any) || {}
    return { ...incoming, ...localErrors }
  }, [errors, localErrors])

  const handleSave = () => {
    const errs: ValidationErrors = {}
    const n = nombre.trim()
    const a = abreviatura.trim()
    if (!n) errs.nombre = ['El nombre es requerido']
    if (!a) errs.abreviatura = ['La asignatura es requerida']
    if (!fechaInicio) errs.fecha_inicio_corte = ['La fecha de inicio es requerida']
    if (!fechaFin) errs.fecha_fin_corte = ['La fecha de fin es requerida']
    if (!fechaInicioPub) errs.fecha_inicio_publicacion_notas = ['La publicación inicio es requerida']
    if (!fechaFinPub) errs.fecha_fin_publicacion_notas = ['La publicación fin es requerida']
    if (![1, 2, 3, 4].includes(Number(orden))) {
      errs.orden = ['El orden debe ser 1 (C1), 2 (C2), 3 (C3) o 4 (C4)']
    }

    // Validaciones de orden cronológico
    const toDate = (val: string) => {
      if (!val) return null
      const [y, m, d] = val.split('-').map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m - 1, d)
    }
    const dInicio = toDate(fechaInicio)
    const dFin = toDate(fechaFin)
    const dInicioPub = toDate(fechaInicioPub)
    const dFinPub = toDate(fechaFinPub)

    if (dInicio && dFin && dFin < dInicio) {
      errs.fecha_fin_corte = ['La fecha fin no puede ser menor que inicio']
    }
    if (dInicioPub && dFinPub && dFinPub < dInicioPub) {
      errs.fecha_fin_publicacion_notas = ['La publicación fin no puede ser menor que inicio']
    }
    if (Object.keys(errs).length > 0) {
      setLocalErrors(errs)
      return
    }
    const nuevo: Parcial = {
      id: parcial?.id,
      nombre: n,
      abreviatura: a,
      fecha_inicio_corte: fechaInicio,
      fecha_fin_corte: fechaFin,
      fecha_inicio_publicacion_notas: fechaInicioPub,
      fecha_fin_publicacion_notas: fechaFinPub,
      orden: Number(orden)
    }
    onSave(nuevo)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
      disableAutoFocus={false}
      disableEnforceFocus={false}
      aria-labelledby='parcial-modal-title'
    >
      <DialogTitle id='parcial-modal-title'>{parcial?.id ? 'Editar Parcial' : 'Nuevo Parcial'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Nombre'
              value={nombre}
              onChange={e => {
                setNombre(e.target.value)
                if (mergedErrors?.nombre) setLocalErrors(prev => ({ ...prev, nombre: [] }))
              }}
              fullWidth
              size='small'
              required
              autoFocus
              error={Boolean(mergedErrors?.nombre && mergedErrors?.nombre.length > 0)}
              helperText={mergedErrors?.nombre?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Abreviatura'
              value={abreviatura}
              onChange={e => {
                setAbreviatura(e.target.value)
                if (mergedErrors?.abreviatura) setLocalErrors(prev => ({ ...prev, abreviatura: [] }))
              }}
              fullWidth
              size='small'
              required
              error={Boolean(mergedErrors?.abreviatura && mergedErrors?.abreviatura.length > 0)}
              helperText={mergedErrors?.abreviatura?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label='Orden'
              value={String(orden)}
              onChange={e => {
                setOrden(Number(e.target.value))
                if (mergedErrors?.orden) setLocalErrors(prev => ({ ...prev, orden: [] }))
              }}
              fullWidth
              size='small'
              required
              error={Boolean(mergedErrors?.orden && mergedErrors?.orden.length > 0)}
              helperText={mergedErrors?.orden?.[0] || ''}
            >
              <MenuItem value={'1'}>C1</MenuItem>
              <MenuItem value={'2'}>C2</MenuItem>
              <MenuItem value={'3'}>C3</MenuItem>
              <MenuItem value={'4'}>C4</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Inicio'
              placeholder='dd/mm/aaaa'
              type='date'
              value={fechaInicio}
              onChange={e => {
                setFechaInicio(e.target.value)
                if (mergedErrors?.fecha_inicio_corte) setLocalErrors(prev => ({ ...prev, fecha_inicio_corte: [] }))
              }}
              fullWidth
              size='small'
              required
              error={Boolean(mergedErrors?.fecha_inicio_corte && mergedErrors?.fecha_inicio_corte.length > 0)}
              helperText={mergedErrors?.fecha_inicio_corte?.[0] || ''}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Fin'
              placeholder='dd/mm/aaaa'
              type='date'
              value={fechaFin}
              onChange={e => {
                setFechaFin(e.target.value)
                if (mergedErrors?.fecha_fin_corte) setLocalErrors(prev => ({ ...prev, fecha_fin_corte: [] }))
              }}
              fullWidth
              size='small'
              required
              error={Boolean(mergedErrors?.fecha_fin_corte && mergedErrors?.fecha_fin_corte.length > 0)}
              helperText={mergedErrors?.fecha_fin_corte?.[0] || ''}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Publicación Inicio'
              placeholder='dd/mm/aaaa'
              type='date'
              value={fechaInicioPub}
              onChange={e => {
                setFechaInicioPub(e.target.value)
                if (mergedErrors?.fecha_inicio_publicacion_notas)
                  setLocalErrors(prev => ({ ...prev, fecha_inicio_publicacion_notas: [] }))
              }}
              fullWidth
              size='small'
              error={Boolean(
                mergedErrors?.fecha_inicio_publicacion_notas && mergedErrors?.fecha_inicio_publicacion_notas.length > 0
              )}
              helperText={mergedErrors?.fecha_inicio_publicacion_notas?.[0] || ''}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Publicación Fin'
              placeholder='dd/mm/aaaa'
              type='date'
              value={fechaFinPub}
              onChange={e => {
                setFechaFinPub(e.target.value)
                if (mergedErrors?.fecha_fin_publicacion_notas)
                  setLocalErrors(prev => ({ ...prev, fecha_fin_publicacion_notas: [] }))
              }}
              fullWidth
              size='small'
              error={Boolean(
                mergedErrors?.fecha_fin_publicacion_notas && mergedErrors?.fecha_fin_publicacion_notas.length > 0
              )}
              helperText={mergedErrors?.fecha_fin_publicacion_notas?.[0] || ''}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant='contained' onClick={handleSave}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ParcialModal
