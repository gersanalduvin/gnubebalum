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
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import { PermissionGuard } from '@/components/PermissionGuard'
import seccionService from '../services/seccionService'
import SeccionModal from '../components/SeccionModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import type {
  ConfigSeccion,
  SeccionPaginatedResponse,
  SeccionTableFilters,
  SeccionModalState,
  DeleteConfirmState,
  SeccionSearchParams
} from '../types'

const ConfigSeccionPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados principales
  const [secciones, setSecciones] = useState<ConfigSeccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Estados de filtros
  const [filters, setFilters] = useState<SeccionTableFilters>({
    search: ''
  })

  // Estados de modales
  const [modalState, setModalState] = useState<SeccionModalState>({
    open: false,
    mode: 'create',
    seccion: undefined
  })

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    open: false,
    seccion: undefined
  })

  // Permisos
  const canCreate = hasPermission('config_seccion.create')
  const canEdit = hasPermission('config_seccion.update')
  const canDelete = hasPermission('config_seccion.delete')

  // Función para cargar secciones
  const loadSecciones = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: SeccionSearchParams = {
        page: currentPage + 1,
        per_page: itemsPerPage,
        ...(filters.search && { search: filters.search })
      }

      const response = await seccionService.getSecciones(params)
      
      if (response.success && response.data) {
        setSecciones(response.data.data || [])
        setTotalItems(response.data.total || 0)
      } else {
        setError(response.message || 'Error al cargar las secciones')
        setSecciones([])
        setTotalItems(0)
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar las secciones')
      setSecciones([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, filters.search])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(loadSecciones)
  }, [executeOnce])

  // Recargar cuando cambien los parámetros
  useEffect(() => {
    loadSecciones()
  }, [loadSecciones])

  // Cargar parámetros de URL solo una vez
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1') - 1
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const search = searchParams.get('search') || ''

    setCurrentPage(Math.max(0, page))
    setItemsPerPage(per_page)
    setFilters({ search })
  }, [searchParams])

  // Actualizar URL cuando cambien los parámetros
  const updateURL = useCallback(
    (newParams: { page?: number; per_page?: number; search?: string }) => {
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

      const newURL = params.toString() ? `?${params.toString()}` : ''
      router.push(`/config/secciones${newURL}`)
    },
    [router]
  )

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
    const newItemsPerPage = parseInt(event.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(0)
    updateURL({ 
      page: 1, 
      per_page: newItemsPerPage, 
      search: filters.search || undefined 
    })
  }

  // Manejar búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setFilters(prev => ({ ...prev, search: newSearch }))
  }

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0)
      updateURL({ 
        page: 1, 
        per_page: itemsPerPage, 
        search: filters.search || undefined 
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.search, itemsPerPage, updateURL])

  // Manejar creación
  const handleCreate = () => {
    setModalState({
      open: true,
      mode: 'create',
      seccion: undefined
    })
  }

  // Manejar edición
  const handleEdit = (seccion: ConfigSeccion) => {
    setModalState({
      open: true,
      mode: 'edit',
      seccion
    })
  }

  const handleViewChanges = (seccion: ConfigSeccion) => {
    setAuditTarget({ model: 'config_seccion', id: seccion.id })
    setAuditOpen(true)
  }

  // Manejar eliminación
  const handleDelete = (seccion: ConfigSeccion) => {
    setDeleteState({
      open: true,
      seccion
    })
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      seccion: undefined
    })
  }

  // Cerrar diálogo de eliminación
  const handleCloseDelete = () => {
    setDeleteState({
      open: false,
      seccion: undefined
    })
  }

  // Manejar éxito en operaciones
  const handleSuccess = () => {
    loadSecciones()
  }

  // Manejar actualización
  const handleRefresh = () => {
    loadSecciones()
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h4' component='h1'>
          Configuración de Secciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Actualizar
          </Button>
          {canCreate && (
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
              Nueva Sección
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label='Buscar secciones'
              value={filters.search}
              onChange={handleSearchChange}
              size='small'
              sx={{ minWidth: 300 }}
              placeholder='Buscar por nombre...'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
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
            <Alert severity='error' sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell>Fecha Creación</TableCell>
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
                ) : secciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
                        No se encontraron secciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  secciones.map(seccion => (
                    <TableRow key={seccion.id} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight='medium'>
                          {seccion.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {seccion.orden}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {new Date(seccion.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <PermissionGuard permission='auditoria.ver'>
                            <Tooltip title='Auditoría'>
                              <IconButton size='small' onClick={() => handleViewChanges(seccion)} color='info'>
                                <ManageHistoryIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          {canEdit && (
                            <IconButton size='small' onClick={() => handleEdit(seccion)} color='primary'>
                              <EditIcon fontSize='small' />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton size='small' onClick={() => handleDelete(seccion)} color='error'>
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
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* Modal de Sección */}
      <SeccionModal
        open={modalState.open}
        mode={modalState.mode}
        seccion={modalState.seccion}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteState.open}
        seccion={deleteState.seccion}
        onClose={handleCloseDelete}
        onSuccess={handleSuccess}
      />

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Box>
  )
}

export default ConfigSeccionPage
