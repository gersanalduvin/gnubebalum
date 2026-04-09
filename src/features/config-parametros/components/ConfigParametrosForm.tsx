'use client'

import { useState, useEffect, useRef } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Grid,
  Box,
  CircularProgress,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Alert
} from '@mui/material'

import {
  Save as SaveIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import configParametrosService from '../services/configParametrosService'
import type { 
  ConfigParametros,
  ConfigParametrosData,
  ValidationErrors,
  CambioParametro
} from '../types/index'

interface ConfigParametrosFormProps {
  onShowCambios: (cambios: CambioParametro[]) => void
}

export default function ConfigParametrosForm({ onShowCambios }: ConfigParametrosFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [parametrosActuales, setParametrosActuales] = useState<ConfigParametros | null>(null)
  const hasLoadedRef = useRef(false)

  const [formData, setFormData] = useState<ConfigParametrosData>({
    consecutivo_recibo_oficial: 1,
    consecutivo_recibo_interno: 1,
    tasa_cambio_dolar: '1.0000',
    terminal_separada: false
  })

  // Cargar parámetros actuales
  const loadParametros = async () => {
    setLoadingData(true)
    try {
      const data = await configParametrosService.getParametros()
      
      if ('id' in data) {
        // Es un ConfigParametros completo
        setParametrosActuales(data as ConfigParametros)
        const newFormData = {
          consecutivo_recibo_oficial: data.consecutivo_recibo_oficial,
          consecutivo_recibo_interno: data.consecutivo_recibo_interno,
          tasa_cambio_dolar: data.tasa_cambio_dolar,
          terminal_separada: data.terminal_separada
        }
        setFormData(newFormData)
      } else {
        // Son valores por defecto
        setParametrosActuales(null)
        setFormData(data as ConfigParametrosData)
      }
    } catch (error: any) {
      const errorInfo = configParametrosService.processBackendErrors(error)
      toast.error(errorInfo.message)
    } finally {
      setLoadingData(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    const load = async () => {
      setLoadingData(true)
      try {
        const data = await configParametrosService.getParametros()
        
        if ('id' in data) {
          // Es un ConfigParametros completo
          setParametrosActuales(data as ConfigParametros)
          const newFormData = {
            consecutivo_recibo_oficial: data.consecutivo_recibo_oficial,
            consecutivo_recibo_interno: data.consecutivo_recibo_interno,
            tasa_cambio_dolar: data.tasa_cambio_dolar,
            terminal_separada: data.terminal_separada
          }
          setFormData(newFormData)
        } else {
          // Son valores por defecto
          setParametrosActuales(null)
          setFormData(data as ConfigParametrosData)
        }
      } catch (error: any) {
        const errorInfo = configParametrosService.processBackendErrors(error)
        toast.error(errorInfo.message)
      } finally {
        setLoadingData(false)
      }
    }

    // Evitar doble carga en StrictMode: cargar una sola vez
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      load()
    }
  }, [])

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field: keyof ConfigParametrosData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.consecutivo_recibo_oficial || formData.consecutivo_recibo_oficial < 1) {
      newErrors.consecutivo_recibo_oficial = ['El consecutivo de Colegio Balum Botan debe ser mayor a 0']
    }

    if (!formData.consecutivo_recibo_interno || formData.consecutivo_recibo_interno < 1) {
      newErrors.consecutivo_recibo_interno = ['El consecutivo de Jardín Infantil Los Picapiedras debe ser mayor a 0']
    }

    if (!formData.tasa_cambio_dolar) {
      newErrors.tasa_cambio_dolar = ['La tasa de cambio del dólar es requerida']
    } else {
      const tasa = parseFloat(formData.tasa_cambio_dolar)
      if (isNaN(tasa) || tasa < 0.0001 || tasa > 9999.9999) {
        newErrors.tasa_cambio_dolar = ['La tasa de cambio debe estar entre 0.0001 y 9999.9999']
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario')
      return
    }

    try {
      setLoading(true)
      const result = await configParametrosService.updateOrCreateParametros(formData)
      
      setParametrosActuales(result)
      toast.success(parametrosActuales ? 'Parámetros actualizados correctamente' : 'Parámetros creados correctamente')
      
    } catch (error: any) {
      const errorInfo = configParametrosService.processBackendErrors(error)
      
      if (errorInfo.fieldErrors) {
        setErrors(errorInfo.fieldErrors)
        toast.error('Por favor corrija los errores en el formulario')
      } else {
        toast.error(errorInfo.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Función para ver cambios
  const handleVerCambios = () => {
    if (parametrosActuales && parametrosActuales.cambios && parametrosActuales.cambios.length > 0) {
      onShowCambios(parametrosActuales.cambios)
    } else {
      toast('No hay cambios registrados para mostrar', { icon: 'ℹ️' })
    }
  }

  // Manejar recargar datos
  const handleRefresh = () => {
    loadParametros()
  }

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Configuración de Parámetros"
        subheader="Gestione los parámetros globales del sistema"
        action={
          <Box display="flex" gap={1}>
            {parametrosActuales && parametrosActuales.cambios && parametrosActuales.cambios.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleVerCambios}
                size="small"
              >
                Ver Cambios
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size="small"
            >
              Recargar
            </Button>
          </Box>
        }
      />
      
      <CardContent>
        {parametrosActuales && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Última actualización: {new Date(parametrosActuales.updated_at).toLocaleString()}
            {parametrosActuales.updated_by && ` por usuario ID: ${parametrosActuales.updated_by}`}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Consecutivo Recibo Oficial */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Consecutivo Colegio Balum Botan"
              type="number"
              value={formData.consecutivo_recibo_oficial}
              onChange={(e) => handleInputChange('consecutivo_recibo_oficial', parseInt(e.target.value) || 0)}
              error={!!errors.consecutivo_recibo_oficial}
              helperText={errors.consecutivo_recibo_oficial?.[0]}
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Consecutivo Recibo Interno */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Consecutivo Jardín Infantil Los Picapiedras"
              type="number"
              value={formData.consecutivo_recibo_interno}
              onChange={(e) => handleInputChange('consecutivo_recibo_interno', parseInt(e.target.value) || 0)}
              error={!!errors.consecutivo_recibo_interno}
              helperText={errors.consecutivo_recibo_interno?.[0]}
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Tasa de Cambio Dólar */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Tasa de Cambio Dólar"
              type="number"
              value={formData.tasa_cambio_dolar}
              onChange={(e) => handleInputChange('tasa_cambio_dolar', e.target.value)}
              error={!!errors.tasa_cambio_dolar}
              helperText={errors.tasa_cambio_dolar?.[0]}
              inputProps={{ 
                min: 0.0001, 
                max: 9999.9999, 
                step: 0.0001 
              }}
            />
          </Grid>

          {/* Terminal Separada */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.terminal_separada}
                  onChange={(e) => handleInputChange('terminal_separada', e.target.checked)}
                />
              }
              label="Terminal Separada"
            />
          </Grid>

          {/* Botón de Guardar */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
                size="large"
              >
                {loading ? 'Guardando...' : 'Guardar Parámetros'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}