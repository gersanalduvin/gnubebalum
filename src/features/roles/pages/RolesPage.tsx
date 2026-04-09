'use client'

import { memo, useCallback, useEffect, useState } from 'react'

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    InputAdornment,
    Paper,
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

import { PermissionGuard } from '@/components/PermissionGuard'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import RoleModal from '../components/RoleModal'
import rolesService from '../services/rolesService'
import type { DeleteConfirmState, Role, RoleModalState, RoleTableFilters } from '../types'

// Estilos de tabla de la plantilla
import tableStyles from '@core/styles/table.module.css'

const RolesPage: React.FC = () => {
  // Hooks
  const { hasPermission, isSuperAdmin, isLoading: permissionsLoading } = usePermissions()
  const { executeOnce } = useInitialLoad()

  // Estados
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filters, setFilters] = useState<RoleTableFilters>({
    page: 1,
    per_page: 10,
    search: ''
  })

  // Estados de modales
  const [modalState, setModalState] = useState<RoleModalState>({
    isOpen: false,
    mode: 'create'
  })
  
  const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
    isOpen: false
  })

  // Permisos
  const canView = isSuperAdmin || hasPermission('roles.ver')

  // Función para cargar roles
  const loadRoles = useCallback(async () => {
    if (!canView) return

    setLoading(true)
    setError(null)

    try {
      const response = await rolesService.getRoles(filters)
      
      setRoles(response.data.data || [])
      setTotalCount(response.data.total || 0)
    } catch (error: any) {
      console.error('Error al cargar roles:', error)
      let errorMessage = 'Error al cargar los roles'
      
      if (error.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para acceder a esta información.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setRoles([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [filters, canView])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    if (!permissionsLoading && (isSuperAdmin || hasPermission('roles.ver'))) {
      executeOnce(loadRoles)
    }
  }, [executeOnce, loadRoles, permissionsLoading, isSuperAdmin, hasPermission])

  // Recargar cuando cambien los filtros (solo si no es la carga inicial)
  useEffect(() => {
    if ((filters.page && filters.page > 1) || filters.search) {
      loadRoles()
    }
  }, [filters, loadRoles])

  // Handlers para paginación
  const handlePageChange = useCallback((event: unknown, newPage: number) => {
    setCurrentPage(newPage)
    setFilters(prev => ({ ...prev, page: newPage + 1 }))
  }, [])

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(0)
    setFilters(prev => ({
      ...prev,
      page: 1,
      per_page: newItemsPerPage
    }))
  }, [])

  // Handler para búsqueda
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
    setCurrentPage(0)
  }, [])

  const handleCreateRole = useCallback(() => {
    setModalState({
      isOpen: true,
      mode: 'create'
    })
  }, [])

  const handleEditRole = useCallback((role: Role) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      role
    })
  }, [])

  const handleDeleteRole = useCallback((role: Role) => {
    setDeleteState({
      isOpen: true,
      role
    })
  }, [])

  const handleModalClose = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'create'
    })
  }, [])

  const handleDeleteClose = useCallback(() => {
    setDeleteState({
      isOpen: false,
      role: undefined
    })
  }, [])

  const handleRoleCreated = useCallback(() => {
    loadRoles()
    handleModalClose()
  }, [loadRoles, handleModalClose])

  const handleRoleUpdated = useCallback(() => {
    loadRoles()
    handleModalClose()
  }, [loadRoles, handleModalClose])

  const handleRoleDeleted = useCallback(() => {
    loadRoles()
    handleDeleteClose()
  }, [loadRoles, handleDeleteClose])



  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <Typography variant='h4' component='h1'>
            Gestión de Roles
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Administra los roles y permisos del sistema
          </Typography>
        </div>
        
        <PermissionGuard permission='roles.crear'>
          <Button
            variant='contained'
            onClick={handleCreateRole}
            startIcon={<i className='ri-add-line' />}
          >
            Crear Rol
          </Button>
        </PermissionGuard>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent>
          <Box className='flex gap-4 items-center'>
            <TextField
              size='small'
              placeholder='Buscar roles...'
              value={filters.search || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }}
              className='min-w-[300px]'
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className='p-0'>
          {error && (
            <Alert severity='error' className='m-6'>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box className='flex justify-center items-center p-8'>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table className={tableStyles.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Permisos</TableCell>
                      <TableCell>Fecha Creación</TableCell>
                      <TableCell align='right'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id} hover>
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>
                            {role.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {role.permisos.length} permisos
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {new Date(role.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Box className='flex gap-1'>
                            <PermissionGuard permission='roles.editar'>
                              <Tooltip title='Editar rol'>
                              <IconButton
                                  size='small'
                                  onClick={() => handleEditRole(role)}
                                >
                                  <i className='ri-edit-line' />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                            
                            <PermissionGuard permission='roles.eliminar'>
                              <Tooltip title='Eliminar rol'>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => handleDeleteRole(role)}
                                >
                                  <i className='ri-delete-bin-line' />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {roles.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5} align='center'>
                          <Typography variant='body2' color='text.secondary' className='py-8'>
                            No se encontraron roles
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component='div'
                count={totalCount}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <RoleModal
        open={modalState.isOpen}
        mode={modalState.mode}
        role={modalState.role}
        onClose={handleModalClose}
        onSuccess={modalState.mode === 'create' ? handleRoleCreated : handleRoleUpdated}
      />
      
      <DeleteConfirmDialog
        open={deleteState.isOpen}
        role={deleteState.role}
        onClose={handleDeleteClose}
        onSuccess={handleRoleDeleted}
      />
    </div>
  )
}

export default memo(RolesPage)
