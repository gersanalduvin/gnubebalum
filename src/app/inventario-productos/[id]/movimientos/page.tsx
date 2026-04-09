'use client'

import { useCallback, useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import {
    Alert,
    Box,
    Breadcrumbs,
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
    Link,
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
    Typography
} from '@mui/material'

import {
    Add as AddIcon,
    SwapVert as AjusteIcon,
    ArrowBack as ArrowBackIcon,
    Clear as ClearIcon,
    Delete as DeleteIcon,
    TrendingUp as EntradaIcon,
    Refresh as RefreshIcon,
    TrendingDown as SalidaIcon,
    Search as SearchIcon,
    SwapHoriz as TransferenciaIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import AuditoriaViewer from '@/features/inventario-movimientos/components/AuditoriaViewer'
import MovimientoForm from '@/features/inventario-movimientos/components/MovimientoForm'
import movimientosService, {
    MovimientosService
} from '@/features/inventario-movimientos/services/services_movimientosService'
import type {
    MovimientoFilters,
    MovimientoInventario,
    TipoMovimiento
} from '@/features/inventario-movimientos/types/types_index'
import {
    getTipoMovimientoColor,
    getTipoMovimientoLabel,
    TIPOS_MOVIMIENTO
} from '@/features/inventario-movimientos/types/types_index'
import { ProductosService } from '@/features/inventario-productos/services/services_productosService'
import type { InventarioProducto } from '@/features/inventario-productos/types/types_index'

export default function MovimientosProductoPage() {
  const params = useParams()
  const router = useRouter()
  const productoId = parseInt(params.id as string)

  // Estados principales
  const [producto, setProducto] = useState<InventarioProducto | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [totalItems, setTotalItems] = useState(0)

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<MovimientoFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // Estados de modales
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoInventario | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [movimientoToDelete, setMovimientoToDelete] = useState<MovimientoInventario | null>(null)
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)
  const [selectedMovimientoForAudit, setSelectedMovimientoForAudit] = useState<MovimientoInventario | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedMovimientoForDetail, setSelectedMovimientoForDetail] = useState<MovimientoInventario | null>(null)

  // Cargar datos del producto
  const loadProducto = useCallback(async () => {
    try {
      const data = await ProductosService.getProductoById(productoId)
      setProducto(data)
    } catch (error: any) {
      toast.error('Error al cargar el producto')
      router.push('/inventario/productos')
    }
  }, [productoId, router])

  // Cargar movimientos
  const loadMovimientos = useCallback(
    async (page: number = 0, perPage: number = 15, search: string = '', currentFilters: MovimientoFilters = {}) => {
      try {
        setLoading(true)

        // Si hay búsqueda, usar el método de búsqueda específico
        if (search.trim()) {
          const searchResults = await MovimientosService.searchMovimientos({
            q: search.trim(),
            tipo_movimiento: currentFilters.tipo_movimiento
          })

          // Simular paginación para los resultados de búsqueda
          const startIndex = page * perPage
          const endIndex = startIndex + perPage
          const paginatedResults = searchResults.slice(startIndex, endIndex)

          setMovimientos(paginatedResults)
          setTotalItems(searchResults.length)
          setCurrentPage(page)
          return
        }

        // Usar getMovimientos normal para filtros sin búsqueda
        const params = {
          page: page + 1, // La API usa páginas basadas en 1
          per_page: perPage,
          producto_id: productoId,
          ...currentFilters
        }

        const response = await MovimientosService.getMovimientos(params)

        setMovimientos(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage((response.current_page || 1) - 1) // Convertir a base 0 para MUI
      } catch (error: any) {
        toast.error('Error al cargar movimientos')
        setMovimientos([])
        setTotalItems(0)
      } finally {
        setLoading(false)
      }
    },
    [productoId]
  )

  // Efectos
  useEffect(() => {
    if (productoId) {
      loadProducto()
      loadMovimientos()
    }
  }, [productoId, loadProducto, loadMovimientos])

  // Handlers de paginación
  const handlePageChange = (event: unknown, newPage: number) => {
    setCurrentPage(newPage)
    loadMovimientos(newPage, itemsPerPage, searchTerm, filters)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(0)
    loadMovimientos(0, newItemsPerPage, searchTerm, filters)
  }

  // Handlers de búsqueda y filtros
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
    setCurrentPage(0)
    loadMovimientos(0, itemsPerPage, value, filters)
  }

  const handleFilterChange = (field: keyof MovimientoFilters, value: any) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    setCurrentPage(0)
    loadMovimientos(0, itemsPerPage, searchTerm, newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setCurrentPage(0)
    loadMovimientos(0, itemsPerPage, '', {})
  }

  // Handlers de CRUD
  const handleCreate = () => {
    setSelectedMovimiento(null)
    setFormOpen(true)
  }

  const handleEdit = (movimiento: MovimientoInventario) => {
    setSelectedMovimiento(movimiento)
    setFormOpen(true)
  }

  const handleDelete = (movimiento: MovimientoInventario) => {
    setMovimientoToDelete(movimiento)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!movimientoToDelete) return

    try {
      setDeleting(true)
      await movimientosService.deleteMovimiento(movimientoToDelete.id)
      toast.success('Movimiento eliminado exitosamente')
      loadMovimientos(currentPage, itemsPerPage, searchTerm, filters)
      setDeleteDialogOpen(false)
      setMovimientoToDelete(null)
    } catch (error: any) {
      const errorData = error.data || {}
      toast.error(errorData.message || 'Error al eliminar movimiento')
    } finally {
      setDeleting(false)
    }
  }

  // Función para manejar la auditoría
  const handleViewAudit = (movimiento: MovimientoInventario) => {
    setSelectedMovimientoForAudit(movimiento)
    setAuditDialogOpen(true)
  }

  // Función para manejar el detalle del movimiento
  const handleViewDetail = (movimiento: MovimientoInventario) => {
    setSelectedMovimientoForDetail(movimiento)
    setDetailDialogOpen(true)
  }

  // Handler de refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMovimientos(currentPage, itemsPerPage, searchTerm, filters)
    setRefreshing(false)
    toast.success('Datos actualizados')
  }

  // Handler para volver a productos
  const handleBack = () => {
    router.push('/inventario/productos')
  }

  // Función para obtener el icono según el tipo de movimiento
  const getTipoMovimientoIcon = (tipo: TipoMovimiento) => {
    switch (tipo) {
      case 'entrada':
        return <EntradaIcon fontSize='small' />
      case 'salida':
        return <SalidaIcon fontSize='small' />
      case 'ajuste_positivo':
      case 'ajuste_negativo':
        return <AjusteIcon fontSize='small' />
      case 'transferencia':
        return <TransferenciaIcon fontSize='small' />
      default:
        return <AjusteIcon fontSize='small' />
    }
  }

  // Función para formatear moneda
  const formatCurrency = (amount: string, isUSD: boolean) => {
    const value = parseFloat(amount)
    const currency = isUSD ? 'USD' : 'NIO'
    const symbol = isUSD ? '$' : 'C$'
    return `${symbol} ${value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-NI', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component='button'
          variant='body1'
          onClick={handleBack}
          sx={{ textDecoration: 'none', color: 'primary.main' }}
        >
          Inventario - Productos
        </Link>
        <Typography color='text.primary'>Movimientos - {producto?.nombre || 'Cargando...'}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack} color='primary'>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant='h4' component='h1' gutterBottom>
              Movimientos de Inventario
            </Typography>
            {producto && (
              <Typography variant='subtitle1' color='text.secondary'>
                Producto: {producto.nombre} ({producto.codigo})
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={<RefreshIcon />}
            onClick={async () => {
              if (confirm('¿Desea recalcular el historial de stock de este producto?')) {
                 try {
                   setRefreshing(true)
                   await movimientosService.recalculateStock(productoId)
                   toast.success('Historial recalculado')
                   await loadMovimientos(currentPage, itemsPerPage, searchTerm, filters)
                   await loadProducto()
                 } catch (e: any) {
                   toast.error('Error al recalcular')
                 } finally {
                   setRefreshing(false)
                 }
              }
            }}
            disabled={refreshing}
          >
            Recalcular
          </Button>
          <Button
            variant='outlined'
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Actualizar
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
            Nuevo Movimiento
          </Button>
        </Box>
      </Box>

      {/* Filtros y búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder='Buscar movimientos...'
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.tipo_movimiento || ''}
                  onChange={e => handleFilterChange('tipo_movimiento', e.target.value || undefined)}
                  label='Tipo'
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {TIPOS_MOVIMIENTO.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='date'
                label='Fecha Desde'
                value={filters.fecha_desde || ''}
                onChange={e => handleFilterChange('fecha_desde', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type='date'
                label='Fecha Hasta'
                value={filters.fecha_hasta || ''}
                onChange={e => handleFilterChange('fecha_hasta', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant='outlined' startIcon={<ClearIcon />} onClick={handleClearFilters}>
                  Limpiar Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de movimientos */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align='right'>Cantidad</TableCell>
                  <TableCell align='right'>Costo Unit.</TableCell>
                  <TableCell align='right'>Valor Total</TableCell>
                  <TableCell align='right'>Stock Post.</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell align='right'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 8 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton variant='text' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !Array.isArray(movimientos) || movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      <Alert severity='info'>No se encontraron movimientos para este producto</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map(movimiento => (
                    <TableRow
                      key={movimiento.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewDetail(movimiento)}
                    >
                      <TableCell>
                        <Typography variant='body2'>{formatDate(movimiento.created_at)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTipoMovimientoIcon(movimiento.tipo_movimiento)}
                          <Chip
                            size='small'
                            label={getTipoMovimientoLabel(movimiento.tipo_movimiento)}
                            color={getTipoMovimientoColor(movimiento.tipo_movimiento)}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight='medium'>
                          {parseFloat(movimiento.cantidad).toLocaleString('es-NI')}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>
                          {formatCurrency(movimiento.costo_unitario, producto?.moneda || false)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight='medium'>
                          {formatCurrency(movimiento.costo_total || '0', movimiento.moneda)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight='medium'>
                          {parseFloat(movimiento.stock_posterior).toLocaleString('es-NI')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{movimiento.usuario?.name || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(movimiento)
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {!loading && movimientos.length > 0 && (
            <TablePagination
              component='div'
              count={totalItems}
              page={currentPage}
              onPageChange={handlePageChange}
              rowsPerPage={itemsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 15, 25, 50]}
              labelRowsPerPage='Filas por página:'
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <MovimientoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        movimiento={selectedMovimiento}
        productoId={productoId}
        onSuccess={() => {
          loadMovimientos(currentPage, itemsPerPage, searchTerm, filters)
          setFormOpen(false)
        }}
      />

      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Está seguro que desea eliminar este movimiento? Esta acción no se puede deshacer.</Typography>
          {movimientoToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant='body2'>
                <strong>Tipo:</strong> {getTipoMovimientoLabel(movimientoToDelete.tipo_movimiento)}
              </Typography>
              <Typography variant='body2'>
                <strong>Cantidad:</strong> {movimientoToDelete.cantidad}
              </Typography>
              <Typography variant='body2'>
                <strong>Fecha:</strong> {formatDate(movimientoToDelete.fecha_movimiento)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={confirmDelete}
            color='error'
            variant='contained'
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de auditoría */}
      <AuditoriaViewer
        open={auditDialogOpen}
        movimiento={selectedMovimientoForAudit}
        onClose={() => {
          setAuditDialogOpen(false)
          setSelectedMovimientoForAudit(null)
        }}
      />

      {/* Modal de detalle del movimiento */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedMovimientoForDetail && getTipoMovimientoIcon(selectedMovimientoForDetail.tipo_movimiento)}
            <Typography variant='h6'>Detalle del Movimiento</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMovimientoForDetail && (
            <Grid container spacing={3}>
              {/* Información básica */}
              <Grid item xs={12}>
                <Typography variant='h6' gutterBottom color='primary'>
                  Información General
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Tipo de Movimiento
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {getTipoMovimientoIcon(selectedMovimientoForDetail.tipo_movimiento)}
                  <Chip
                    size='small'
                    label={getTipoMovimientoLabel(selectedMovimientoForDetail.tipo_movimiento)}
                    color={getTipoMovimientoColor(selectedMovimientoForDetail.tipo_movimiento)}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Fecha del Movimiento
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {formatDate(selectedMovimientoForDetail.created_at)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Cantidad
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {parseFloat(selectedMovimientoForDetail.cantidad).toLocaleString('es-NI')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Costo Unitario
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {formatCurrency(selectedMovimientoForDetail.costo_unitario, producto?.moneda || false)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Valor Total
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {formatCurrency(selectedMovimientoForDetail.costo_total || '0', producto?.moneda || false)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Stock Posterior
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {parseFloat(selectedMovimientoForDetail.stock_posterior).toLocaleString('es-NI')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Usuario
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {selectedMovimientoForDetail.usuario?.name || 'N/A'}
                </Typography>
              </Grid>

              {/* Información del documento */}
              <Grid item xs={12}>
                <Typography variant='h6' gutterBottom color='primary' sx={{ mt: 2 }}>
                  Información del Documento
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant='body2' color='text.secondary'>
                  Tipo de Documento
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {selectedMovimientoForDetail.documento_tipo || 'No especificado'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant='body2' color='text.secondary'>
                  Número de Documento
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {selectedMovimientoForDetail.documento_numero || 'No especificado'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant='body2' color='text.secondary'>
                  Fecha del Documento
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {selectedMovimientoForDetail.documento_fecha
                    ? formatDate(selectedMovimientoForDetail.documento_fecha)
                    : 'No especificada'}
                </Typography>
              </Grid>

              {/* Motivo de ajuste */}
              {selectedMovimientoForDetail.propiedades_adicionales?.motivo_ajuste && (
                <>
                  <Grid item xs={12}>
                    <Typography variant='h6' gutterBottom color='primary' sx={{ mt: 2 }}>
                      Información Adicional
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Motivo del Ajuste
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {selectedMovimientoForDetail.propiedades_adicionales.motivo_ajuste}
                    </Typography>
                  </Grid>
                </>
              )}

              {/* Observaciones */}
              <Grid item xs={12}>
                <Typography variant='h6' gutterBottom color='primary' sx={{ mt: 2 }}>
                  Observaciones
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant='body1'>
                  {selectedMovimientoForDetail.observaciones || 'Sin observaciones'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
