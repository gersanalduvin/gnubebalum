'use client'

import { useEffect, useState } from 'react'

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import {
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
  Grid,
  IconButton,
  Pagination,
  Paper,
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

import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'

import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { PermissionGuard } from '@/components/PermissionGuard'
import InventarioCategoriaForm from '../components/InventarioCategoriaForm'
import categoriasService from '../services/services_categoriasService'
import type { InventarioCategoria } from '../types/types_index'

export default function InventarioCategoriasPage() {
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados
  const [categorias, setCategorias] = useState<InventarioCategoria[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Estados para formularios y diálogos
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<InventarioCategoria | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState<InventarioCategoria | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Estado para modal de cambios/auditoría
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  // Cargar datos iniciales
  const loadData = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: 15,
        ...(search && { search })
      }

      const response = await categoriasService.getCategorias(params)

      setTotalItems(response.data?.total || 0)
      setCategorias(response.data?.data || [])
      setCurrentPage(response.data?.current_page || 1)
      setTotalPages(response.data?.last_page || 1)
    } catch (error: any) {
      toast.error('Error al cargar las categorías')
      setCategorias([])
    } finally {
      setLoading(false)
    }
  }

  // Efecto inicial
  useEffect(() => {
    executeOnce(() => loadData(currentPage, searchTerm))
  }, [executeOnce, currentPage, searchTerm])

  // Handlers para formulario
  const handleOpenForm = (categoria?: InventarioCategoria) => {
    setSelectedCategoria(categoria || null)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setSelectedCategoria(null)
  }

  const handleFormSuccess = () => {
    loadData(currentPage, searchTerm)
  }

  // Handlers para eliminación
  const handleDeleteClick = (categoria: InventarioCategoria) => {
    setCategoriaToDelete(categoria)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoriaToDelete) return

    setDeleteLoading(true)
    try {
      await categoriasService.deleteCategoria(categoriaToDelete.id)
      toast.success('Categoría eliminada exitosamente')
      setDeleteDialogOpen(false)
      setCategoriaToDelete(null)
      loadData(currentPage, searchTerm)
    } catch (error: any) {
      toast.error('Error al eliminar la categoría')
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
  const handleViewChanges = (categoria: InventarioCategoria) => {
    setAuditTarget({ model: 'categoria', id: categoria.id })
    setAuditOpen(true)
  }

  const handleCloseChanges = () => {
    setAuditOpen(false)
    setAuditTarget(null)
  }

  const handleRefresh = () => {
    loadData(currentPage, searchTerm)
  }

  if (loading && categorias.length === 0) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Categorías de Inventario
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems='center' sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Buscar categorías...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch(searchTerm)}
                InputProps={{
                  endAdornment: (
                    <Button onClick={() => handleSearch(searchTerm)} size='small'>
                      <SearchIcon />
                    </Button>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} display='flex' justifyContent='flex-end'>
              {hasPermission('inventario_categorias.create') && (
                <Button variant='contained' startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
                  Nueva Categoría
                </Button>
              )}
            </Grid>
          </Grid>

          <TableContainer component={Paper} elevation={0}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría Padre</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography variant='body2' color='text.secondary'>
                        No se encontraron categorías
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map(categoria => (
                    <TableRow key={categoria.id} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight='medium'>
                          {categoria.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>{categoria.nombre}</Typography>
                      </TableCell>
                      <TableCell>
                        {categoria.categoria_padre ? (
                          <Typography variant='body2' color='text.secondary'>
                            {categoria.categoria_padre.codigo} - {categoria.categoria_padre.nombre}
                          </Typography>
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            Sin categoría padre
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={categoria.activo ? 'Activo' : 'Inactivo'}
                          size='small'
                          color={categoria.activo ? 'success' : 'default'}
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {categoria.descripcion || 'Sin descripción'}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {hasPermission('inventario_categorias.update') && (
                            <Tooltip title='Editar'>
                              <IconButton size='small' onClick={() => handleOpenForm(categoria)}>
                                <EditIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          )}
                          <PermissionGuard permission='auditoria.ver'>
                            <Tooltip title='Auditoría'>
                              <IconButton size='small' color='info' onClick={() => handleViewChanges(categoria)}>
                                <HistoryIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          {hasPermission('inventario_categorias.delete') && (
                            <Tooltip title='Eliminar'>
                              <IconButton size='small' color='error' onClick={() => handleDeleteClick(categoria)}>
                                <DeleteIcon fontSize='small' />
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
                color='primary'
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Formulario de categoría */}
      <InventarioCategoriaForm
        open={formOpen}
        onClose={handleCloseForm}
        categoria={selectedCategoria}
        onSuccess={handleFormSuccess}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la categoría &ldquo;{categoriaToDelete?.codigo} -{' '}
            {categoriaToDelete?.nombre}&rdquo;?
          </Typography>
          <Typography variant='body2' color='error' sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={handleCloseChanges} />
    </Box>
  )
}
