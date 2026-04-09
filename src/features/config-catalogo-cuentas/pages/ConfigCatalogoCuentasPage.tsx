'use client'

import { useState, useEffect } from 'react'

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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Pagination,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Grid
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon
} from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import { useInitialLoad } from '@/hooks/useInitialLoad'

import catalogoCuentasService from '../services/services_catalogoCuentasService'
import ConfigCatalogoCuentaForm from '../components/ConfigCatalogoCuentaForm'
import AuditoriaViewer from '@/components/widgets/AuditoriaViewer'
import type { ConfigCatalogoCuenta, PaginatedResponse } from '../types/types_index'

export default function ConfigCatalogoCuentasPage() {
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()
  
  // Estados
  const [cuentas, setCuentas] = useState<ConfigCatalogoCuenta[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Estados para formularios y diálogos
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCuenta, setSelectedCuenta] = useState<ConfigCatalogoCuenta | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cuentaToDelete, setCuentaToDelete] = useState<ConfigCatalogoCuenta | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Estado para modal de cambios/auditoría
  const [changesModalState, setChangesModalState] = useState<{
    open: boolean
    cuenta: ConfigCatalogoCuenta | null
  }>({
    open: false,
    cuenta: null
  })

  // Cargar datos iniciales
  const loadData = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: 15,
        ...(search && { search })
      }
      
      const response = await catalogoCuentasService.getCuentas(params)
      
      // Verificar si la respuesta tiene la estructura correcta
      if (response && response.data) {
        setTotalItems(response.data.total || 0)
        setCuentas(response.data.data || [])
        setCurrentPage(response.data.current_page || 1)
        setTotalPages(response.data.last_page || 1)
      } else {
        // Fallback para respuestas sin estructura ApiResponse
        setCuentas([])
        setTotalItems(0)
        setCurrentPage(1)
        setTotalPages(1)
        toast.error('Error en la estructura de respuesta del servidor')
      }
    } catch (error: any) {
      console.error('Error al cargar cuentas:', error)
      const errorMessage = error?.data?.message || error?.message || 'Error al cargar las cuentas'
      toast.error(errorMessage)
      setCuentas([])
      setTotalItems(0)
      setCurrentPage(1)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  // Efecto inicial
  useEffect(() => {
    executeOnce(() => loadData(currentPage, searchTerm))
  }, [executeOnce, currentPage, searchTerm])

  // Handlers para formulario
  const handleOpenForm = (cuenta?: ConfigCatalogoCuenta) => {
    setSelectedCuenta(cuenta || null)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setSelectedCuenta(null)
  }

  const handleFormSuccess = () => {
    loadData(currentPage, searchTerm)
  }

  // Handlers para eliminación
  const handleDeleteClick = (cuenta: ConfigCatalogoCuenta) => {
    setCuentaToDelete(cuenta)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!cuentaToDelete) return
    
    setDeleteLoading(true)
    try {
      await catalogoCuentasService.deleteCuenta(cuentaToDelete.id)
      toast.success('Cuenta eliminada exitosamente')
      setDeleteDialogOpen(false)
      setCuentaToDelete(null)
      loadData(currentPage, searchTerm)
    } catch (error: any) {
      console.error('Error al eliminar cuenta:', error)
      toast.error('Error al eliminar la cuenta')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handlers para búsqueda y paginación
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    loadData(1, value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadData(page, searchTerm)
  }

  // Handler para ver cambios/auditoría
  const handleViewChanges = (cuenta: ConfigCatalogoCuenta) => {
    setChangesModalState({
      open: true,
      cuenta
    })
  }

  const handleCloseChanges = () => {
    setChangesModalState({
      open: false,
      cuenta: null
    })
  }

  const handleRefresh = () => {
    loadData(currentPage, searchTerm)
  }

  if (loading && cuentas.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Catálogo de Cuentas
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar cuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                InputProps={{
                  endAdornment: (
                    <Button onClick={() => handleSearch(searchTerm)} size="small">
                      <SearchIcon />
                    </Button>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} display="flex" justifyContent="flex-end">
              {hasPermission('config_catalogo_cuentas.create') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenForm()}
                >
                  Nueva Cuenta
                </Button>
              )}
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Naturaleza</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Es Grupo</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : cuentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron cuentas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cuentas.map((cuenta) => (
                    <TableRow key={cuenta.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {cuenta.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {cuenta.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cuenta.tipo} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cuenta.naturaleza} 
                          size="small" 
                          color={cuenta.naturaleza === 'deudora' ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cuenta.estado} 
                          size="small" 
                          color={cuenta.estado === 'activo' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={cuenta.es_grupo ? 'Sí' : 'No'} 
                          size="small" 
                          color={cuenta.es_grupo ? 'info' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {hasPermission('config_catalogo_cuentas.update') && (
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenForm(cuenta)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Ver cambios">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewChanges(cuenta)}
                            >
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {hasPermission('config_catalogo_cuentas.delete') && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(cuenta)}
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
          </TableContainer>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Formulario de cuenta */}
      <ConfigCatalogoCuentaForm
        open={formOpen}
        onClose={handleCloseForm}
        cuenta={selectedCuenta}
        onSuccess={handleFormSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la cuenta &ldquo;{cuentaToDelete?.codigo} - {cuentaToDelete?.nombre}&rdquo;?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de auditoría/cambios */}
      <Dialog 
        open={changesModalState.open} 
        onClose={handleCloseChanges}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Historial de Cambios - {changesModalState.cuenta?.codigo} - {changesModalState.cuenta?.nombre}
        </DialogTitle>
        <DialogContent>
          {changesModalState.cuenta && (
            <AuditoriaViewer cambios={changesModalState.cuenta.cambios} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChanges}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}