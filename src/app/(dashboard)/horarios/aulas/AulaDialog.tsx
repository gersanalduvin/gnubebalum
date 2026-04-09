'use client'

import ScheduleService, { ConfigAula } from '@/services/scheduleService'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField
} from '@mui/material'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

interface AulaDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  aula?: ConfigAula
}

interface FormData {
  nombre: string
  tipo: 'aula' | 'laboratorio' | 'cancha' | 'otro'
  capacidad: string // TextField returns string usually
  activa: boolean
}

const AulaDialog: React.FC<AulaDialogProps> = ({ open, onClose, onSave, aula }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      nombre: '',
      tipo: 'aula',
      capacidad: '30',
      activa: true
    }
  })

  useEffect(() => {
    if (aula) {
      reset({
        nombre: aula.nombre,
        tipo: aula.tipo,
        capacidad: aula.capacidad?.toString(),
        activa: aula.activa
      })
    } else {
      reset({
        nombre: '',
        tipo: 'aula',
        capacidad: '30',
        activa: true
      })
    }
  }, [aula, reset])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        capacidad: parseInt(data.capacidad),
        id: aula?.id // Si es edit
      }

      await ScheduleService.saveAula(payload)
      toast.success(aula ? 'Aula actualizada' : 'Aula creada')
      onSave()
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar aula')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{aula ? 'Editar Aula' : 'Nueva Aula'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
           <Controller
            name="nombre"
            control={control}
            rules={{ required: 'El nombre es requerido' }}
            render={({ field }) => (
              <TextField 
                {...field} 
                label="Nombre" 
                fullWidth 
                size="small"
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
              />
            )}
          />

          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select {...field} label="Tipo">
                  <MenuItem value="aula">Aula de Clases</MenuItem>
                  <MenuItem value="laboratorio">Laboratorio</MenuItem>
                  <MenuItem value="cancha">Cancha / Deporte</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="capacidad"
            control={control}
            rules={{ 
                required: 'La capacidad es requerida',
                min: { value: 1, message: 'Debe ser mayor a 0' } 
            }}
            render={({ field }) => (
              <TextField 
                {...field} 
                label="Capacidad" 
                type="number"
                fullWidth 
                size="small"
                error={!!errors.capacidad}
                helperText={errors.capacidad?.message}
              />
            )}
          />
          
          <Controller
            name="activa"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} size="small" />}
                label="Activa"
                sx={{ mt: 0 }}
              />
            )}
          />

        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AulaDialog
