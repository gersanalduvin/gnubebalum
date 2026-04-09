'use client'

import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { toast } from 'react-hot-toast'

import type { ConfigGrado, CreateGradoRequest, ValidationErrors, ModalidadOption } from '../types'
import gradoService from '../services/gradoService'

interface GradoModalProps {
  open: boolean
  mode: 'create' | 'edit'
  grado?: ConfigGrado
  onClose: () => void
  onSuccess: () => void
}

const GradoModal: React.FC<GradoModalProps> = ({
  open,
  mode,
  grado,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateGradoRequest>({
    nombre: '',
    abreviatura: '',
    orden: 1,
    modalidad_id: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [modalidades, setModalidades] = useState<ModalidadOption[]>([])
  const [modalidadesLoading, setModalidadesLoading] = useState<boolean>(false)

  // Resetear formulario cuando cambie el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && grado) {
        setFormData({
          nombre: grado.nombre,
          abreviatura: grado.abreviatura,
          orden: grado.orden,
          modalidad_id: grado.modalidad_id || 0
        })
      } else {
        setFormData({
          nombre: '',
          abreviatura: '',
          orden: 1,
          modalidad_id: 0
        })
      }
      setErrors({})
      setGeneralError(null)
      // Cargar modalidades al abrir
      loadModalidades()
    }
  }, [open, mode, grado])

  const loadModalidades = async () => {
    setModalidadesLoading(true)
    try {
      const options = await gradoService.getModalidades()
      setModalidades(options)
    } catch (error: any) {
      if (error.isAuthError) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error(error.message || 'Error al cargar modalidades')
    } finally {
      setModalidadesLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateGradoRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'orden' ? parseInt(event.target.value) || 1 : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  const handleSelectChange = (field: keyof CreateGradoRequest) => (
    event: any
  ) => {
    const value = Number(event.target.value) || 0
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    setGeneralError(null)

    try {
      if (mode === 'create') {
        await gradoService.createGrado(formData)
        toast.success('Grado creado exitosamente')
      } else if (mode === 'edit' && grado) {
        await gradoService.updateGrado(grado.id, formData)
        toast.success('Grado actualizado exitosamente')
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      if (error.isValidationError && error.errors) {
        setErrors(error.errors)
      } else {
        setGeneralError(error.message || 'Error al guardar el grado')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {mode === 'create' ? 'Crear Nuevo Grado' : 'Editar Grado'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={handleInputChange('nombre')}
            error={!!errors.nombre}
            helperText={errors.nombre?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
          />

          <TextField
            label="Abreviatura"
            value={formData.abreviatura}
            onChange={handleInputChange('abreviatura')}
            error={!!errors.abreviatura}
            helperText={errors.abreviatura?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            inputProps={{ maxLength: 10 }}
          />

          <TextField
            label="Orden"
            type="number"
            value={formData.orden}
            onChange={handleInputChange('orden')}
            error={!!errors.orden}
            helperText={errors.orden?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            inputProps={{ min: 1 }}
          />

          <FormControl size="small" error={!!errors.modalidad_id} required disabled={loading || modalidadesLoading}>
            <InputLabel>Modalidad</InputLabel>
            <Select
              value={formData.modalidad_id || ''}
              onChange={handleSelectChange('modalidad_id')}
              label="Modalidad"
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

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : (mode === 'create' ? 'Crear' : 'Actualizar')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GradoModal