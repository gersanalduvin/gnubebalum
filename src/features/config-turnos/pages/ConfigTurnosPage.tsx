'use client'

import { useState, useEffect, useCallback } from 'react'

import { useSearchParams, useRouter } from 'next/navigation'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon
} from '@mui/icons-material'

import { usePermissions } from '@/hooks/usePermissions'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import TurnosModal from '../components/TurnosModal'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { PermissionGuard } from '@/components/PermissionGuard'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import turnosService from '../services/turnosService'
import type {
  ConfigTurnos,
  TurnosPaginatedResponse,
  TurnosTableFilters,
  TurnosModalState,
  DeleteConfirmState,
  TurnosSearchParams
} from '../types'

const ConfigTurnosPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados principales
  const [turnos, setTurnos] = useState<ConfigTurnos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de paginación
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Estados de filtros
  const [filters, setFilters] = useState<TurnosTableFilters>({
    search: ''
  })

  // Estados de modales
  const [modalState, setModalState] = useState<TurnosModalState>({
    open: false,
    mode: 'create',
    turnos: undefined
  })

  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    open: false,
    turnos: undefined
  })

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  // Permisos
  const canCreate = hasPermission('config_turnos.create')
  const canEdit = hasPermission('config_turnos.update')
  const canDelete = hasPermission('config_turnos.delete')

  // Función para cargar turnos
  const loadTurnos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: TurnosSearchParams = {
        page: currentPage + 1,
        per_page: itemsPerPage,
        ...(filters.search && { search: filters.search })
      }

      const response: TurnosPaginatedResponse = await turnosService.getTurnos(params)
      
      setTurnos(response.data?.data || [])
      setTotalItems(response.data?.total || 0)
    } catch (error: any) {
      console.error('Error al cargar turnos:', error)
      setError(error.message || 'Error al cargar los turnos')
      setTurnos([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, filters])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(loadTurnos)
  }, [executeOnce])

  // Recargar cuando cambien los filtros o la página (solo si no es la carga inicial)
  useEffect(() => {
    if (currentPage > 0 || filters.search) {
      loadTurnos()
    }
  }, [currentPage, filters])

  // Cargar parámetros de URL solo una vez
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1') - 1
    const size = parseInt(searchParams.get('size') || '10')
    const search = searchParams.get('search') || ''

    setCurrentPage(page)
    setItemsPerPage(size)
    setFilters({ search })
  }, []) // Sin dependencias para que solo se ejecute una vez

  // Actualizar URL cuando cambien los parámetros
  const updateURL = useCallback((newParams: Partial<TurnosSearchParams>) => {
    const params = new URLSearchParams()
    
    if (newParams.page && newParams.page > 1) {
      params.set('page', newParams.page.toString())
    }
    if (newParams.per_page && newParams.per_page !== 10) {
      params.set('size', newParams.per_page.toString())
    }
    if (newParams.search) {
      params.set('search', newParams.search)
    }

    const newURL = params.toString() ? `?${params.toString()}` : ''
    router.push(`/config/turnos${newURL}`)
  }, [router])

  // Manejar cambio de página
  const handlePageChange = (_: unknown, newPage: number) => {
    setCurrentPage(newPage)
    updateURL({ 
      page: newPage + 1, 
      per_page: itemsPerPage, 
      search: filters.search || undefined 
    })
  }

  // Manejar cambio de elementos por página
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10)
    setItemsPerPage(newSize)
    setCurrentPage(0)
    updateURL({ 
      page: 1, 
      per_page: newSize, 
      search: filters.search || undefined 
    })
  }

  // Manejar búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setFilters(prev => ({ ...prev, search: newSearch }))
  }

  // Efecto para manejar el debounce de la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== searchParams.get('search')) {
        setCurrentPage(0)
        updateURL({ 
          page: 1, 
          per_page: itemsPerPage, 
          search: filters.search || undefined 
        })
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  // Manejar creación
  const handleCreate = () => {
    setModalState({
      open: true,
      mode: 'create',
      turnos: undefined
    })
  }

  // Manejar edición
  const handleEdit = (turnos: ConfigTurnos) => {
    setModalState({
      open: true,
      mode: 'edit',
      turnos
    })
  }

  // Manejar eliminación
  const handleDelete = (turnos: ConfigTurnos) => {
    setDeleteState({
      open: true,
      turnos
    })
  }

  // Manejar ver cambios
  const handleViewChanges = (turnos: ConfigTurnos) => {
    setAuditTarget({ model: 'config_turnos', id: turnos.id })
    setAuditOpen(true)
  }

  // Cerrar modal de cambios
  const handleCloseChanges = () => {
    setAuditOpen(false)
    setAuditTarget(null)
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      turnos: undefined
    })
  }

  // Cerrar diálogo de eliminación
  const handleCloseDelete = () => {
    setDeleteState({
      open: false,
      turnos: undefined
    })
  }

  // Manejar éxito en operaciones
  const handleSuccess = () => {
    loadTurnos()
  }

  // Manejar actualización
  const handleRefresh = () => {
    loadTurnos()
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Configuración de Turnos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Actualizar
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Nuevo Turno
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Buscar turnos"
              value={filters.search}
              onChange={handleSearchChange}
              size="small"
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : turnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron turnos
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  turnos.map((turno) => (
                    <TableRow key={turno.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {turno.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={turno.orden} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <PermissionGuard permission="auditoria.ver">
                            <Tooltip title="Auditoría">
                              <IconButton
                                size="small"
                                onClick={() => handleViewChanges(turno)}
                                color="info"
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          {canEdit && (
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(turno)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(turno)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
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
        </CardContent>
      </Card>

      {/* Modal de Turnos */}
      <TurnosModal
        open={modalState.open}
        mode={modalState.mode}
        turnos={modalState.turnos}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteState.open}
        turnos={deleteState.turnos}
        onClose={handleCloseDelete}
        onSuccess={handleSuccess}
      />

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Box>
  )
}

export default ConfigTurnosPage
