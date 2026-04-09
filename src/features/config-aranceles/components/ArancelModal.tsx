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
    FormControl,
    FormControlLabel,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import {
    Divider,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material'
import ProductosSearchModal from '../../recibos/components/ProductosSearchModal'
import arancelService from '../services/arancelService'
import type { ConfigArancel, CreateArancelRequest, CuentaContable, ValidationErrors } from '../types'
import { getMonedaSymbol } from '../types'

interface ArancelModalProps {
  open: boolean
  mode: 'create' | 'edit'
  arancel?: ConfigArancel
  onClose: () => void
  onSuccess: () => void
}

const ArancelModal: React.FC<ArancelModalProps> = ({
  open,
  mode,
  arancel,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateArancelRequest>({
    codigo: '',
    nombre: '',
    precio: 0,
    moneda: false, // false = Córdoba por defecto
    cuenta_debito_id: null,
    cuenta_credito_id: null,
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  
  // Estados para productos
  // Estados para productos
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<{
    producto_id: number
    nombre: string
    cantidad: number
    codigo: string
    precio: number
  }[]>([])

  // Resetear formulario cuando cambie el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && arancel) {
        setFormData({
          codigo: arancel.codigo,
          nombre: arancel.nombre,
          precio: arancel.precio,
          moneda: arancel.moneda,
          cuenta_debito_id: arancel.cuenta_debito_id,
          cuenta_credito_id: arancel.cuenta_credito_id,
          activo: arancel.activo
        })
        
        // Cargar productos existentes si los hay
        if (arancel.productos) {
          setSelectedProducts(arancel.productos.map(p => ({
            producto_id: p.id,
            nombre: p.nombre,
            cantidad: p.pivot.cantidad,
            codigo: p.codigo,
            precio: Number(p.precio_venta || 0)
          })))
        } else {
            setSelectedProducts([])
        }
      } else {
        setFormData({
          codigo: '',
          nombre: '',
          precio: 0,
          moneda: false,
          cuenta_debito_id: null,
          cuenta_credito_id: null,
          activo: true
        })
        setSelectedProducts([])
      }
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, arancel])

  // Cargar cuentas contables cuando se abra el modal
  useEffect(() => {
    if (open) {
      loadCuentasContables()
    }
  }, [open])

  const loadCuentasContables = async () => {
    setLoadingCuentas(true)
    try {
      const cuentas = await arancelService.getCatalogoCuentas()
      setCuentasContables(cuentas)
    } catch (error) {
      console.error('Error al cargar cuentas contables:', error)
    } finally {
      setLoadingCuentas(false)
    }
  }

  const handleInputChange = (field: keyof CreateArancelRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value: any = event.target.value
    
    if (field === 'precio') {
      value = parseFloat(event.target.value) || 0
    } else if (field === 'activo') {
      value = event.target.checked
    }
    
    setFormData((prev: CreateArancelRequest) => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  const handleSelectChange = (field: 'cuenta_debito_id' | 'cuenta_credito_id') => (
    event: any
  ) => {
    const value = event.target.value === '' ? null : Number(event.target.value)
    setFormData((prev: CreateArancelRequest) => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  const handleMonedaChange = (event: any) => {
    const value = event.target.value === 'true'
    setFormData((prev: CreateArancelRequest) => ({ ...prev, moneda: value }))
    
    // Limpiar error del campo
    if (errors.moneda) {
      setErrors(prev => ({ ...prev, moneda: [] }))
    }
  }

  // Effect para actualizar el precio total basado en productos
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const total = selectedProducts.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)
      setFormData(prev => ({ ...prev, precio: total }))
    }
  }, [selectedProducts])

  // Handlers para productos
  const handleAddProduct = (detalle: any) => {
    // Verificar si ya existe
    const exists = selectedProducts.find(p => p.producto_id === detalle.producto_id)
    if (exists) {
        // Actualizar cantidad
        setSelectedProducts((prev: any[]) => prev.map((p: any) => 
            p.producto_id === detalle.producto_id 
                ? { ...p, cantidad: p.cantidad + (detalle.cantidad || 1) }
                : p
        ))
    } else {
        setSelectedProducts((prev: any[]) => [...prev, {
            producto_id: detalle.producto_id,
            nombre: detalle.concepto, // ProductosSearchModal usa 'concepto' como nombre
            cantidad: detalle.cantidad || 1,
            codigo: '', // El modal actual no devuelve código en el objeto detalle, pero no es crítico para guardar
            precio: detalle.monto || 0
        }])
    }
    toast.success('Producto agregado')
  }

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts((prev: any[]) => prev.filter((p: any) => p.producto_id !== productId))
  }

  const processBackendErrors = (errorData: any) => {
    // Limpiar errores previos
    setErrors({})
    setGeneralError(null)

    if (!errorData) return

    // Verificar errores específicos primero
    if (errorData.errors?.configuracion) {
      toast.error(errorData.errors.configuracion[0])
      return
    }

    // Si hay errores de validación de campos
    if (errorData.errors && typeof errorData.errors === 'object') {
      const newFieldErrors: ValidationErrors = {}
      let hasFieldErrors = false

      Object.keys(errorData.errors).forEach(field => {
        const errorMessages = errorData.errors[field]
        if (Array.isArray(errorMessages) && errorMessages.length > 0) {
          newFieldErrors[field] = errorMessages
          hasFieldErrors = true
        }
      })

      if (hasFieldErrors) {
        setErrors(newFieldErrors)
        return
      }
    }

    // Error general
    const message = errorData.message || 'Error al procesar la solicitud'
    setGeneralError(message)
    toast.error(message)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    setGeneralError(null)

    try {
      let response

      if (mode === 'create') {
        response = await arancelService.createArancel({
            ...formData,
            productos: selectedProducts.map(p => ({
                producto_id: p.producto_id,
                cantidad: p.cantidad
            }))
        })
      } else if (arancel) {
        response = await arancelService.updateArancel(arancel.id, {
            ...formData,
            productos: selectedProducts.map(p => ({
                producto_id: p.producto_id,
                cantidad: p.cantidad
            }))
        })
      }

      if (response?.success) {
        toast.success(
          mode === 'create' 
            ? 'Arancel creado exitosamente' 
            : 'Arancel actualizado exitosamente'
        )
        onSuccess()
        onClose()
      } else {
        processBackendErrors(response)
      }
    } catch (error: any) {
      processBackendErrors(error.data || error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const isFormValid = () => {
    return formData.codigo.trim() !== '' && 
           formData.nombre.trim() !== '' && 
           formData.precio > 0
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {mode === 'create' ? 'Crear Nuevo Arancel' : 'Editar Arancel'}
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
            label="Código"
            value={formData.codigo}
            onChange={handleInputChange('codigo')}
            error={!!errors.codigo}
            helperText={errors.codigo?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            placeholder="Ej: ARANCEL001"
          />

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
            placeholder="Ej: Matrícula Inicial"
          />

          <TextField
            label="Precio"
            type="number"
            value={formData.precio}
            onChange={handleInputChange('precio')}
            error={!!errors.precio}
            helperText={errors.precio?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            inputProps={{ 
              min: 0, 
              step: 0.01 
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {getMonedaSymbol(formData.moneda)}
                </InputAdornment>
              )
            }}
          />

          <FormControl fullWidth size="small" error={!!errors.moneda}>
            <InputLabel>Moneda</InputLabel>
            <Select
              value={formData.moneda.toString()}
              onChange={handleMonedaChange}
              label="Moneda"
              disabled={loading}
            >
              <MenuItem value="false">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span" sx={{ fontWeight: 'bold' }}>C$</Typography>
                  <Typography component="span">Córdoba</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="true">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span" sx={{ fontWeight: 'bold' }}>$</Typography>
                  <Typography component="span">Dólar</Typography>
                </Box>
              </MenuItem>
            </Select>
            {errors.moneda && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.moneda[0]}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth size="small" error={!!errors.cuenta_debito_id}>
            <InputLabel>Cuenta Débito</InputLabel>
            <Select
              value={formData.cuenta_debito_id || ''}
              onChange={handleSelectChange('cuenta_debito_id')}
              label="Cuenta Débito"
              disabled={loading || loadingCuentas}
            >
              <MenuItem value="">
                <em>Seleccionar cuenta</em>
              </MenuItem>
              {cuentasContables.map((cuenta) => (
                <MenuItem key={cuenta.id} value={cuenta.id}>
                  {cuenta.codigo} - {cuenta.nombre}
                </MenuItem>
              ))}
            </Select>
            {errors.cuenta_debito_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.cuenta_debito_id[0]}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth size="small" error={!!errors.cuenta_credito_id}>
            <InputLabel>Cuenta Crédito</InputLabel>
            <Select
              value={formData.cuenta_credito_id || ''}
              onChange={handleSelectChange('cuenta_credito_id')}
              label="Cuenta Crédito"
              disabled={loading || loadingCuentas}
            >
              <MenuItem value="">
                <em>Seleccionar cuenta</em>
              </MenuItem>
              {cuentasContables.map((cuenta) => (
                <MenuItem key={cuenta.id} value={cuenta.id}>
                  {cuenta.codigo} - {cuenta.nombre}
                </MenuItem>
              ))}
            </Select>
            {errors.cuenta_credito_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.cuenta_credito_id[0]}
              </Typography>
            )}
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={handleInputChange('activo')}
                disabled={loading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                {formData.activo ? 'Activo' : 'Inactivo'}
              </Typography>
            }
          />
          
          <Divider sx={{ my: 1 }} />
          
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Productos Asociados (Combo)
                </Typography>
                <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={() => setShowProductSearch(true)}
                >
                    Agregar Producto
                </Button>
            </Box>
            
            {selectedProducts.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="center" width={100}>Cantidad</TableCell>
                                <TableCell align="center" width={80}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {selectedProducts.map((prod) => (
                                <TableRow key={prod.producto_id}>
                                    <TableCell>{prod.nombre}</TableCell>
                                    <TableCell align="center">{prod.cantidad}</TableCell>
                                    <TableCell align="center">
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleRemoveProduct(prod.producto_id)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    No hay productos asociados. Este arancel será un servicio simple.
                </Typography>
            )}
          </Box>
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
          disabled={loading || !isFormValid()}
          variant="contained"
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Guardando...' : (mode === 'create' ? 'Crear' : 'Actualizar')}
        </Button>
      </DialogActions>
      <ProductosSearchModal
        open={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        onAdd={handleAddProduct}
      />
    </Dialog>
  )
}

export default ArancelModal
