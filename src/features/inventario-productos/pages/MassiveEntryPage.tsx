'use client'

import movimientosService from '@/features/inventario-movimientos/services/services_movimientosService'
import { ProductosService } from '@/features/inventario-productos/services/services_productosService'
import { CategoriaOption, InventarioProducto } from '@/features/inventario-productos/types/types_index'
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
    Save as SaveIcon
} from '@mui/icons-material'
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface ProductRow {
    producto_id: number | ''
    cantidad: number | ''
    costo_unitario: number | ''
    stock_actual: number
    costo_promedio_actual: number
}

const MassiveEntryPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categorias, setCategorias] = useState<CategoriaOption[]>([])
    const [selectedCategoria, setSelectedCategoria] = useState<number | ''>('')
    const [productosCategoria, setProductosCategoria] = useState<InventarioProducto[]>([])
    
    // Rows state
    const [rows, setRows] = useState<ProductRow[]>([
        { producto_id: '', cantidad: '', costo_unitario: '', stock_actual: 0, costo_promedio_actual: 0 }
    ])

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        referencia: '',
        observacion: 'Entrada Masiva de Inventario'
    })

    useEffect(() => {
        loadCategorias()
    }, [])

    useEffect(() => {
        if (selectedCategoria) {
            loadProductosPorCategoria(selectedCategoria as number)
        } else {
            setProductosCategoria([])
        }
    }, [selectedCategoria])

    const loadCategorias = async () => {
        try {
            const data = await ProductosService.getCategorias()
            setCategorias(data || [])
        } catch (error) {
            console.error('Error loading categories:', error)
            toast.error('Error al cargar categorías')
        }
    }

    const loadProductosPorCategoria = async (categoriaId: number) => {
        try {
            const response = await ProductosService.getProductos({
                categoria_id: categoriaId,
                per_page: 100,
                activo: true
            })
            setProductosCategoria(response.data || [])
        } catch (error) {
            console.error('Error loading products:', error)
            toast.error('Error al cargar productos de la categoría')
        }
    }

    const handleAddRow = () => {
        setRows([...rows, { producto_id: '', cantidad: '', costo_unitario: '', stock_actual: 0, costo_promedio_actual: 0 }])
    }

    const handleRemoveRow = (index: number) => {
        const newRows = rows.filter((_, i) => i !== index)
        setRows(newRows)
    }

    const handleRowChange = (index: number, field: keyof ProductRow, value: any) => {
        const newRows = [...rows]
        
        if (field === 'producto_id') {
            const producto = productosCategoria.find(p => p.id === value)
            if (producto) {
                newRows[index] = {
                    ...newRows[index],
                    producto_id: value,
                    stock_actual: Number(producto.stock_actual),
                    costo_promedio_actual: Number(producto.costo_promedio),
                    costo_unitario: Number(producto.costo_promedio),
                }
            }
        } else {
            newRows[index] = { ...newRows[index], [field]: value }
        }
        
        setRows(newRows)
    }

    const calculateEstimatedCost = (currentCost: number, currentStock: number, newQty: number, newUnitCost: number) => {
        const totalValue = (currentCost * currentStock) + (newQty * newUnitCost)
        const totalStock = currentStock + newQty
        return totalStock > 0 ? totalValue / totalStock : 0
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount)
    }

    const handleSaveClick = () => {
        // Validate rows
        const validRows = rows.filter(r => r.producto_id && r.cantidad && r.costo_unitario)
        
        if (validRows.length === 0) {
            toast.error('Debe agregar al menos un producto con cantidad y costo válidos')
            return
        }

        setModalOpen(true)
    }

    const handleConfirmSave = async () => {
        // Validate modal fields
        if (!formData.fecha) {
            toast.error('La fecha es requerida')
            return
        }
        if (!formData.referencia) {
            toast.error('El número de referencia es requerido')
            return
        }
        if (!formData.observacion) {
            toast.error('La observación es requerida')
            return
        }

        setLoading(true)
        try {
            const validRows = rows.filter(r => r.producto_id && r.cantidad && r.costo_unitario)
            
            const payload = {
                items: validRows.map(r => ({
                    producto_id: Number(r.producto_id),
                    cantidad: Number(r.cantidad),
                    costo_unitario: Number(r.costo_unitario)
                })),
                documento_fecha: formData.fecha,
                documento_numero: formData.referencia,
                observaciones: formData.observacion
            }

            // Note: MovimientosService export might be default or named, need to match import
            await movimientosService.createMassive(payload)
            toast.success('Entrada masiva registrada exitosamente')
            setModalOpen(false)
            setTimeout(() => {
                router.push('/inventario/productos')
            }, 1500)
        } catch (error: any) {
            console.error('Error saving massive entry:', error)
            toast.error(error.message || 'Error al guardar la entrada masiva')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Entrada Masiva de Productos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Registre múltiples entradas de inventario seleccionando una categoría
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                >
                    Volver
                </Button>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Categoría"
                                value={selectedCategoria}
                                onChange={(e) => setSelectedCategoria(e.target.value === '' ? '' : Number(e.target.value))}
                                helperText="Seleccione una categoría para filtrar los productos"
                            >
                                <MenuItem value="">
                                    <em>Seleccione una categoría</em>
                                </MenuItem>
                                {categorias.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell width="30%">Producto</TableCell>
                            <TableCell width="10%" align="center">Stock Actual</TableCell>
                            <TableCell width="10%" align="center">Costo Prom. Actual</TableCell>
                            <TableCell width="15%">Cantidad a Ingresar</TableCell>
                            <TableCell width="15%">Costo Unitario</TableCell>
                            <TableCell width="15%" align="center">Nuevo Costo Prom. (Est)</TableCell>
                            <TableCell width="5%" align="center"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => {
                            const estCost = (row.stock_actual !== undefined && row.cantidad && row.costo_unitario) 
                                ? calculateEstimatedCost(
                                    Number(row.costo_promedio_actual), 
                                    Number(row.stock_actual), 
                                    Number(row.cantidad), 
                                    Number(row.costo_unitario)
                                  )
                                : null

                            return (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Autocomplete<InventarioProducto>
                                            options={productosCategoria}
                                            getOptionLabel={(option: InventarioProducto) => `${option.nombre} - ${option.codigo}`}
                                            value={productosCategoria.find(p => p.id === row.producto_id) || null}
                                            onChange={(_, newValue: InventarioProducto | null) => handleRowChange(index, 'producto_id', newValue ? newValue.id : '')}
                                            disabled={!selectedCategoria}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    size="small"
                                                    label="Seleccionar Producto"
                                                    placeholder="Buscar..."
                                                />
                                            )}
                                            noOptionsText="No hay productos"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.producto_id ? row.stock_actual : '-'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {row.producto_id ? formatCurrency(row.costo_promedio_actual) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={row.cantidad}
                                            onChange={(e) => handleRowChange(index, 'cantidad', e.target.value)}
                                            disabled={!row.producto_id}
                                            InputProps={{ inputProps: { min: 1 } }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            value={row.costo_unitario}
                                            onChange={(e) => handleRowChange(index, 'costo_unitario', e.target.value)}
                                            disabled={!row.producto_id}
                                            InputProps={{ 
                                                inputProps: { min: 0, step: 0.01 },
                                                startAdornment: <InputAdornment position="start">C$</InputAdornment>
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {estCost !== null ? (
                                            <Typography variant="body2" color="primary" fontWeight="bold">
                                                {formatCurrency(estCost)}
                                            </Typography>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleRemoveRow(index)}
                                            disabled={rows.length === 1}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddRow}
                    variant="outlined"
                >
                    Agregar Fila
                </Button>
                <Button
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSaveClick}
                    variant="contained"
                    disabled={loading}
                    size="large"
                >
                    Guardar Entrada Masiva
                </Button>
            </Box>
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirmar Entrada Masiva</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Fecha"
                            type="date"
                            fullWidth
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            required
                        />
                        <TextField
                            label="N° Referencia / Factura"
                            fullWidth
                            value={formData.referencia}
                            onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                            placeholder="Ej. FACT-00123"
                            required
                            autoFocus
                        />
                        <TextField
                            label="Observaciones"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.observacion}
                            onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                            placeholder="Detalle el motivo de la entrada..."
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleConfirmSave} 
                        variant="contained" 
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    >
                        Confirmar y Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default MassiveEntryPage
