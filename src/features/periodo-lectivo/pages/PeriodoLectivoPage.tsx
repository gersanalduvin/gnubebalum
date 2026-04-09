'use client'

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'

import {
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
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'

import { usePermissions } from '@/hooks/usePermissions'

import periodoLectivoService from '../services/periodoLectivoService'
import type { ConfPeriodoLectivo, PeriodoLectivoTableFilters, PeriodoLectivoModalState, DeleteConfirmState } from '../types'
import PeriodoLectivoModal from '../components/PeriodoLectivoModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaViewer from '../components/AuditoriaViewer'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import tableStyles from '@core/styles/table.module.css'
import { openDialogAccessibly } from '@/utils/dialogUtils'

const PeriodoLectivoPage: React.FC = () => {
  // Estados
  const [periodosLectivos, setPeriodosLectivos] = useState<ConfPeriodoLectivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  const [filters, setFilters] = useState<PeriodoLectivoTableFilters>({
    page: 1,
    per_page: 10,
    search: ''
  })

  const [lastFetchKey, setLastFetchKey] = useState<string>('')
  
  // Estados para modales
  const [modalState, setModalState] = useState<PeriodoLectivoModalState>({
    isOpen: false,
    mode: 'create'
  })
  
  const [deleteConfirmState, setDeleteConfirmState] = useState<DeleteConfirmState>({
    isOpen: false
  })

  // Estado para el modal de cambios
  const [changesModalState, setChangesModalState] = useState<{
    open: boolean;
    periodo: ConfPeriodoLectivo | null;
  }>({
    open: false,
    periodo: null
  });
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  // Ref para cancelar peticiones
  const abortControllerRef = useRef<AbortController | null>(null)

  // Hook de permisos
  const { hasPermission, isAuthenticated, isSuperAdmin } = usePermissions()

  // Refs para controlar la carga y cache
  const isInitialLoad = useRef(true)
  const filtersRef = useRef(filters)
  
  // Actualizar ref cuando cambien los filtros
  filtersRef.current = filters

  // Función para cargar períodos lectivos con cache y cancelación
  const loadPeriodosLectivos = useCallback(async (filtersToUse: PeriodoLectivoTableFilters) => {
    // Generar clave única para esta petición
    const fetchKey = JSON.stringify(filtersToUse)
    
    // Evitar llamadas duplicadas
    if (fetchKey === lastFetchKey && !isInitialLoad.current) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setLastFetchKey(fetchKey)

      // Cancelar petición anterior si existe
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController()

      const response = await periodoLectivoService.getPeriodosLectivos(filtersToUse, {
        signal: abortControllerRef.current.signal
      })

      // La respuesta del servicio ya es la estructura paginada: { current_page, data: [...], total, ... }
      // Los períodos lectivos están en response.data (que es el array de ConfPeriodoLectivo)
      setPeriodosLectivos(response.data || [])
      setTotalCount(response.total || 0)
    } catch (error: any) {
      // Solo mostrar error si no es un AbortError
      if (error.name !== 'AbortError') {
        console.error('Error al cargar períodos lectivos:', error)
        
        let errorMessage = 'Error al cargar los períodos lectivos';
        
        // Manejo específico de errores de autenticación
        if (error.status === 401 || error.isAuthError) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';

          // Redirigir al login después de un breve delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para acceder a esta información.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor. Contacta al administrador.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage)
        setPeriodosLectivos([])
        setTotalCount(0)
      }
      // Si es AbortError, no hacemos nada (petición cancelada)
    } finally {
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [lastFetchKey])

  // Efecto unificado para cargar períodos lectivos
  useEffect(() => {
    // Verificar si el usuario está autenticado y tiene permisos
    if (!isAuthenticated) {
      return;
    }
    
    // Si es superadmin, tiene acceso automático, sino verificar permisos específicos
     if (!isSuperAdmin && !hasPermission('conf_periodo_lectivo.index')) {
       return;
     }
    
    // Pequeño delay para evitar llamadas múltiples en el montaje inicial
    const timeoutId = setTimeout(() => {
      loadPeriodosLectivos(filters)

      if (isInitialLoad.current) {
        isInitialLoad.current = false
      }
    }, isInitialLoad.current ? 0 : 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [filters, loadPeriodosLectivos, hasPermission, isAuthenticated, isSuperAdmin])

  // Limpiar AbortController al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Handlers para paginación
  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }))
  }, [])

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newPerPage = parseInt(event.target.value, 10)

    setFilters(prev => ({ ...prev, per_page: newPerPage, page: 1 }))
  }, [])

  // Handler para búsqueda
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    setSearchValue(value)
    
    // Debounce de búsqueda
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }))
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [])

  // Función para abrir el modal de cambios
  const handleViewChanges = (periodo: ConfPeriodoLectivo) => {
    openDialogAccessibly(() => setChangesModalState({
      open: true,
      periodo
    }));
  };

  // Función para cerrar el modal de cambios
  const handleCloseChangesModal = () => {
    setChangesModalState({
      open: false,
      periodo: null
    });
  };

  // Handlers para modal
  const handleOpenCreateModal = useCallback(() => {
    openDialogAccessibly(() => setModalState({ isOpen: true, mode: 'create' }))
  }, [])

  const handleOpenEditModal = useCallback((periodoLectivo: ConfPeriodoLectivo) => {
    openDialogAccessibly(() => setModalState({ isOpen: true, mode: 'edit', periodoLectivo }))
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, mode: 'create' })
  }, [])

  // Handlers para eliminar
  const handleOpenDeleteConfirm = useCallback((periodoLectivo: ConfPeriodoLectivo) => {
    openDialogAccessibly(() => setDeleteConfirmState({ isOpen: true, periodoLectivo }))
  }, [])

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmState({ isOpen: false })
  }, [])

  // Handler para refrescar datos después de operaciones CRUD
  const handleDataChange = useCallback(() => {
    // Limpiar el cache para forzar la recarga
    setLastFetchKey('')
    loadPeriodosLectivos(filters)
  }, [loadPeriodosLectivos, filters])

  // Memoizar datos de la tabla para optimizar rendimiento
  const tableData = useMemo(() => periodosLectivos, [periodosLectivos])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h4" component="h1" className="font-semibold text-textPrimary">
            Períodos Lectivos
          </Typography>
          <Typography variant="body2" className="text-textSecondary mt-1">
            Gestión de períodos lectivos del sistema
          </Typography>
        </div>

        <PermissionGuard permission="conf_periodo_lectivo.create">
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenCreateModal}
            className="min-w-[140px]"
          >
            Nuevo Período
          </Button>
        </PermissionGuard>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent>
          <Box className="flex gap-4 items-center">
            <TextField
              placeholder="Buscar períodos lectivos..."
              value={searchValue}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              className="flex-1 max-w-md"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-search-line text-textSecondary" />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <Alert severity="error" className="m-6 mb-0">
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} className="shadow-none">
            <Table className={tableStyles.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Período Nota</TableCell>
                  <TableCell>Período Matrícula</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" className="py-8">
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(tableData) && tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" className="py-8">
                      <Typography variant="body2" className="text-textSecondary">
                        No se encontraron períodos lectivos
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(tableData) ? (
                  tableData.map((periodo) => (
                    <TableRow key={periodo.id} hover>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">
                          {periodo.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {periodo.periodo_nota ? (
                          <Tooltip title="Período de notas activo">
                            <i className="ri-check-line text-success text-lg" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Período de notas inactivo">
                            <i className="ri-close-line text-error text-lg" />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {periodo.periodo_matricula ? (
                          <Tooltip title="Período de matrícula activo">
                            <i className="ri-check-line text-success text-lg" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Período de matrícula inactivo">
                            <i className="ri-close-line text-error text-lg" />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex justify-center gap-2">
                          <PermissionGuard permission="auditoria.ver">
                            <Tooltip title="Auditoría">
                              <IconButton
                                size="small"
                                onClick={() => { setAuditTarget({ model: 'conf_periodo_lectivo', id: periodo.id }); setAuditOpen(true) }}
                                className="text-info-main hover:bg-info-lightOpacity"
                              >
                                <ManageHistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>

                          <PermissionGuard permission="conf_periodo_lectivo.update">
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditModal(periodo)}
                                className="text-textSecondary hover:text-primary"
                              >
                                <i className="ri-edit-line text-[22px]" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>

                          <PermissionGuard permission="conf_periodo_lectivo.delete">
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteConfirm(periodo)}
                                className="text-textSecondary hover:text-error"
                              >
                                <i className="ri-delete-bin-line text-[22px]" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center" className="py-8">
                      <Typography variant="body2" className="text-textSecondary">
                        Error al cargar los datos
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {!loading && Array.isArray(tableData) && tableData.length > 0 && (
            <TablePagination
              component="div"
              count={totalCount}
              page={(filters.page || 1) - 1}
              onPageChange={handlePageChange}
              rowsPerPage={filters.per_page || 10}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de auditoría (endpoint summary) */}
      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />

      {/* Modal para mostrar cambios (legacy viewer) */}
      <Dialog
        open={changesModalState.open}
        onClose={handleCloseChangesModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          className: "rounded-xl shadow-2xl"
        }}
      >
        <DialogTitle className="bg-gradient-to-r from-primary-main to-primary-dark text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <i className="ri-history-line text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-semibold">
                  Historial de Cambios
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  {changesModalState.periodo?.nombre}
                </Typography>
              </div>
            </div>
            <IconButton
              onClick={handleCloseChangesModal}
              size="small"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <i className="ri-close-line text-xl" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="p-6">
          {changesModalState.periodo?.cambios && changesModalState.periodo.cambios.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-500 p-1.5 rounded-lg">
                    <i className="ri-file-text-line text-white text-sm" />
                  </div>
                  <Typography variant="subtitle1" className="font-semibold text-blue-900">
                    Registro de Modificaciones
                  </Typography>
                </div>
                <AuditoriaViewer cambios={changesModalState.periodo.cambios} />
              </div>
              
              {/* Información adicional del período */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-green-500 p-1 rounded">
                      <i className="ri-bookmark-line text-white text-xs" />
                    </div>
                    <Typography variant="subtitle2" className="font-semibold text-green-900">
                      Período de Notas
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    {changesModalState.periodo.periodo_nota ? (
                      <>
                        <i className="ri-check-circle-line text-green-600 text-lg" />
                        <Typography variant="body2" className="text-green-700 font-medium">
                          Activo
                        </Typography>
                      </>
                    ) : (
                      <>
                        <i className="ri-close-circle-line text-red-500 text-lg" />
                        <Typography variant="body2" className="text-red-600 font-medium">
                          Inactivo
                        </Typography>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-500 p-1 rounded">
                      <i className="ri-user-add-line text-white text-xs" />
                    </div>
                    <Typography variant="subtitle2" className="font-semibold text-purple-900">
                      Período de Matrícula
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    {changesModalState.periodo.periodo_matricula ? (
                      <>
                        <i className="ri-check-circle-line text-green-600 text-lg" />
                        <Typography variant="body2" className="text-green-700 font-medium">
                          Activo
                        </Typography>
                      </>
                    ) : (
                      <>
                        <i className="ri-close-circle-line text-red-500 text-lg" />
                        <Typography variant="body2" className="text-red-600 font-medium">
                          Inactivo
                        </Typography>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-list-3-line text-gray-400 text-3xl" />
              </div>
              <Typography variant="h6" className="text-gray-600 mb-2">
                Sin cambios registrados
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                No hay cambios registrados para este período lectivo
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-0">
          <Button
            onClick={handleCloseChangesModal}
            variant="contained"
            color="primary"
            className="min-w-[100px]"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para crear/editar */}
      <PeriodoLectivoModal
        open={modalState.isOpen}
        mode={modalState.mode}
        periodoLectivo={modalState.periodoLectivo}
        onClose={handleCloseModal}
        onSuccess={handleDataChange}
      />

      {/* Modal de confirmación para eliminar */}
      <DeleteConfirmDialog
        open={deleteConfirmState.isOpen}
        periodoLectivo={deleteConfirmState.periodoLectivo}
        onClose={handleCloseDeleteConfirm}
        onSuccess={handleDataChange}
      />
    </div>
  )
}

export default memo(PeriodoLectivoPage)
