'use client'

import { useState, useEffect } from 'react'

import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { toast } from 'react-hot-toast'

import type { ConfigGrado, ConfigGradoFormData, ValidationErrors, ModalidadOption } from '../types'
import { configGradoService } from '../services/configGradoService'

interface ConfigGradoFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ConfigGradoFormData) => Promise<void>
  initialData?: ConfigGrado | null
  loading?: boolean
}

export default function ConfigGradoForm({ 
  open, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false 
}: ConfigGradoFormProps) {
  const [formData, setFormData] = useState<ConfigGradoFormData>({
    nombre: '',
    formato: 'cuantitativo',
    abreviatura: '',
    orden: 1,
    modalidad_id: 0
  })
  
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [modalidades, setModalidades] = useState<ModalidadOption[]>([])
  const [modalidadesLoading, setModalidadesLoading] = useState<boolean>(false)

  // Actualizar formData cuando cambie initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        formato: initialData.formato || 'cuantitativo',
        abreviatura: initialData.abreviatura || '',
        orden: initialData.orden || 1,
        modalidad_id: initialData.modalidad_id || 0
      })
    } else {
      setFormData({
        nombre: '',
        formato: 'cuantitativo',
        abreviatura: '',
        orden: 1,
        modalidad_id: 0
      })
    }
    setErrors({}) // Limpiar errores al cambiar datos
    // Cargar modalidades al abrir
    if (open) {
      loadModalidades()
    }
  }, [initialData, open]) // Incluir open para resetear cuando se abra/cierre el modal

  const loadModalidades = async () => {
    setModalidadesLoading(true)
    try {
      const options = await configGradoService.getModalidadesOptions()
      setModalidades(options)
    } catch (error: any) {
      // Manejo mínimo según reglas: mostrar en toast desde el padre
    } finally {
      setModalidadesLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      await onSubmit(formData)
      onClose()
      toast.success(initialData ? 'Grado actualizado exitosamente' : 'Grado creado exitosamente')
    } catch (error: any) {
      console.log('Error capturado:', error) // Para debug
      
      // La estructura del error viene directamente del httpClient
      if (error.data?.errors) {
        setErrors(error.data.errors)
      } else {
        toast.error(error.data?.message || 'Error al procesar la solicitud')
      }
    }
  }

  const handleChange = (field: keyof ConfigGradoFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'Editar Grado' : 'Nuevo Grado'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              error={!!errors.nombre}
              helperText={errors.nombre?.[0]}
              required
              size="small"
              fullWidth
            />
            
            <TextField
              label="Abreviatura"
              value={formData.abreviatura}
              onChange={(e) => handleChange('abreviatura', e.target.value)}
              error={!!errors.abreviatura}
              helperText={errors.abreviatura?.[0]}
              required
              size="small"
              fullWidth
              inputProps={{ maxLength: 10 }}
            />

            <FormControl size="small" error={!!errors.formato} required>
              <InputLabel>Formato de Evaluación</InputLabel>
              <Select
                value={formData.formato || 'cuantitativo'}
                onChange={(e) => handleChange('formato', e.target.value as any)}
                label="Formato de Evaluación"
              >
                <MenuItem value="cuantitativo">Cuantitativo (0-100)</MenuItem>
                <MenuItem value="cualitativo">Cualitativo (Inicial)</MenuItem>
              </Select>
              {errors.formato && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                  {errors.formato[0]}
                </Box>
              )}
            </FormControl>
            
          <TextField
            label="Orden"
            type="number"
            value={formData.orden}
            onChange={(e) => handleChange('orden', parseInt(e.target.value) || 1)}
            error={!!errors.orden}
            helperText={errors.orden?.[0]}
            required
            size="small"
            fullWidth
            inputProps={{ min: 1 }}
          />

            <FormControl size="small" error={!!errors.modalidad_id} required>
              <InputLabel>Modalidad</InputLabel>
              <Select
                value={formData.modalidad_id || ''}
                onChange={(e) => handleChange('modalidad_id', Number(e.target.value) || 0)}
                label="Modalidad"
                disabled={modalidadesLoading || loading}
              >
                <MenuItem value="">
                  <em>{modalidadesLoading ? 'Cargando...' : 'Seleccionar modalidad'}</em>
                </MenuItem>
                {modalidades.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                ))}
              </Select>
              {errors.modalidad_id && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                  {errors.modalidad_id[0]}
                </Box>
              )}
            </FormControl>
         </Box>
       </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}