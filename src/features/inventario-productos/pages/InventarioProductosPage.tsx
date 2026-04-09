'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'

import {
    Add as AddIcon,
    Clear as ClearIcon,
    Delete as DeleteIcon,
    CloudDownload as DownloadIcon,
    Edit as EditIcon,
    FilterList as FilterIcon,
    History as HistoryIcon,
    Inventory as InventoryIcon,
    TrendingDown as LowStockIcon,
    SwapHoriz as MovimientosIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import InventarioProductoForm from '../components/InventarioProductoForm'
import productosService, { ProductosService } from '../services/services_productosService'
import type {
    CategoriaOption,
    InventarioProducto,
    PaginatedResponse,
    ProductoFilters
} from '../types/types_index'
import { ESTADOS_PRODUCTO, UNIDADES_MEDIDA } from '../types/types_index'

export default function InventarioProductosPage() {
  const router = useRouter()
  
  // Estados principales
  const [productos, setProductos] = useState<InventarioProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Estados de modales
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<InventarioProducto | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState<InventarioProducto | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ProductoFilters>({
    categoria_id: null,
    activo: null,
    stock_bajo: false,
    unidad_medida: null,
    moneda: null
  })
  const [showFilters, setShowFilters] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  
  // Estados de carga
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Cargar categorías para filtros
  const loadCategorias = async () => {
    try {
      const response = await ProductosService.getCategorias()
      setCategorias(response || [])
    } catch (error) {
      // Error silencioso para categorías - asegurar que sea un array
      setCategorias([])
    }
  }

  // Cargar productos con paginación y filtros
  const loadProductos = useCallback(async (page = 0, size = 10, search = '', currentFilters: ProductoFilters = {}) => {
    try {
      setLoading(true)
      
      const params = {
        page: page + 1, // Backend usa páginas basadas en 1
        per_page: size,
        search: search.trim() || undefined,
        categoria_id: currentFilters.categoria_id || undefined,
        activo: currentFilters.activo !== null ? currentFilters.activo : undefined,
        stock_bajo: currentFilters.stock_bajo || undefined,
        unidad_medida: currentFilters.unidad_medida || undefined,
        moneda: currentFilters.moneda !== null ? currentFilters.moneda : undefined
      }
      
      const response: PaginatedResponse<InventarioProducto> = await ProductosService.getProductos(params)
      
      setProductos(response.data || [])
      setTotalItems(response.total || 0)
      setCurrentPage(page)
    } catch (error: any) {
      toast.error('Error al cargar productos')
      setProductos([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, []) // Sin dependencias para evitar recreaciones

  // Efectos
  useEffect(() => {
    const initializeData = async () => {
      await loadCategorias()
      await loadProductos(0, itemsPerPage, searchTerm, filters)
    }
    
    initializeData()
  }, []) // Eliminar loadProductos como dependencia para evitar llamadas duplicadas

  // Handlers de búsqueda y filtros
  const handleSearch = () => {
    setCurrentPage(0)
    loadProductos(0, itemsPerPage, searchTerm, filters)
  }

  const handleFilterChange = (field: keyof ProductoFilters, value: any) => {
    const newFilters = {
      ...filters,
      [field]: value === '' ? null : value
    }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    setCurrentPage(0)
    loadProductos(0, itemsPerPage, searchTerm, filters)
    setShowFilters(false)
  }

  const clearFilters = () => {
    const emptyFilters: ProductoFilters = {
      categoria_id: null,
      activo: null,
      stock_bajo: false,
      unidad_medida: null,
      moneda: null
    }
    setFilters(emptyFilters)
    setSearchTerm('')
    setCurrentPage(0)
    loadProductos(0, itemsPerPage, '', emptyFilters)
    setShowFilters(false)
  }

  // Handlers de paginación
  const handlePageChange = (event: unknown, newPage: number) => {
    loadProductos(newPage, itemsPerPage, searchTerm, filters)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10)
    setItemsPerPage(newSize)
    setCurrentPage(0)
    loadProductos(0, newSize, searchTerm, filters)
  }

  // Handlers de CRUD
  const handleCreate = () => {
    setSelectedProducto(null)
    setFormOpen(true)
  }

  const handleEdit = (producto: InventarioProducto) => {
    setSelectedProducto(producto)
    setFormOpen(true)
  }

  const handleDelete = (producto: InventarioProducto) => {
    setProductoToDelete(producto)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!productoToDelete) return
    
    setDeleting(true)
    try {
      await productosService.deleteProducto(productoToDelete.id)
      toast.success('Producto eliminado exitosamente')
      loadProductos(currentPage, itemsPerPage, searchTerm, filters)
      setDeleteDialogOpen(false)
      setProductoToDelete(null)
    } catch (error: any) {
      const errorData = error.data || {}
      toast.error(errorData.message || 'Error al eliminar producto')
    } finally {
      setDeleting(false)
    }
  }

  // Función para manejar la navegación a movimientos
  const handleViewMovimientos = (producto: InventarioProducto) => {
    router.push(`/inventario-productos/${producto.id}/movimientos`)
  }

  // Función para manejar la auditoría
  const handleViewAudit = (producto: InventarioProducto) => {
    setAuditTarget({ model: 'inventario_producto', id: producto.id })
    setAuditOpen(true)
  }

  // Handler de refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadProductos(currentPage, itemsPerPage, searchTerm, filters)
    setRefreshing(false)
    toast.success('Datos actualizados')
  }

  // Handlers de Exportación
  const handlePreviewPdf = async () => {
    setExporting(true)
    try {
      const safeFilters = {
        ...filters,
        categoria_id: filters.categoria_id ?? undefined,
        activo: filters.activo ?? undefined,
        unidad_medida: filters.unidad_medida ?? undefined,
        moneda: filters.moneda ?? undefined
      }
      
      await productosService.previewPdf({
        ...safeFilters,
        search: searchTerm.trim() || undefined
      })
    } catch (error) {
      toast.error('Error al generar vista previa del PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadPdf = async () => {
    setExporting(true)
    try {
      const safeFilters = {
        ...filters,
        categoria_id: filters.categoria_id ?? undefined,
        activo: filters.activo ?? undefined,
        unidad_medida: filters.unidad_medida ?? undefined,
        moneda: filters.moneda ?? undefined
      }
      
      await productosService.downloadPdf({
        ...safeFilters,
        search: searchTerm.trim() || undefined
      })
    } catch (error) {
      toast.error('Error al descargar PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const safeFilters = {
        ...filters,
        categoria_id: filters.categoria_id ?? undefined,
        activo: filters.activo ?? undefined,
        unidad_medida: filters.unidad_medida ?? undefined,
        moneda: filters.moneda ?? undefined
      }

      await productosService.exportExcel({
        ...safeFilters,
        search: searchTerm.trim() || undefined
      })
    } catch (error) {
      toast.error('Error al exportar Excel')
    } finally {
      setExporting(false)
    }
  }

  // Funciones de utilidad
  const formatCurrency = (amount: number, isUSD: boolean) => {
    const symbol = isUSD ? 'US$' : 'C$'
    return `${symbol} ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStockStatus = (producto: InventarioProducto) => {
    const actual = Number(producto.stock_actual)
    const minimo = Number(producto.stock_minimo)
    const maximo = Number(producto.stock_maximo)

    if (actual <= minimo) {
      return { color: 'error' as const, label: 'Stock Bajo' }
    }
    if (actual >= maximo) {
      return { color: 'warning' as const, label: 'Stock Alto' }
    }
    return { color: 'success' as const, label: 'Stock Normal' }
  }

  const getUnidadMedidaLabel = (codigo: string) => {
    const unidad = UNIDADES_MEDIDA.find(u => u.value === codigo)
    return unidad ? `${unidad.value} - ${unidad.label}` : codigo
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Inventario - Productos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión completa de productos del inventario
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            Actualizar
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<VisibilityIcon />}
            onClick={handlePreviewPdf}
            disabled={exporting}
          >
            Ver PDF
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            disabled={exporting}
          >
            Descargar
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<InventoryIcon />}
            onClick={handleExportExcel}
            disabled={exporting}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {/* Filtros y Búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                >
                  Buscar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filtros
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>

            {/* Panel de Filtros */}
            {showFilters && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Filtros Avanzados
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={filters.categoria_id || ''}
                          label="Categoría"
                          onChange={(e) => handleFilterChange('categoria_id', e.target.value)}
                        >
                          <MenuItem value="">Todas</MenuItem>
                          {Array.isArray(categorias) && categorias.map((categoria) => (
                            <MenuItem key={categoria.id} value={categoria.id}>
                              {categoria.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select
                          value={filters.activo !== null && filters.activo !== undefined ? filters.activo.toString() : ''}
                          label="Estado"
                          onChange={(e) => handleFilterChange('activo', e.target.value === '' ? null : e.target.value === 'true')}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          {ESTADOS_PRODUCTO.map((estado) => (
                            <MenuItem key={estado.value.toString()} value={estado.value.toString()}>
                              {estado.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unidad de Medida</InputLabel>
                        <Select
                          value={filters.unidad_medida || ''}
                          label="Unidad de Medida"
                          onChange={(e) => handleFilterChange('unidad_medida', e.target.value)}
                        >
                          <MenuItem value="">Todas</MenuItem>
                          {UNIDADES_MEDIDA.map((unidad) => (
                            <MenuItem key={unidad.value} value={unidad.value}>
                              {unidad.value} - {unidad.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Moneda</InputLabel>
                        <Select
                          value={filters.moneda !== null && filters.moneda !== undefined ? filters.moneda.toString() : ''}
                          label="Moneda"
                          onChange={(e) => handleFilterChange('moneda', e.target.value === '' ? null : e.target.value === 'true')}
                        >
                          <MenuItem value="">Todas</MenuItem>
                          <MenuItem value="false">Córdobas (C$)</MenuItem>
                          <MenuItem value="true">Dólares (US$)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={() => setShowFilters(false)}>
                      Cancelar
                    </Button>
                    <Button variant="contained" onClick={applyFilters}>
                      Aplicar Filtros
                    </Button>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de Productos */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Categoría</strong></TableCell>
                  <TableCell><strong>Unidad</strong></TableCell>
                  <TableCell align="right"><strong>Precio Venta</strong></TableCell>
                  <TableCell align="center"><strong>Stock</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Skeleton loading
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={200} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                    </TableRow>
                  ))
                ) : productos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <InventoryIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                        <Typography variant="body1" color="text.secondary">
                          No se encontraron productos
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                          Crear Primer Producto
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(productos) && productos.map((producto) => {
                    const stockStatus = getStockStatus(producto)
                    return (
                      <TableRow key={producto.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {producto.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {producto.nombre}
                            </Typography>
                            {producto.descripcion && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {producto.descripcion}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {producto.categoria_id ? 
                              categorias.find(cat => cat.id === producto.categoria_id)?.nombre || 'Sin categoría'
                              : 'Sin categoría'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getUnidadMedidaLabel(producto.unidad_medida)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(producto.precio_venta, producto.moneda)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {producto.stock_actual}
                            </Typography>
                            <Chip
                              size="small"
                              label={stockStatus.label}
                              color={stockStatus.color}
                              icon={producto.stock_actual <= producto.stock_minimo ? <LowStockIcon /> : undefined}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={producto.activo ? 'Activo' : 'Inactivo'}
                            color={producto.activo ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(producto)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Movimientos">
                              <IconButton
                                size="small"
                                onClick={() => handleViewMovimientos(producto)}
                                color="secondary"
                              >
                                <MovimientosIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <PermissionGuard permission="auditoria.ver">
                              <Tooltip title="Auditoría">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewAudit(producto)}
                                  color="info"
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(producto)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {!loading && productos.length > 0 && (
            <TablePagination
              component="div"
              count={totalItems}
              page={currentPage}
              onPageChange={handlePageChange}
              rowsPerPage={itemsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulario */}
      <InventarioProductoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        producto={selectedProducto}
        onSuccess={() => {
          loadProductos(currentPage, itemsPerPage, searchTerm, filters)
        }}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el producto &quot;{productoToDelete?.nombre}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Box>
  )
}
