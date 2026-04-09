'use client'

import { useCallback, useEffect, useState } from 'react'

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
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import periodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'
import type { ConfPeriodoLectivo } from '@/features/periodo-lectivo/types'
import { useAuth } from '@/hooks/useAuth'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import GruposModal from '../components/GruposModal'
import gruposService from '../services/gruposService'
import type {
    ConfigGrupos,
    DeleteConfirmState,
    GruposModalState,
    GruposTableFilters
} from '../types'

const ConfigGruposPage: React.FC = () => {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados de datos
  const [grupos, setGrupos] = useState<ConfigGrupos[]>([])
  const [periodosLectivos, setPeriodosLectivos] = useState<ConfPeriodoLectivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)

  // Estados de filtros
  const [filters, setFilters] = useState<GruposTableFilters>({
    search: '',
    periodo_lectivo_id: undefined
  })

  // Estados de modales
  const [modalState, setModalState] = useState<GruposModalState>({
    open: false,
    mode: 'create',
    grupos: undefined
  })

  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    open: false,
    grupos: undefined
  })

  // Estado para modal de cambios
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  // Permisos
  const canCreate = hasPermission('config_grupos.create')
  const canEdit = hasPermission('config_grupos.update')
  const canDelete = hasPermission('config_grupos.delete')

  // Cargar grupos
  const loadGrupos = useCallback(async (page: number = 1, searchTerm: string = '', periodoLectivoId?: number) => {
    // Si no hay período lectivo seleccionado, no cargar grupos
    if (!periodoLectivoId) {
      setGrupos([])
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Usar el endpoint específico para obtener grupos por período lectivo
      const response = await gruposService.getGruposByPeriodoLectivo(periodoLectivoId)

      if (response.success && Array.isArray(response.data)) {
        let filteredGrupos = response.data

        // Aplicar filtro de búsqueda si existe
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase()
          filteredGrupos = response.data.filter(grupo => 
            grupo.grado?.nombre?.toLowerCase().includes(searchLower) ||
            grupo.seccion?.nombre?.toLowerCase().includes(searchLower) ||
            grupo.turno?.nombre?.toLowerCase().includes(searchLower) ||
            grupo.docente?.name?.toLowerCase().includes(searchLower)
          )
        }

        // Implementar paginación manual
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedGrupos = filteredGrupos.slice(startIndex, endIndex)

        setGrupos(paginatedGrupos)
        setCurrentPage(page)
        setTotalPages(Math.ceil(filteredGrupos.length / itemsPerPage))
        setTotalItems(filteredGrupos.length)
      } else {
        setGrupos([])
        setCurrentPage(1)
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error: any) {
      console.error('Error al cargar grupos:', error)
      const errorMessage = error.message || 'Error al cargar los grupos'
      setError(errorMessage)
      toast.error(errorMessage)
      setGrupos([])
      setCurrentPage(1)
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [itemsPerPage])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(async () => {
      await loadPeriodosLectivos()
      // No cargar grupos automáticamente, solo cuando se seleccione un periodo
      setLoading(false)
    })
  }, [executeOnce])

  // Cargar periodos lectivos
  const loadPeriodosLectivos = async () => {
    try {
      const response = await periodoLectivoService.getAllPeriodosLectivos()
      if (response.success && Array.isArray(response.data)) {
        setPeriodosLectivos(response.data)
      } else {
        setPeriodosLectivos([])
      }
    } catch (error: any) {
      console.error('Error al cargar periodos lectivos:', error)
      setPeriodosLectivos([])
      toast.error('Error al cargar los periodos lectivos')
    }
  }

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    // Solo cargar grupos si hay un periodo lectivo seleccionado
    if (filters.periodo_lectivo_id) {
      loadGrupos(currentPage, filters.search, filters.periodo_lectivo_id)
    } else {
      // Si no hay periodo seleccionado, limpiar la tabla
      setGrupos([])
      setTotalPages(1)
      setTotalItems(0)
      setLoading(false)
    }
  }, [currentPage, filters.periodo_lectivo_id, loadGrupos])

  // Efecto para manejar el debounce de la búsqueda (solo para search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.periodo_lectivo_id) {
        setCurrentPage(1)
        loadGrupos(1, filters.search, filters.periodo_lectivo_id)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.search, loadGrupos])

  // Manejar búsqueda
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFilters(prev => ({ ...prev, search: value }))
  }

  // Manejar cambio de periodo lectivo
  const handlePeriodoLectivoChange = (event: any) => {
    const value = event.target.value === '' ? undefined : Number(event.target.value)
    setFilters(prev => ({ ...prev, periodo_lectivo_id: value }))
    setCurrentPage(1)
  }

  // Manejar cambio de página
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    loadGrupos(page, filters.search, filters.periodo_lectivo_id)
  }

  // Manejar refresh
  const handleRefresh = () => {
    loadPeriodosLectivos()
    if (filters.periodo_lectivo_id) {
      loadGrupos(currentPage, filters.search, filters.periodo_lectivo_id)
    }
  }

  // Manejar apertura de modal para crear
  const handleCreate = () => {
    if (!canCreate) {
      toast.error('No tienes permisos para crear grupos')
      return
    }

    setModalState({
      open: true,
      mode: 'create',
      grupos: undefined
    })
  }

  // Manejar apertura de modal para editar
  const handleEdit = (grupos: ConfigGrupos) => {
    if (!canEdit) {
      toast.error('No tienes permisos para editar grupos')
      return
    }

    setModalState({
      open: true,
      mode: 'edit',
      grupos
    })
  }

  // Manejar apertura de modal para eliminar
  const handleDelete = (grupos: ConfigGrupos) => {
    if (!canDelete) {
      toast.error('No tienes permisos para eliminar grupos')
      return
    }

    setDeleteState({
      open: true,
      grupos
    })
  }

  // Manejar apertura de modal para ver cambios
  const handleViewChanges = (grupos: ConfigGrupos) => {
    setAuditTarget({ model: 'config_grupos', id: grupos.id })
    setAuditOpen(true)
  }

  // Manejar cierre de modal
  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      grupos: undefined
    })
  }

  // Manejar cierre de modal de eliminación
  const handleCloseDeleteModal = () => {
    setDeleteState({
      open: false,
      grupos: undefined
    })
  }

  // Manejar éxito en operaciones
  const handleSuccess = () => {
    loadGrupos(currentPage, filters.search, filters.periodo_lectivo_id)
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configuración de Grupos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona los grupos del sistema educativo
        </Typography>
      </Box>

      {/* Controles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Periodo Lectivo</InputLabel>
                <Select
                  value={filters.periodo_lectivo_id || ''}
                  onChange={handlePeriodoLectivoChange}
                  label="Periodo Lectivo"
                >
                  <MenuItem value="">
                    <em>Todos los periodos</em>
                  </MenuItem>
                  {Array.isArray(periodosLectivos) && periodosLectivos.map((periodo) => (
                    <MenuItem key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                placeholder="Buscar grupos..."
                value={filters.search}
                onChange={handleSearch}
                sx={{ minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Actualizar">
                <span>
                  <IconButton onClick={handleRefresh} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>

              {canCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreate}
                  disabled={loading || !filters.periodo_lectivo_id}
                >
                  Nuevo Grupo
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !filters.periodo_lectivo_id ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona un período lectivo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Para ver los grupos, primero debes seleccionar un período lectivo en el filtro superior
              </Typography>
            </Box>
          ) : grupos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No se encontraron grupos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filters.search ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer grupo'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Grado</TableCell>
                      <TableCell>Sección</TableCell>
                      <TableCell>Turno</TableCell>
                      <TableCell>Docente Guía</TableCell>
                      <TableCell align="center" width={120}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(grupos) && grupos.map((grupo) => (
                      <TableRow key={grupo.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {grupo.grado?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {grupo.seccion?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {grupo.turno?.nombre || 'N/A'}
                          </Typography>
                        </TableCell>
                        {/* Campo Modalidad eliminado según nueva especificación */}
                        <TableCell>
                          <Typography variant="body2">
                            {/* Check if docente_guia is an object (User model) and has name, otherwise check nested docente property, or fallback */}
                            {(typeof grupo.docente_guia === 'object' && grupo.docente_guia !== null) 
                              ? (grupo.docente_guia as any).name 
                              : (grupo.docente?.name || 'Sin asignar')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <PermissionGuard permission="auditoria.ver">
                              <Tooltip title="Auditoría">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewChanges(grupo)}
                                  color="info"
                                >
                                  <ManageHistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                            {canEdit && (
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(grupo)}
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
                                  onClick={() => handleDelete(grupo)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginación */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Info de paginación */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {grupos.length} de {totalItems} grupos
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de crear/editar */}
      <GruposModal
        open={modalState.open}
        mode={modalState.mode}
        grupos={modalState.grupos}
        periodoLectivoId={filters.periodo_lectivo_id || null}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteState.open}
        grupos={deleteState.grupos || null}
        onClose={handleCloseDeleteModal}
        onSuccess={handleSuccess}
      />

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Box>
  )
}

export default ConfigGruposPage
