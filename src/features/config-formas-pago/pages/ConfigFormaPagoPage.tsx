'use client'

import { useCallback, useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import {
  Alert,
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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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

import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'
import AuditoriaViewer from '../components/AuditoriaViewer'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import FormaPagoModal from '../components/FormaPagoModal'
import formaPagoService from '../services/formaPagoService'
import type {
  ConfigFormaPago,
  DeleteConfirmState,
  FormaPagoModalState,
  FormaPagoSearchParams,
  FormaPagoTableFilters
} from '../types'

const ConfigFormaPagoPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados principales
  const [formasPago, setFormasPago] = useState<ConfigFormaPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Estados de filtros
  const [filters, setFilters] = useState<FormaPagoTableFilters>({
    search: '',
    activo: null
  })

  // Estados de modales
  const [modalState, setModalState] = useState<FormaPagoModalState>({
    open: false,
    mode: 'create',
    formaPago: undefined
  })

  const [changesModalState, setChangesModalState] = useState<{
    open: boolean
    formaPago: ConfigFormaPago | null
  }>({
    open: false,
    formaPago: null
  })

  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    open: false,
    formaPago: undefined
  })

  // Permisos
  const canCreate = hasPermission('config_formas_pago.create')
  const canEdit = hasPermission('config_formas_pago.update')
  const canDelete = hasPermission('config_formas_pago.delete')

  // Función para cargar formas de pago
  const loadFormasPago = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: FormaPagoSearchParams = {
        page: currentPage + 1,
        per_page: itemsPerPage,
        ...(filters.search && { search: filters.search }),
        ...(filters.activo !== null && { activo: filters.activo })
      }

      const response = await formaPagoService.getFormasPago(params)

      if (response.success && response.data) {
        setFormasPago(response.data.data || [])
        setTotalItems(response.data.total || 0)
      } else {
        setError(response.message || 'Error al cargar las formas de pago')
        setFormasPago([])
        setTotalItems(0)
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar las formas de pago')
      setFormasPago([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, filters.search, filters.activo])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(loadFormasPago)
  }, [executeOnce])

  // Cargar parámetros de URL solo una vez
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1') - 1
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const search = searchParams.get('search') || ''
    const activo = searchParams.get('activo')

    setCurrentPage(Math.max(0, page))
    setItemsPerPage(per_page)
    setFilters({
      search,
      activo: activo === 'true' ? true : activo === 'false' ? false : null
    })
  }, [searchParams])

  // Ejecutar búsqueda cuando cambien los parámetros de filtrado
  useEffect(() => {
    // Solo ejecutar si no es la carga inicial (executeOnce ya se encarga de eso)
    if (currentPage !== 0 || itemsPerPage !== 10 || filters.search || filters.activo !== null) {
      loadFormasPago()
    }
  }, [currentPage, itemsPerPage, filters.search, filters.activo, loadFormasPago])

  // Actualizar URL cuando cambien los parámetros
  const updateURL = useCallback(
    (newParams: { page?: number; per_page?: number; search?: string; activo?: boolean | null }) => {
      const params = new URLSearchParams()

      if (newParams.page && newParams.page > 1) {
        params.set('page', newParams.page.toString())
      }

      if (newParams.per_page && newParams.per_page !== 10) {
        params.set('per_page', newParams.per_page.toString())
      }

      if (newParams.search) {
        params.set('search', newParams.search)
      }

      if (newParams.activo !== null && newParams.activo !== undefined) {
        params.set('activo', newParams.activo.toString())
      }

      const newURL = params.toString() ? `?${params.toString()}` : ''
      router.push(`/caja/formas-pago${newURL}`)
    },
    [router]
  )

  // Manejar cambio de página
  const handlePageChange = (_: unknown, newPage: number) => {
    setCurrentPage(newPage)
    updateURL({
      page: newPage + 1,
      per_page: itemsPerPage,
      search: filters.search || undefined,
      activo: filters.activo
    })
  }

  // Manejar cambio de elementos por página
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(0)
    updateURL({
      page: 1,
      per_page: newItemsPerPage,
      search: filters.search || undefined,
      activo: filters.activo
    })
  }

  // Manejar búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setFilters(prev => ({ ...prev, search: newSearch }))
  }

  // Manejar filtro de estado
  const handleActivoChange = (event: any) => {
    const value = event.target.value
    const newActivo = value === '' ? null : value === 'true'
    setFilters(prev => ({ ...prev, activo: newActivo }))
  }

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0)
      updateURL({
        page: 1,
        per_page: itemsPerPage,
        search: filters.search || undefined,
        activo: filters.activo
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.search, filters.activo, itemsPerPage, updateURL])

  // Manejar creación
  const handleCreate = () => {
    setModalState({
      open: true,
      mode: 'create',
      formaPago: undefined
    })
  }

  // Manejar edición
  const handleEdit = (formaPago: ConfigFormaPago) => {
    setModalState({
      open: true,
      mode: 'edit',
      formaPago
    })
  }

  const handleViewChanges = (formaPago: ConfigFormaPago) => {
    setChangesModalState({
      open: true,
      formaPago
    })
  }

  // Manejar eliminación
  const handleDelete = (formaPago: ConfigFormaPago) => {
    setDeleteState({
      open: true,
      formaPago
    })
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      formaPago: undefined
    })
  }

  // Cerrar diálogo de eliminación
  const handleCloseDelete = () => {
    setDeleteState({
      open: false,
      formaPago: undefined
    })
  }

  // Manejar éxito en operaciones
  const handleSuccess = () => {
    loadFormasPago()
  }

  // Manejar actualización
  const handleRefresh = () => {
    loadFormasPago()
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h4' component='h1'>
          Configuración de Formas de Pago
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Actualizar
          </Button>
          {canCreate && (
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
              Nueva Forma de Pago
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label='Buscar formas de pago'
              value={filters.search}
              onChange={handleSearchChange}
              size='small'
              sx={{ minWidth: 300 }}
              placeholder='Buscar por nombre o abreviatura...'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size='small' sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.activo === null ? '' : (filters.activo ?? '').toString()}
                onChange={handleActivoChange}
                label='Estado'
              >
                <MenuItem value=''>Todos</MenuItem>
                <MenuItem value='true'>Activo</MenuItem>
                <MenuItem value='false'>Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {error && (
            <Alert severity='error' sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Abreviatura</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Es efectivo</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : formasPago.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No se encontraron formas de pago
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  formasPago.map(formaPago => (
                    <TableRow key={formaPago.id} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight='medium'>
                          {formaPago.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{formaPago.abreviatura}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formaPago.activo ? 'Activo' : 'Inactivo'}
                          size='small'
                          color={formaPago.activo ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formaPago.es_efectivo ? 'Sí' : 'No'}
                          size='small'
                          color={formaPago.es_efectivo ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title='Ver cambios'>
                            <IconButton size='small' onClick={() => handleViewChanges(formaPago)} color='info'>
                              <i className='ri-history-line' />
                            </IconButton>
                          </Tooltip>
                          {canEdit && (
                            <IconButton size='small' onClick={() => handleEdit(formaPago)} color='primary'>
                              <EditIcon fontSize='small' />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton size='small' onClick={() => handleDelete(formaPago)} color='error'>
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          <TablePagination
            component='div'
            count={totalItems}
            page={currentPage}
            onPageChange={handlePageChange}
            rowsPerPage={itemsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage='Filas por página:'
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </CardContent>
      </Card>

      {/* Modal de Forma de Pago */}
      <FormaPagoModal
        open={modalState.open}
        mode={modalState.mode}
        formaPago={modalState.formaPago}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteState.open}
        formaPago={deleteState.formaPago}
        onClose={handleCloseDelete}
        onSuccess={handleSuccess}
      />

      {/* Modal de historial de cambios */}
      <Dialog
        open={changesModalState.open}
        onClose={() => setChangesModalState({ open: false, formaPago: null })}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Historial de Cambios - {changesModalState.formaPago?.nombre}</DialogTitle>
        <DialogContent>
          {changesModalState.formaPago && <AuditoriaViewer cambios={changesModalState.formaPago.cambios} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangesModalState({ open: false, formaPago: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConfigFormaPagoPage
