'use client'

import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  CircularProgress,
  Typography,
  Autocomplete
} from '@mui/material'

import { toast } from 'react-hot-toast'

import categoriasService from '../services/services_categoriasService'
import type { 
  InventarioCategoria, 
  CreateCategoriaRequest, 
  UpdateCategoriaRequest,
  ValidationErrors
} from '../types/types_index'
import { ESTADOS_CATEGORIA } from '../types/types_index'

interface InventarioCategoriaFormProps {
  open: boolean
  onClose: () => void
  categoria?: InventarioCategoria | null
  onSuccess: () => void
}

export default function InventarioCategoriaForm({ 
  open, 
  onClose, 
  categoria, 
  onSuccess 
}: InventarioCategoriaFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [categoriasPadre, setCategoriasPadre] = useState<InventarioCategoria[]>([])
  const [loadingPadres, setLoadingPadres] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_padre_id: null as number | null,
    activo: true
  })

  // Cargar categorías padre disponibles
  const loadCategoriasPadre = async () => {
    setLoadingPadres(true)
    try {
      const response = await categoriasService.getCategorias({ per_page: 1000 })
      if (response.data?.data) {
        // Filtrar la categoría actual si estamos editando para evitar referencias circulares
        const categoriasDisponibles = categoria 
          ? response.data.data.filter(c => c.id !== categoria.id)
          : response.data.data
        setCategoriasPadre(categoriasDisponibles)
      }
    } catch (error) {
      toast.error('Error al cargar categorías padre')
    } finally {
      setLoadingPadres(false)
    }
  }

  // Inicializar formulario
  useEffect(() => {
    if (open) {
      if (categoria) {
        // Modo edición
        setFormData({
          codigo: categoria.codigo,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion || '',
          categoria_padre_id: categoria.categoria_padre_id,
          activo: categoria.activo
        })
      } else {
        // Modo creación
        setFormData({
          codigo: '',
          nombre: '',
          descripcion: '',
          categoria_padre_id: null,
          activo: true
        })
      }
      setErrors({})
      loadCategoriasPadre()
    }
  }, [open, categoria])

  const handleInputChange = (field: string, value: any) => {
    let processedValue = value
    
    // Convertir string a boolean para el campo activo
    if (field === 'activo' && typeof value === 'string') {
      processedValue = value === 'true'
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }))
    }
  }

  const processBackendErrors = (error: any) => {
    const errorData = error.data || {}
    
    // Verificar errores específicos primero
    if (errorData.errors?.configuracion) {
      toast.error(errorData.errors.configuracion[0])
      return
    }
    
    // Procesar errores de validación de campos
    if (errorData.errors) {
      const newFieldErrors: ValidationErrors = {}
      Object.keys(errorData.errors).forEach(field => {
        const errorMessages = errorData.errors[field]
        if (Array.isArray(errorMessages)) {
          newFieldErrors[field] = errorMessages
        }
      })
      setErrors(newFieldErrors)
      
      // No mostrar toast general si hay errores de validación específicos
      return
    }
    
    // Mostrar mensaje general si existe y no hay errores de validación
    if (errorData.message) {
      toast.error(errorData.message)
    } else {
      toast.error('Error al procesar la solicitud')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    
    try {
      let response
      
      if (categoria) {
        // Actualizar categoría existente
        const updateData: UpdateCategoriaRequest = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          categoria_padre_id: formData.categoria_padre_id,
          activo: formData.activo
        }
        
        response = await categoriasService.updateCategoria(categoria.id, updateData)
      } else {
        // Crear nueva categoría
        const createData: CreateCategoriaRequest = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          categoria_padre_id: formData.categoria_padre_id,
          activo: formData.activo
        }
        
        response = await categoriasService.createCategoria(createData)
      }
      
      // Verificar si la respuesta fue exitosa
      if (response.success) {
        toast.success(categoria ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente')
        onSuccess()
        onClose()
      } else {
        // Procesar errores de validación sin cerrar el modal
        processBackendErrors({ data: response })
      }
    } catch (error: any) {
      processBackendErrors(error)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.codigo.trim() !== '' && 
           formData.nombre.trim() !== ''
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Código */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código *"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                error={!!errors.codigo}
                helperText={errors.codigo?.[0]}
                placeholder="Ej: CAT001"
                size="small"
              />
            </Grid>

            {/* Nombre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                error={!!errors.nombre}
                helperText={errors.nombre?.[0]}
                placeholder="Nombre de la categoría"
                size="small"
              />
            </Grid>

            {/* Categoría Padre */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                size="small"
                options={categoriasPadre}
                getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
                value={categoriasPadre.find(c => c.id === formData.categoria_padre_id) || null}
                onChange={(_, newValue) => handleInputChange('categoria_padre_id', newValue?.id || null)}
                loading={loadingPadres}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoría Padre"
                    error={!!errors.categoria_padre_id}
                    helperText={errors.categoria_padre_id?.[0]}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingPadres ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Estado */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.activo}>
                <InputLabel>Estado *</InputLabel>
                <Select
                  value={formData.activo}
                  label="Estado *"
                  onChange={(e) => handleInputChange('activo', e.target.value)}
                >
                  {ESTADOS_CATEGORIA.map((estado) => (
                    <MenuItem key={estado.value.toString()} value={estado.value.toString()}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.activo && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.activo[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                error={!!errors.descripcion}
                helperText={errors.descripcion?.[0]}
                multiline
                rows={3}
                size="small"
                placeholder="Descripción opcional de la categoría"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            categoria ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}