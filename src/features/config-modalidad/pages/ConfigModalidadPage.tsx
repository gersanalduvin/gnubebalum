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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

import { usePermissions } from '@/hooks/usePermissions'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import ModalidadModal from '../components/ModalidadModal'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import { PermissionGuard } from '@/components/PermissionGuard'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import modalidadService from '../services/modalidadService'
import type {
  ConfigModalidad,
  ModalidadPaginatedResponse,
  ModalidadTableFilters,
  ModalidadModalState,
  DeleteConfirmState,
  ModalidadSearchParams
} from '../types'

const ConfigModalidadPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados principales
  const [modalidades, setModalidades] = useState<ConfigModalidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de paginación
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Estados de filtros
  const [filters, setFilters] = useState<ModalidadTableFilters>({
    search: ''
  })

  // Estados de modales
  const [modalState, setModalState] = useState<ModalidadModalState>({
    open: false,
    mode: 'create',
    modalidad: undefined
  })

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    open: false,
    modalidad: undefined
  })

  // Permisos
  const canCreate = hasPermission('config_modalidad.create')
  const canEdit = hasPermission('config_modalidad.update')
  const canDelete = hasPermission('config_modalidad.delete')

  // Función para cargar modalidades
  const loadModalidades = useCallback(async () => {

    setLoading(true)
    setError(null)

    try {
      const params: ModalidadSearchParams = {
        page: currentPage + 1,
        per_page: itemsPerPage,
        ...(filters.search && { search: filters.search })
      }

      const response: ModalidadPaginatedResponse = await modalidadService.getModalidades(params)
      
      setModalidades(response.data?.data || [])
      setTotalItems(response.data?.total || 0)
    } catch (error: any) {
      console.error('Error al cargar modalidades:', error)
      setError(error.message || 'Error al cargar las modalidades')
      setModalidades([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, filters])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(loadModalidades)
  }, [executeOnce])

  // Recargar cuando cambien los filtros o la página (solo si no es la carga inicial)
  useEffect(() => {
    if (currentPage > 0 || filters.search) {
      loadModalidades()
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
  const updateURL = useCallback((newParams: Partial<ModalidadSearchParams>) => {
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
    router.push(`/config/modalidades${newURL}`)
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
      modalidad: undefined
    })
  }

  // Manejar edición
  const handleEdit = (modalidad: ConfigModalidad) => {
    setModalState({
      open: true,
      mode: 'edit',
      modalidad
    })
  }

  const handleViewChanges = (modalidad: ConfigModalidad) => {
    setAuditTarget({ model: 'config_modalidad', id: modalidad.id })
    setAuditOpen(true)
  }

  // Manejar eliminación
  const handleDelete = (modalidad: ConfigModalidad) => {
    setDeleteState({
      open: true,
      modalidad
    })
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      modalidad: undefined
    })
  }

  // Cerrar modal de cambios
  const handleCloseChanges = () => {
    setAuditOpen(false)
    setAuditTarget(null)
  }

  // Cerrar diálogo de eliminación
  const handleCloseDelete = () => {
    setDeleteState({
      open: false,
      modalidad: undefined
    })
  }

  // Manejar éxito en operaciones
  const handleSuccess = () => {
    loadModalidades()
  }

  // Manejar actualización
  const handleRefresh = () => {
    loadModalidades()
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Configuración de Modalidades
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
              Nueva Modalidad
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Buscar modalidades"
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
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : modalidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron modalidades
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  modalidades.map((modalidad) => (
                    <TableRow key={modalidad.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {modalidad.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <PermissionGuard permission="auditoria.ver">
                            <Tooltip title="Auditoría">
                              <IconButton
                                size="small"
                                onClick={() => handleViewChanges(modalidad)}
                                color="info"
                              >
                                <ManageHistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          {canEdit && (
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(modalidad)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(modalidad)}
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

      {/* Modal de Modalidad */}
      <ModalidadModal
        open={modalState.open}
        mode={modalState.mode}
        modalidad={modalState.modalidad}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteState.open}
        modalidad={deleteState.modalidad}
        onClose={handleCloseDelete}
        onSuccess={handleSuccess}
      />

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={handleCloseChanges} />
    </Box>
  )
}

export default ConfigModalidadPage
