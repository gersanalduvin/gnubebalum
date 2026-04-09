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
  InputAdornment
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
import GradoModal from '../components/GradoModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import gradoService from '../services/gradoService'
import type {
  ConfigGrado,
  GradoPaginatedResponse,
  GradoTableFilters,
  GradoModalState,
  DeleteConfirmState,
  GradoSearchParams
} from '../types'

const ConfigGradoPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados
  const [grados, setGrados] = useState<ConfigGrado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [filters, setFilters] = useState<GradoTableFilters>({ search: '' })
  const [modalState, setModalState] = useState<GradoModalState>({
    isOpen: false,
    mode: 'create',
    grado: undefined
  })
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    grado: undefined
  })

  // Permisos
  const canView = hasPermission('config_grado.index')
  const canCreate = hasPermission('config_grado.create')
  const canEdit = hasPermission('config_grado.update')
  const canDelete = hasPermission('config_grado.delete')

  // Función para cargar grados
  const loadGrados = useCallback(async () => {
    if (!canView) return

    setLoading(true)
    setError(null)

    try {
      const params: GradoSearchParams = {
        page: currentPage + 1,
        per_page: itemsPerPage,
        ...(filters.search && { search: filters.search })
      }

      const response: GradoPaginatedResponse = await gradoService.getGrados(params)
      
      setGrados(response.data || [])
      setTotalItems(response.total || 0)
    } catch (error: any) {
      console.error('Error al cargar grados:', error)
      setError(error.message || 'Error al cargar los grados')
      setGrados([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, filters, canView])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(loadGrados)
  }, [executeOnce])

  // Recargar cuando cambien los filtros o la página (solo si no es la carga inicial)
  useEffect(() => {
    if (currentPage > 0 || filters.search) {
      loadGrados()
    }
  }, [currentPage, filters])

  // Cargar parámetros de URL solo una vez
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1') - 1
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const search = searchParams.get('search') || ''

    setCurrentPage(page)
    setItemsPerPage(per_page)
    setFilters({ search })
  }, []) // Sin dependencias para que solo se ejecute una vez

  // Actualizar URL cuando cambien los parámetros
  const updateURL = useCallback((newParams: Partial<GradoSearchParams>) => {
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
    router.push(`/dashboard/configuracion/grados${newURL}`)
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
    
    // Debounce la búsqueda
    const timeoutId = setTimeout(() => {
      setCurrentPage(0)
      updateURL({ 
        page: 1, 
        per_page: itemsPerPage, 
        search: newSearch || undefined 
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  // Manejar creación
  const handleCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      grado: undefined
    })
  }

  // Manejar edición
  const handleEdit = (grado: ConfigGrado) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      grado
    })
  }

  // Manejar eliminación
  const handleDelete = (grado: ConfigGrado) => {
    setDeleteConfirm({
      isOpen: true,
      grado
    })
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      grado: undefined
    })
  }

  // Cerrar diálogo de eliminación
  const handleCloseDelete = () => {
    setDeleteConfirm({
      isOpen: false,
      grado: undefined
    })
  }

  // Manejar éxito en operaciones
  const handleSuccess = () => {
    loadGrados()
  }

  // Manejar actualización
  const handleRefresh = () => {
    loadGrados()
  }

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para ver esta página.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Configuración de Grados
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
              Nuevo Grado
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Buscar grados"
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
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Abreviatura</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : grados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron grados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  grados.map((grado) => (
                    <TableRow key={grado.id} hover>
                      <TableCell>{grado.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {grado.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={grado.abreviatura} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{grado.orden}</TableCell>
                      <TableCell>
                        <Chip
                          label={!grado.deleted_at ? 'Activo' : 'Inactivo'}
                          color={!grado.deleted_at ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(grado.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {canEdit && (
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(grado)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(grado)}
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

      {/* Modal de Grado */}
      <GradoModal
        open={modalState.isOpen}
        mode={modalState.mode}
        grado={modalState.grado}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteConfirm.isOpen}
        grado={deleteConfirm.grado}
        onClose={handleCloseDelete}
        onSuccess={handleSuccess}
      />
    </Box>
  )
}

export default ConfigGradoPage