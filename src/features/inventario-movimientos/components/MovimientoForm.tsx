'use client'

import { useEffect, useState } from 'react'

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormHelperText,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'

import {
    SwapVert as AjusteIcon,
    Cancel as CancelIcon,
    TrendingUp as EntradaIcon,
    TrendingDown as SalidaIcon,
    Save as SaveIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import movimientosService from '@/features/inventario-movimientos/services/services_movimientosService'
import type {
    CreateMovimientoData,
    MovimientoInventario,
    TipoMovimiento,
    ValidationErrors
} from '@/features/inventario-movimientos/types/types_index'
import {
    TIPOS_DOCUMENTO,
    TIPOS_MOVIMIENTO,
    getTipoMovimientoLabel
} from '@/features/inventario-movimientos/types/types_index'
import { ProductosService } from '@/features/inventario-productos/services/services_productosService'
import type { InventarioProducto } from '@/features/inventario-productos/types/types_index'

interface MovimientoFormProps {
  open: boolean
  onClose: () => void
  movimiento?: MovimientoInventario | null
  productoId: number
  onSuccess: () => void
}

export default function MovimientoForm({ 
  open, 
  onClose, 
  movimiento, 
  productoId,
  onSuccess 
}: MovimientoFormProps) {
  // Estados del formulario
  const [formData, setFormData] = useState<CreateMovimientoData>({
    producto_id: productoId,
    almacen_id: 1, // Default almacen_id since it's still required by the backend
    tipo_movimiento: 'entrada',
    cantidad: '',
    costo_unitario: '',
    observaciones: '',
    documento_tipo: '',
    documento_numero: '',
    documento_fecha: '',
    propiedades_adicionales: {
      motivo_ajuste: ''
    }
  })

  // Estados de carga y errores
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string>('')
  const [producto, setProducto] = useState<InventarioProducto | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Estados calculados
  const [valorTotal, setValorTotal] = useState<number>(0)
  const [stockActual, setStockActual] = useState<number>(0)
  const [stockPosterior, setStockPosterior] = useState<number>(0)

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open, productoId])

  // Función para limpiar el formulario
  const resetForm = () => {
    setFormData({
      producto_id: productoId,
      almacen_id: 1,
      tipo_movimiento: 'entrada',
      cantidad: '',
      costo_unitario: '',
      observaciones: '',
      documento_tipo: '',
      documento_numero: '',
      documento_fecha: '',
      propiedades_adicionales: {
        motivo_ajuste: ''
      }
    })
    setErrors({})
  }

  // Actualizar formulario cuando cambia el movimiento
  useEffect(() => {
    if (movimiento) {
      setFormData({
        producto_id: movimiento.producto_id,
        almacen_id: movimiento.almacen_id,
        tipo_movimiento: movimiento.tipo_movimiento,
        cantidad: movimiento.cantidad,
        costo_unitario: movimiento.costo_unitario,
        observaciones: movimiento.observaciones || '',
        documento_tipo: movimiento.documento_tipo || '',
        documento_numero: movimiento.documento_numero || '',
        documento_fecha: movimiento.documento_fecha || '',
        proveedor_id: movimiento.proveedor_id,
        cliente_id: movimiento.cliente_id,
        propiedades_adicionales: {
          motivo_ajuste: ''
        }
      })
    } else {
      // Limpiar formulario para nuevo movimiento
      resetForm()
    }
    setErrors({})
  }, [movimiento, productoId, open]) // Agregamos 'open' para limpiar cuando se abre el modal

  // Calcular valores cuando cambian cantidad o costo
  useEffect(() => {
    const cantidad = parseFloat(formData.cantidad) || 0
    const costo = parseFloat(formData.costo_unitario || '0') || 0
    const total = cantidad * costo
    setValorTotal(total)

    // Calcular stock posterior
    if (producto) {
      const stockActualValue = producto.stock_actual || 0
      setStockActual(stockActualValue)
      
      let nuevoStock = stockActualValue
      switch (formData.tipo_movimiento) {
        case 'entrada':
        case 'ajuste_positivo':
          nuevoStock = stockActualValue + cantidad
          break
        case 'salida':
        case 'ajuste_negativo':
          nuevoStock = stockActualValue - cantidad
          break
        case 'transferencia':
          // En transferencias, el stock no cambia en el producto origen
          nuevoStock = stockActualValue
          break
      }
      setStockPosterior(Math.max(0, nuevoStock))
    }
  }, [formData.cantidad, formData.costo_unitario, formData.tipo_movimiento, producto])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      
      // Cargar solo producto
      const productoData = await ProductosService.getProductoById(productoId)

      setProducto(productoData)
    } catch (error: any) {
      toast.error('Error al cargar datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof CreateMovimientoData, value: any) => {
    if (field === 'propiedades_adicionales') {
      setFormData(prev => ({
        ...prev,
        propiedades_adicionales: {
          ...prev.propiedades_adicionales,
          ...value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Función para determinar qué campos mostrar según el tipo de movimiento
  const shouldShowField = (field: string): boolean => {
    const { tipo_movimiento } = formData
    
    switch (field) {
      case 'costo_unitario':
        // Obligatorio para entradas, opcional para ajustes
        return tipo_movimiento === 'entrada' || tipo_movimiento === 'ajuste_positivo' || tipo_movimiento === 'ajuste_negativo'
      
      case 'motivo_ajuste':
        // Solo para ajustes (positivos y negativos)
        return tipo_movimiento === 'ajuste_positivo' || tipo_movimiento === 'ajuste_negativo'
      
      case 'documento_fecha':
      case 'documento_numero':
      case 'observaciones':
        // Siempre opcionales para todos los tipos
        return true
      
      default:
        return true
    }
  }

  // Función para determinar si un campo es obligatorio
  const isFieldRequired = (field: string): boolean => {
    const { tipo_movimiento } = formData
    
    switch (field) {
      case 'cantidad':
        return true // Siempre obligatorio
      
      case 'costo_unitario':
        return tipo_movimiento === 'entrada' // Solo obligatorio para entradas
      
      case 'motivo_ajuste':
        return tipo_movimiento === 'ajuste_positivo' || tipo_movimiento === 'ajuste_negativo'
      
      default:
        return false
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validar cantidad (siempre obligatorio)
    if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
      newErrors.cantidad = ['La cantidad debe ser mayor a 0']
    }

    // Validar límites de cantidad
    const cantidad = parseFloat(formData.cantidad) || 0
    if (cantidad > 999999.99) {
      newErrors.cantidad = ['La cantidad no puede ser mayor a 999,999.99']
    }

    // Validar costo unitario (obligatorio solo para entradas)
    if (isFieldRequired('costo_unitario') && (!formData.costo_unitario || parseFloat(formData.costo_unitario) <= 0)) {
      newErrors.costo_unitario = ['El costo unitario es obligatorio para entradas']
    }

    // Validar límites de costo unitario
    const costoUnitario = parseFloat(formData.costo_unitario || '0') || 0
    if (costoUnitario > 999999.99) {
      newErrors.costo_unitario = ['El costo unitario no puede ser mayor a 999,999.99']
    }

    // Validar motivo de ajuste (obligatorio para ajustes)
    if (isFieldRequired('motivo_ajuste') && (!formData.propiedades_adicionales?.motivo_ajuste || formData.propiedades_adicionales.motivo_ajuste.trim() === '')) {
      newErrors['propiedades_adicionales.motivo_ajuste'] = ['El motivo del ajuste es obligatorio']
    }

    // Validar longitud del motivo de ajuste
    if (formData.propiedades_adicionales?.motivo_ajuste && formData.propiedades_adicionales.motivo_ajuste.length > 255) {
      newErrors['propiedades_adicionales.motivo_ajuste'] = ['El motivo del ajuste no puede exceder 255 caracteres']
    }

    // Validar fecha del documento (no puede ser futura)
    if (formData.documento_fecha) {
      const fechaDocumento = new Date(formData.documento_fecha)
      const fechaActual = new Date()
      fechaActual.setHours(23, 59, 59, 999) // Permitir hasta el final del día actual
      
      if (fechaDocumento > fechaActual) {
        newErrors.documento_fecha = ['La fecha del documento no puede ser futura']
      }
    }

    // Validar longitud del número de documento
    if (formData.documento_numero && formData.documento_numero.length > 100) {
      newErrors.documento_numero = ['El número de documento no puede exceder 100 caracteres']
    }

    // Validar longitud de observaciones
    if (formData.observaciones && formData.observaciones.length > 1000) {
      newErrors.observaciones = ['Las observaciones no pueden exceder 1000 caracteres']
    }

    // Validar stock suficiente para salidas y ajustes negativos
    if ((formData.tipo_movimiento === 'salida' || formData.tipo_movimiento === 'ajuste_negativo') && 
        stockPosterior < 0) {
      newErrors.cantidad = ['No hay suficiente stock para esta operación']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario')
      return
    }

    setLoading(true)
    setErrors({})
    setGeneralError('') // Limpiar error general

    try {
      let response

      if (movimiento) {
        response = await movimientosService.updateMovimiento(movimiento.id, formData)
      } else {
        response = await movimientosService.createMovimiento(formData)
      }

      if (response?.success) {
        toast.success(response.message || (movimiento ? 'Movimiento actualizado exitosamente' : 'Movimiento creado exitosamente'))
        onSuccess()
        onClose()
      } else {
        // Manejar errores de validación del backend (igual que SeccionModal)
        if (response?.errors) {
          const backendErrors: ValidationErrors = {}

          Object.entries(response.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof ValidationErrors] = messages
            }
          })
          setErrors(backendErrors)
          setGeneralError('Por favor corrige los errores en el formulario')
          toast.error('Por favor corrige los errores en el formulario')
        } else {
          const errorMessage = response?.message || 'Error al guardar el movimiento'
          setGeneralError(errorMessage)
          toast.error(errorMessage)
        }
      }
    } catch (error: any) {
      const errorMessage = 'Error inesperado al guardar el movimiento'
      setGeneralError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setErrors({})
      onClose()
    }
  }

  const getTipoMovimientoIcon = (tipo: TipoMovimiento) => {
    switch (tipo) {
      case 'entrada':
        return <EntradaIcon fontSize="small" />
      case 'salida':
        return <SalidaIcon fontSize="small" />
      case 'ajuste_positivo':
      case 'ajuste_negativo':
        return <AjusteIcon fontSize="small" />
      default:
        return <AjusteIcon fontSize="small" />
    }
  }

  const formatCurrency = (amount: number, currency: boolean) => {
    const symbol = currency ? '$' : 'C$'
    return `${symbol} ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }



return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTipoMovimientoIcon(formData.tipo_movimiento)}
          <Typography variant="h5">
            {movimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </Typography>
        </Box>
        {producto && (
          <Typography variant="subtitle2" color="text.secondary" component="div">
            Producto: {producto.nombre} ({producto.codigo})
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Información del producto */}
            {producto && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Stock Actual:</strong> {producto.stock_actual.toLocaleString('es-NI')} unidades
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Tipo de movimiento */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Movimiento *</InputLabel>
                <Select
                  value={formData.tipo_movimiento}
                  onChange={(e) => handleInputChange('tipo_movimiento', e.target.value)}
                  label="Tipo de Movimiento *"
                  error={!!errors.tipo_movimiento}
                >
                  {TIPOS_MOVIMIENTO.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {tipo.value === 'entrada' && <EntradaIcon color="success" />}
                        {tipo.value === 'salida' && <SalidaIcon color="error" />}
                        {tipo.value === 'ajuste_positivo' && <AjusteIcon color="info" />}
                        {tipo.value === 'ajuste_negativo' && <AjusteIcon color="warning" />}
                        <Typography>{getTipoMovimientoLabel(tipo.value)}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipo_movimiento && (
                  <FormHelperText error>{errors.tipo_movimiento[0]}</FormHelperText>
                )}
              </FormControl>
            </Grid>



            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Cantidad */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Cantidad *"
                type="number"
                value={formData.cantidad}
                onChange={(e) => handleInputChange('cantidad', e.target.value)}
                error={!!errors.cantidad}
                helperText={errors.cantidad?.[0]}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Costo unitario - Solo para entradas y ajustes */}
            {shouldShowField('costo_unitario') && (
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Costo Unitario ${isFieldRequired('costo_unitario') ? '*' : ''}`}
                  type="number"
                  value={formData.costo_unitario}
                  onChange={(e) => handleInputChange('costo_unitario', e.target.value)}
                  error={!!errors.costo_unitario}
                  helperText={errors.costo_unitario?.[0]}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {producto?.moneda ? '$' : 'C$'}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            {/* Valor total (calculado) - Solo si hay costo unitario */}
            {shouldShowField('costo_unitario') && formData.costo_unitario && (
              <Grid item xs={12} md={shouldShowField('costo_unitario') ? 6 : 9}>
                <TextField
                  fullWidth
                  size="small"
                  label="Valor Total"
                  value={formatCurrency(valorTotal, producto?.moneda || false)}
                  InputProps={{ readOnly: true }}
                  variant="filled"
                />
              </Grid>
            )}

            {/* Motivo de ajuste - Solo para ajustes */}
            {shouldShowField('motivo_ajuste') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Motivo del Ajuste *"
                  value={formData.propiedades_adicionales?.motivo_ajuste || ''}
                  onChange={(e) => handleInputChange('propiedades_adicionales', { motivo_ajuste: e.target.value })}
                  error={!!errors['propiedades_adicionales.motivo_ajuste']}
                  helperText={errors['propiedades_adicionales.motivo_ajuste']?.[0]}
                  placeholder="Describa el motivo del ajuste de inventario"
                  inputProps={{ maxLength: 255 }}
                />
              </Grid>
            )}

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Fecha de documento - Opcional para todos */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Fecha del Documento"
                type="date"
                value={formData.documento_fecha}
                onChange={(e) => handleInputChange('documento_fecha', e.target.value)}
                error={!!errors.documento_fecha}
                helperText={errors.documento_fecha?.[0]}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().split('T')[0] }}
              />
            </Grid>

            {/* Tipo de documento */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={formData.documento_tipo}
                  onChange={(e) => handleInputChange('documento_tipo', e.target.value)}
                  label="Tipo de Documento"
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Número de documento */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Número de Documento"
                value={formData.documento_numero}
                onChange={(e) => handleInputChange('documento_numero', e.target.value)}
                error={!!errors.documento_numero}
                helperText={errors.documento_numero?.[0]}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Observaciones"
                multiline
                rows={3}
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                error={!!errors.observaciones}
                helperText={errors.observaciones?.[0]}
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>

            {/* Resumen de stock */}
            {producto && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Stock Actual:</strong> {stockActual.toLocaleString('es-NI')} unidades
                  </Typography>
                  <Typography variant="body2">
                    <strong>Stock Posterior:</strong> {stockPosterior.toLocaleString('es-NI')} unidades
                  </Typography>
                  {stockPosterior < 0 && (
                    <Typography variant="body2" color="error">
                      ⚠️ El stock resultante sería negativo
                    </Typography>
                  )}
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {/* Mostrar error general si existe */}
        {generalError && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ 
                bgcolor: 'error.lighter', 
                padding: 1, 
                borderRadius: 1,
                border: 1,
                borderColor: 'error.light'
              }}
            >
              ⚠️ {generalError}
            </Typography>
          </Box>
        )}
        
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CancelIcon />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingData}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? 'Guardando...' : movimiento ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
