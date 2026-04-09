'use client'

import { useEffect, useState } from 'react'

import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'

import { toast } from 'react-hot-toast'

import productosService, { ProductosService } from '../services/services_productosService'
import type {
    CategoriaOption,
    CreateProductoRequest,
    CuentaContableOption,
    InventarioProducto,
    UnidadMedida,
    UpdateProductoRequest,
    ValidationErrors
} from '../types/types_index'
import { ESTADOS_PRODUCTO, TIPOS_DOCUMENTO, TIPOS_MONEDA, UNIDADES_MEDIDA } from '../types/types_index'

interface InventarioProductoFormProps {
  open: boolean
  onClose: () => void
  producto?: InventarioProducto | null
  onSuccess: () => void
}

export default function InventarioProductoForm({ 
  open, 
  onClose, 
  producto, 
  onSuccess 
}: InventarioProductoFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const [cuentasContables, setCuentasContables] = useState<CuentaContableOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: null as number | null,
    unidad_medida: 'UND' as UnidadMedida,
    precio_venta: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    stock_actual: 0,
    costo_promedio: 0,
    moneda: false,
    cuenta_inventario_id: null as number | null,
    cuenta_costo_id: null as number | null,
    cuenta_venta_id: null as number | null,
    activo: true,
    documento_tipo: '',
    documento_numero: '',
    documento_fecha: '',
    observaciones: ''
  })

  // Cargar opciones para los selects
  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      const [categoriasResponse, cuentasResponse] = await Promise.all([
        ProductosService.getCategorias(),
        ProductosService.getCuentasContables()
      ])
      
      setCategorias(categoriasResponse || [])
      setCuentasContables(cuentasResponse || [])
    } catch (error) {
      // Error silencioso para opciones
      setCategorias([])
      setCuentasContables([])
    } finally {
      setLoadingOptions(false)
    }
  }

  // Inicializar formulario
  useEffect(() => {
    if (open) {
      // Cargar opciones solo una vez cuando se abre el modal
      if (categorias.length === 0 || cuentasContables.length === 0) {
        loadOptions()
      }
      
      if (producto) {
        // Modo edición
        setFormData({
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          categoria_id: producto.categoria_id || null,
          unidad_medida: producto.unidad_medida,
          precio_venta: producto.precio_venta,
          stock_minimo: producto.stock_minimo,
          stock_maximo: producto.stock_maximo,
          stock_actual: producto.stock_actual,
          costo_promedio: producto.costo_promedio,
          moneda: producto.moneda,
          cuenta_inventario_id: producto.cuenta_inventario_id,
          cuenta_costo_id: producto.cuenta_costo_id,
          cuenta_venta_id: producto.cuenta_venta_id,

          activo: producto.activo,
          documento_tipo: '',
          documento_numero: '',
          documento_fecha: '',
          observaciones: ''
        })
      } else {
        // Modo creación
        setFormData({
          codigo: '',
          nombre: '',
          descripcion: '',
          categoria_id: null,
          unidad_medida: 'UND',
          precio_venta: 0,
          stock_minimo: 0,
          stock_maximo: 0,
          stock_actual: 0,
          costo_promedio: 0,
          moneda: false,
          cuenta_inventario_id: null,
          cuenta_costo_id: null,
          cuenta_venta_id: null,
          activo: true,
          documento_tipo: '',
          documento_numero: '',
          documento_fecha: '',
          observaciones: ''
        })
      }
      setErrors({})
    }
  }, [open, producto?.id]) // Solo depender de open y producto.id para evitar re-renders innecesarios

  const handleInputChange = (field: string, value: any) => {
    let processedValue = value
    
    // Convertir string a boolean para campos booleanos
    if (field === 'activo' && typeof value === 'string') {
      processedValue = value === 'true'
    }
    if (field === 'moneda' && typeof value === 'string') {
      processedValue = value === 'true'
    }
    
    // Convertir a número para campos numéricos
    if (['precio_venta', 'stock_minimo', 'stock_maximo', 'stock_actual', 'costo_promedio'].includes(field)) {
      processedValue = parseFloat(value) || 0
    }
    
    if (['categoria_id', 'cuenta_inventario_id', 'cuenta_costo_id', 'cuenta_venta_id'].includes(field)) {
      processedValue = value ? parseInt(value) : null
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
    // El servicio ProductosService maneja errores de validación (422) de manera especial
    // Los errores de validación tienen status 422 y errors como propiedad del error
    if (error.status === 422 && error.errors) {
      // Verificar errores específicos primero
      if (error.errors.configuracion) {
        toast.error(error.errors.configuracion[0])
        return
      }
      
      // Procesar errores de validación de campos
      const newFieldErrors: ValidationErrors = {}
      Object.keys(error.errors).forEach(field => {
        const errorMessages = error.errors[field]
        if (Array.isArray(errorMessages)) {
          newFieldErrors[field] = errorMessages
        }
      })
      setErrors(newFieldErrors)
      
      // No mostrar toast general si hay errores de validación específicos
      return
    }
    
    // Fallback para otros tipos de errores (estructura anterior)
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
    const errorMessage = error.message || errorData.message || 'Error al procesar la solicitud'
    
    // Capturar error específico de código duplicado
    if (errorMessage.includes('Ya existe un producto con este código')) {
      setErrors(prev => ({
        ...prev,
        codigo: ['Ya existe un producto con este código (incluso si está eliminado)']
      }))
      toast.error('El código del producto ya está en uso')
      return
    }

    toast.error(errorMessage)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    
    try {
      if (producto) {
        // Actualizar producto existente
        const updateData: UpdateProductoRequest = { ...formData }
        const response = await productosService.updateProducto(producto.id, updateData)
        
        if (response.success) {
          toast.success('Producto actualizado exitosamente')
          onSuccess()
          onClose()
        }
      } else {
        // Crear nuevo producto
        const createData: CreateProductoRequest = { ...formData } as CreateProductoRequest
        const response = await productosService.createProducto(createData)
        
        if (response.success) {
          toast.success('Producto creado exitosamente')
          onSuccess()
          onClose()
        }
      }
    } catch (error: any) {
      processBackendErrors(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  // Agrupar unidades de medida por categoría
  const unidadesPorCategoria = UNIDADES_MEDIDA.reduce((acc, unidad) => {
    if (!acc[unidad.categoria]) {
      acc[unidad.categoria] = []
    }
    acc[unidad.categoria].push(unidad)
    return acc
  }, {} as Record<string, typeof UNIDADES_MEDIDA>)

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        {producto ? 'Editar Producto' : 'Nuevo Producto'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Código *"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                error={!!errors.codigo}
                helperText={errors.codigo?.[0]}
                inputProps={{ maxLength: 50 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                error={!!errors.nombre}
                helperText={errors.nombre?.[0]}
                inputProps={{ maxLength: 255 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Descripción"
                multiline
                rows={3}
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                error={!!errors.descripcion}
                helperText={errors.descripcion?.[0]}
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.categoria_id}>
                <InputLabel>Categoría *</InputLabel>
                <Select
                  value={formData.categoria_id || ''}
                  label="Categoría"
                  onChange={(e) => handleInputChange('categoria_id', e.target.value)}
                  disabled={loadingOptions}
                >
                  <MenuItem value="">
                    <em>Sin categoría</em>
                  </MenuItem>
                  {Array.isArray(categorias) && categorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoria_id && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.categoria_id[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.unidad_medida}>
                <InputLabel>Unidad de Medida *</InputLabel>
                <Select
                  value={formData.unidad_medida}
                  label="Unidad de Medida *"
                  onChange={(e) => handleInputChange('unidad_medida', e.target.value)}
                >
                  {Object.entries(unidadesPorCategoria).map(([categoria, unidades]) => [
                    <MenuItem key={categoria} disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {categoria}
                    </MenuItem>,
                    ...unidades.map((unidad) => (
                      <MenuItem key={unidad.value} value={unidad.value} sx={{ pl: 3 }}>
                        {unidad.value} - {unidad.label}
                      </MenuItem>
                    ))
                  ])}
                </Select>
                {errors.unidad_medida && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.unidad_medida[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Precios y Costos */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Precios y Costos
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!errors.moneda}>
                <InputLabel>Moneda *</InputLabel>
                <Select
                  value={formData.moneda.toString()}
                  label="Moneda *"
                  onChange={(e) => handleInputChange('moneda', e.target.value)}
                >
                  {TIPOS_MONEDA.map((tipo) => (
                    <MenuItem key={tipo.value.toString()} value={tipo.value.toString()}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.moneda && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.moneda[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Costo Promedio *"
                value={formData.costo_promedio}
                onChange={(e) => handleInputChange('costo_promedio', e.target.value)}
                error={!!errors.costo_promedio}
                helperText={errors.costo_promedio?.[0]}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.moneda ? 'US$' : 'C$'}
                    </InputAdornment>
                  ),
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Precio de Venta *"
                value={formData.precio_venta}
                onChange={(e) => handleInputChange('precio_venta', e.target.value)}
                error={!!errors.precio_venta}
                helperText={errors.precio_venta?.[0]}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.moneda ? 'US$' : 'C$'}
                    </InputAdornment>
                  ),
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            {/* Inventario */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Control de Inventario
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Stock Mínimo *"
                value={formData.stock_minimo}
                onChange={(e) => handleInputChange('stock_minimo', e.target.value)}
                error={!!errors.stock_minimo}
                helperText={errors.stock_minimo?.[0]}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Stock Máximo *"
                value={formData.stock_maximo}
                onChange={(e) => handleInputChange('stock_maximo', e.target.value)}
                error={!!errors.stock_maximo}
                helperText={errors.stock_maximo?.[0]}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            {/* Campos de Inventario Inicial - Solo visible al crear nuevo producto si hay stock */}
            {!producto && formData.stock_actual > 0 && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                    Datos del Inventario Inicial
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha del Documento"
                    type="date"
                    value={formData.documento_fecha}
                    onChange={(e) => handleInputChange('documento_fecha', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Número de Documento"
                    value={formData.documento_numero}
                    onChange={(e) => handleInputChange('documento_numero', e.target.value)}
                    inputProps={{ maxLength: 100 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Observaciones Inventario Inicial"
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    inputProps={{ maxLength: 1000 }}
                    placeholder="Observaciones para el movimiento de entrada inicial"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Control de Inventario
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Inventario */}
            <Grid item xs={12} md={4}>
              <TextField 
                fullWidth 
                size="small"
                type="number"
                label="Stock Actual *"
                value={formData.stock_actual}
                onChange={(e) => handleInputChange('stock_actual', e.target.value)}
                error={!!errors.stock_actual}
                helperText={errors.stock_actual?.[0]}
                InputProps={{
                  inputProps: { min: 0 }
                }}
                disabled={!!producto} // Si es edición, deshabilitar stock actual (o manejarlo via ajustes)
              />
            </Grid>

            {/* Cuentas Contables */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Cuentas Contables
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!errors.cuenta_inventario_id}>
                <InputLabel>Cuenta de Inventario *</InputLabel>
                <Select
                  value={formData.cuenta_inventario_id || ''}
                  label="Cuenta de Inventario *"
                  onChange={(e) => handleInputChange('cuenta_inventario_id', e.target.value)}
                  disabled={loadingOptions}
                >
                  <MenuItem value="">
                    <em>Seleccionar cuenta</em>
                  </MenuItem>
                  {Array.isArray(cuentasContables) && cuentasContables.map((cuenta) => (
                    <MenuItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cuenta_inventario_id && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.cuenta_inventario_id[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!errors.cuenta_costo_id}>
                <InputLabel>Cuenta de Costo *</InputLabel>
                <Select
                  value={formData.cuenta_costo_id || ''}
                  label="Cuenta de Costo *"
                  onChange={(e) => handleInputChange('cuenta_costo_id', e.target.value)}
                  disabled={loadingOptions}
                >
                  <MenuItem value="">
                    <em>Seleccionar cuenta</em>
                  </MenuItem>
                  {Array.isArray(cuentasContables) && cuentasContables.map((cuenta) => (
                    <MenuItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cuenta_costo_id && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.cuenta_costo_id[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" error={!!errors.cuenta_venta_id}>
                <InputLabel>Cuenta de Venta *</InputLabel>
                <Select
                  value={formData.cuenta_venta_id || ''}
                  label="Cuenta de Venta *"
                  onChange={(e) => handleInputChange('cuenta_venta_id', e.target.value)}
                  disabled={loadingOptions}
                >
                  <MenuItem value="">
                    <em>Seleccionar cuenta</em>
                  </MenuItem>
                  {Array.isArray(cuentasContables) && cuentasContables.map((cuenta) => (
                    <MenuItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo} - {cuenta.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cuenta_venta_id && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.cuenta_venta_id[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Estado */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Estado
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.activo}>
                <InputLabel>Estado *</InputLabel>
                <Select
                  value={formData.activo.toString()}
                  label="Estado *"
                  onChange={(e) => handleInputChange('activo', e.target.value)}
                >
                  {ESTADOS_PRODUCTO.map((estado) => (
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
          </Grid>
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
          disabled={loading || loadingOptions}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : (producto ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
