'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TablePagination
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import type { 
  ConfigPlanPago, 
  CursoLectivo, 
  ConfigRubro,
  PlanPagoModalState, 
  DeleteConfirmState, 
  PlanPagoTableFilters,
  PlanPagoSearchParams,
  ValidationErrors 
} from '../types'
import planPagoService from '../services/planPagoService'
import PlanPagoModal from '../components/PlanPagoModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import AuditoriaViewer from '../components/AuditoriaViewer'

const ConfigPlanPagosPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados principales
  const [planesPago, setPlanesPago] = useState<ConfigPlanPago[]>([])
  const [rubros, setRubros] = useState<ConfigRubro[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Estados de filtros
  const [filters, setFilters] = useState<PlanPagoTableFilters>({
    search: '',
    cursoLectivo: ''
  })

  // Estados para modales
  const [planPagoModal, setPlanPagoModal] = useState<PlanPagoModalState>({
    open: false,
    mode: 'create',
    planPago: undefined
  })

  const [deleteDialog, setDeleteDialog] = useState<DeleteConfirmState>({
    open: false,
    planPago: undefined
  })

  const [auditoriaDialog, setAuditoriaDialog] = useState<{
    open: boolean
    planPago?: ConfigPlanPago
  }>({
    open: false,
    planPago: undefined
  })

  // Estados para curso lectivo
  const [cursosLectivos, setCursosLectivos] = useState<CursoLectivo[]>([])
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)

  // Permisos
  const canCreate = hasPermission('config_formas_pago.create')
  const canEdit = hasPermission('config_formas_pago.update')
  const canDelete = hasPermission('config_formas_pago.delete')
  const canView = hasPermission('config_formas_pago.show')

  // Función para cargar períodos lectivos
  const loadPeriodosLectivos = useCallback(async () => {
    try {
      setLoadingPeriodos(true)
      const response = await planPagoService.getPeriodosLectivos()
      
      // getPeriodosLectivos ahora devuelve directamente CursoLectivo[]
      setCursosLectivos(response)
    } catch (error: any) {
      console.error('Error al cargar períodos lectivos:', error)
      setCursosLectivos([])
      toast.error('Error al cargar los períodos lectivos')
    } finally {
      setLoadingPeriodos(false)
    }
  }, [])

  // Función para cargar planes de pago con curso específico
  const loadPlanesPagoWithCurso = useCallback(async (cursoId: string, params: { page?: number; per_page?: number; search?: string } = {}) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams: PlanPagoSearchParams = {
        page: (params.page || currentPage) + 1,
        per_page: params.per_page || itemsPerPage,
        search: params.search || filters.search || undefined,
        periodo_lectivo_id: parseInt(cursoId)
      }

      const response = await planPagoService.getPlanesPago(searchParams)
      
      if (response.success) {
        setPlanesPago(response.data.data || [])
        setTotalItems(response.data.total || 0)
      } else {
        throw new Error(response.message || 'Error al cargar planes de pago')
      }
    } catch (error: any) {
      console.error('Error loading planes de pago:', error)
      setError(error.message || 'Error al cargar los planes de pago')
      setPlanesPago([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, filters.search])

  // Función para cargar planes de pago
  const loadPlanesPago = useCallback(async (params: { page?: number; per_page?: number; search?: string } = {}) => {
    // No cargar si no hay curso lectivo seleccionado
    if (!filters.cursoLectivo) {
      setPlanesPago([])
      setTotalItems(0)
      setLoading(false)
      return
    }

    return loadPlanesPagoWithCurso(filters.cursoLectivo, params)
  }, [filters.cursoLectivo, loadPlanesPagoWithCurso])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    executeOnce(async () => {
      // Cargar períodos lectivos primero
      await loadPeriodosLectivos()
      
      if (filters.cursoLectivo) {
        await loadPlanesPago()
      }
    })
  }, [executeOnce, loadPlanesPago, loadPeriodosLectivos, filters.cursoLectivo])

  // Handlers para paginación
  const handlePageChange = (_: unknown, newPage: number) => {
    setCurrentPage(newPage)
    loadPlanesPago({ page: newPage })
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(0)
    loadPlanesPago({ page: 0, per_page: newItemsPerPage })
  }

  // Handler para búsqueda
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    setCurrentPage(0)
    loadPlanesPago({ page: 0, search: searchTerm })
  }

  // Handler para cambio de curso lectivo
  const handleCursoLectivoChange = (cursoId: string) => {
    setFilters(prev => ({ ...prev, cursoLectivo: cursoId }))
    setCurrentPage(0)
    if (cursoId) {
      // Pasar el cursoId directamente para evitar problemas de estado asíncrono
      loadPlanesPagoWithCurso(cursoId, { page: 0 })
    } else {
      setPlanesPago([])
      setTotalItems(0)
    }
  }

  // Handlers para modales
  const handleOpenCreateModal = () => {
    // Validar que hay un curso lectivo seleccionado
    if (!filters.cursoLectivo) {
      toast.error('Debe seleccionar un período lectivo antes de crear un plan de pago')
      return
    }

    setPlanPagoModal({
      open: true,
      mode: 'create',
      planPago: undefined
    })
  }

  const handleOpenEditModal = (planPago: ConfigPlanPago) => {
    setPlanPagoModal({
      open: true,
      mode: 'edit',
      planPago
    })
  }

  const handleClosePlanPagoModal = () => {
    setPlanPagoModal({
      open: false,
      mode: 'create',
      planPago: undefined
    })
  }

  const handleOpenDeleteDialog = (planPago: ConfigPlanPago) => {
    setDeleteDialog({
      open: true,
      planPago
    })
  }

  const handleCloseDeleteModal = () => {
    setDeleteDialog({
      open: false,
      planPago: undefined
    })
  }

  // Handler para navegar a rubros (general)
  const handleNavigateToRubros = () => {
    window.location.href = '/caja/plan-pagos/rubros'
  }

  // Handler para navegar a rubros desde tabla (específico)
  const handleNavigateToRubrosFromTable = (planPago: ConfigPlanPago) => {
    // Navegar a rubros con el ID del plan de pago como parámetro
    window.location.href = `/caja/plan-pagos/rubros?planPagoId=${planPago.id}`
  }

  // Handler para ver cambios
  const handleViewChanges = (planPago: ConfigPlanPago) => {
    setAuditoriaDialog({
      open: true,
      planPago
    })
  }

  const handleCloseAuditoria = () => {
    setAuditoriaDialog({
      open: false,
      planPago: undefined
    })
  }

  // Handler para refrescar datos
  const handleRefresh = () => {
    loadPlanesPago()
  }

  // Handler para éxito en operaciones CRUD
  const handleOperationSuccess = () => {
    loadPlanesPago()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              Configuración de Planes de Pago
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refrescar">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {canCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateModal}
                  disabled={!filters.cursoLectivo}
                >
                  Nuevo Plan de Pago
                </Button>
              )}
            </Box>
          </Box>

          {/* Selector de Curso Lectivo */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
              <InputLabel>Curso Lectivo</InputLabel>
              <Select
                value={filters.cursoLectivo}
                label="Curso Lectivo"
                onChange={(e) => handleCursoLectivoChange(e.target.value)}
                disabled={loadingPeriodos}
              >
                <MenuItem value="">
                  <em>Seleccione un curso lectivo</em>
                </MenuItem>
                {loadingPeriodos ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Cargando períodos...
                  </MenuItem>
                ) : (
                  cursosLectivos.map((curso) => (
                    <MenuItem key={curso.id} value={curso.id.toString()}>
                      {curso.nombre} {curso.activo && <Chip label="Activo" size="small" color="primary" sx={{ ml: 1 }} />}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Filtros y búsqueda */}
          {filters.cursoLectivo && (
            <Box sx={{ mb: 3 }}>
              <TextField
                size="small"
                placeholder="Buscar por nombre..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ maxWidth: 400 }}
              />
            </Box>
          )}

          {/* Mensaje cuando no hay curso lectivo seleccionado */}
          {!filters.cursoLectivo && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Seleccione un curso lectivo para ver los planes de pago.
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Tabla */}
          {filters.cursoLectivo && (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={40} />
                        </TableCell>
                      </TableRow>
                    ) : planesPago.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No se encontraron planes de pago
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      planesPago.map((planPago) => (
                        <TableRow key={planPago.id} hover>
                          <TableCell>{planPago.id}</TableCell>
                          <TableCell>{planPago.nombre}</TableCell>
                          <TableCell>
                            <Chip
                              label={planPago.estado ? 'Activo' : 'Inactivo'}
                              color={planPago.estado ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Rubros">
                                <IconButton
                                  size="small"
                                  onClick={() => handleNavigateToRubrosFromTable(planPago)}
                                  color="primary"
                                >
                                  <CategoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Ver cambios">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewChanges(planPago)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {canEdit && (
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditModal(planPago)}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {canDelete && (
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDeleteDialog(planPago)}
                                    color="error"
                                  >
                                    <DeleteIcon />
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
              </TableContainer>

              {/* Paginación */}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Plan de Pago */}
      <PlanPagoModal
        open={planPagoModal.open}
        mode={planPagoModal.mode}
        planPago={planPagoModal.planPago}
        cursoLectivoId={parseInt(filters.cursoLectivo || '0') || 0}
        rubros={rubros}
        onClose={handleClosePlanPagoModal}
        onSuccess={handleOperationSuccess}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        planPago={deleteDialog.planPago}
        onClose={handleCloseDeleteModal}
        onSuccess={handleOperationSuccess}
      />

      {/* Modal de Auditoría */}
      <Dialog
        open={auditoriaDialog.open}
        onClose={handleCloseAuditoria}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Historial de Cambios - Plan de Pago
        </DialogTitle>
        <DialogContent>
          {auditoriaDialog.planPago && (
            <AuditoriaViewer
              cambios={auditoriaDialog.planPago.cambios || []}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default ConfigPlanPagosPage