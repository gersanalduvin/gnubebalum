'use client'

import { useDebounce } from '@/hooks/useDebounce'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
    Grid,
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

import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    AttachMoney as MoneyIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon
} from '@mui/icons-material'

import AuditoriaViewer from '@/components/widgets/AuditoriaViewer'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'react-hot-toast'

import ArancelModal from '../components/ArancelModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import arancelService from '../services/arancelService'
import type {
    ArancelModalState,
    ArancelSearchParams,
    ArancelTableFilters,
    ConfigArancel,
    DeleteConfirmState
} from '../types'
import { getMonedaLabel, getMonedaSymbol } from '../types'

const ConfigArancelesPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()

  // Estados principales
  const [aranceles, setAranceles] = useState<ConfigArancel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Estados de filtros con debounce para búsqueda
  const [filters, setFilters] = useState<ArancelTableFilters>({
    search: '',
    moneda: '',
    activo: ''
  })

  // Debounce para la búsqueda
  const debouncedSearch = useDebounce(filters.search, 500)

  // Crear filtros memoizados para evitar re-renders innecesarios
  const memoizedFilters = useMemo(() => ({
    search: debouncedSearch,
    moneda: filters.moneda,
    activo: filters.activo
  }), [debouncedSearch, filters.moneda, filters.activo])

  // Estados de modales
  const [modalState, setModalState] = useState<ArancelModalState>({
    open: false,
    mode: 'create',
    arancel: undefined
  })

  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    open: false,
    arancel: undefined
  })

  // Estado del modal de cambios
  const [changesModalState, setChangesModalState] = useState<{
    open: boolean
    arancel: ConfigArancel | null
  }>({
    open: false,
    arancel: null
  })

  // Permisos
  const canView = hasPermission('config_aranceles.index')
  const canCreate = hasPermission('config_aranceles.create')
  const canEdit = hasPermission('config_aranceles.update')
  const canDelete = hasPermission('config_aranceles.delete')

  // Función para cargar aranceles
  const loadAranceles = useCallback(async () => {
    if (!canView) return

    setLoading(true)
    setError(null)

    try {
      const params: ArancelSearchParams = {
        page: page + 1,
        per_page: rowsPerPage,
        search: memoizedFilters.search || undefined,
        moneda: memoizedFilters.moneda !== '' ? (memoizedFilters.moneda === '1') : undefined,
        activo: memoizedFilters.activo !== '' ? (memoizedFilters.activo === '1') : undefined
      }

      const response = await arancelService.getAranceles(params)
      
      if (response.success && response.data) {
        setAranceles(response.data.data)
        setTotalCount(response.data.total)
      } else {
        throw new Error(response.message || 'Error al cargar aranceles')
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al cargar los aranceles'
      setError(errorMessage)
      toast.error(errorMessage)
      setAranceles([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, memoizedFilters, canView])

  // Efecto principal de carga
  useEffect(() => {
    if (canView) {
      loadAranceles()
    }
  }, [canView, page, rowsPerPage, memoizedFilters, loadAranceles])

  // Cargar parámetros de URL solo una vez al montar
  useEffect(() => {
    const search = searchParams.get('search') || ''
    const moneda = searchParams.get('moneda') || ''
    const activo = searchParams.get('activo') || ''
    const pageParam = searchParams.get('page')
    const perPageParam = searchParams.get('per_page')

    setFilters({ search, moneda, activo })
    setPage(pageParam ? Math.max(0, parseInt(pageParam) - 1) : 0)
    setRowsPerPage(perPageParam ? parseInt(perPageParam) : 10)
  }, []) // Solo ejecutar una vez al montar

  // Actualizar URL cuando cambien los filtros (sin triggear carga)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    if (memoizedFilters.search) params.set('search', memoizedFilters.search)
    if (memoizedFilters.moneda) params.set('moneda', memoizedFilters.moneda)
    if (memoizedFilters.activo) params.set('activo', memoizedFilters.activo)
    params.set('page', '1')
    params.set('per_page', rowsPerPage.toString())
    
    router.replace(`?${params.toString()}`)
  }, [memoizedFilters, rowsPerPage, router])

  // Actualizar URL cuando cambien los filtros memoizados
  useEffect(() => {
    updateURL()
  }, [updateURL])

  // Handlers de filtros
  const handleFilterChange = (field: keyof ArancelTableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(0) // Reset page when filtering
  }

  const handleSearch = () => {
    loadAranceles()
  }

  const handleRefresh = () => {
    loadAranceles()
  }

  // Handlers de paginación
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', (newPage + 1).toString())
    router.push(`?${params.toString()}`)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    setRowsPerPage(newRowsPerPage)
    setPage(0)
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('per_page', newRowsPerPage.toString())
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  // Handlers de modal
  const handleCreate = () => {
    setModalState({
      open: true,
      mode: 'create',
      arancel: undefined
    })
  }

  const handleEdit = (arancel: ConfigArancel) => {
    setModalState({
      open: true,
      mode: 'edit',
      arancel
    })
  }

  const handleDelete = (arancel: ConfigArancel) => {
    setDeleteState({
      open: true,
      arancel
    })
  }

  const handleViewChanges = (arancel: ConfigArancel) => {
    setChangesModalState({
      open: true,
      arancel
    })
  }

  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      arancel: undefined
    })
  }

  const handleCloseDelete = () => {
    setDeleteState({
      open: false,
      arancel: undefined
    })
  }

  const handleSuccess = () => {
    loadAranceles()
    handleCloseModal()
    handleCloseDelete()
  }

  // Verificar permisos
  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para ver esta página
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon />
              Configuración de Aranceles
            </Typography>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                size="small"
              >
                Nuevo Arancel
              </Button>
            )}
          </Box>

          {/* Filtros */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Buscar aranceles"
                placeholder="Código o nombre..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={filters.moneda}
                  label="Moneda"
                  onChange={(e) => handleFilterChange('moneda', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="1">Soles (S/)</MenuItem>
                  <MenuItem value="0">Dólares ($)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.activo}
                  label="Estado"
                  onChange={(e) => handleFilterChange('activo', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  size="small"
                  startIcon={<SearchIcon />}
                  fullWidth
                >
                  Buscar
                </Button>
                <Tooltip title="Actualizar">
                  <IconButton onClick={handleRefresh} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Tabla */}
          {!loading && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell>Moneda</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aranceles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        No se encontraron aranceles
                      </TableCell>
                    </TableRow>
                  ) : (
                    aranceles.map((arancel) => (
                      <TableRow key={arancel.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {arancel.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {arancel.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                           <Typography variant="body2" fontWeight="medium">
                             {getMonedaSymbol(arancel.moneda)} {typeof arancel.precio === 'number' ? arancel.precio.toFixed(2) : parseFloat(arancel.precio || '0').toFixed(2)}
                           </Typography>
                         </TableCell>
                        <TableCell>
                          <Chip
                            label={getMonedaLabel(arancel.moneda)}
                            size="small"
                            color={arancel.moneda ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={arancel.activo ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={arancel.activo ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Ver cambios">
                              <IconButton size="small" onClick={() => handleViewChanges(arancel)} color="info">
                                <i className="ri-history-line" />
                              </IconButton>
                            </Tooltip>
                            {canEdit && (
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(arancel)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(arancel)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginación */}
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de Arancel */}
      <ArancelModal
        open={modalState.open}
        mode={modalState.mode}
        arancel={modalState.arancel}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteState.open}
        arancel={deleteState.arancel}
        onClose={handleCloseDelete}
        onSuccess={handleSuccess}
      />

      {/* Modal de historial de cambios */}
      <Dialog
        open={changesModalState.open}
        onClose={() => setChangesModalState({ open: false, arancel: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Historial de Cambios - {changesModalState.arancel?.codigo} - {changesModalState.arancel?.nombre}
        </DialogTitle>
        <DialogContent>
          {changesModalState.arancel && (
            <AuditoriaViewer cambios={changesModalState.arancel.cambios} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangesModalState({ open: false, arancel: null })}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConfigArancelesPage
