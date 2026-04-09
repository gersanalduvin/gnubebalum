'use client'

import { useCallback, useEffect, useRef, useState } from 'react'


import { Add, Delete as DeleteIcon, Edit, Email as EmailIcon, History as HistoryIcon, Print as PrintIcon, Refresh } from '@mui/icons-material'
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
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material'

import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { httpClient } from '@/utils/httpClient'
import { UsersGruposService } from '../services/usersGruposService'
import type { UserGrupo } from '../types'
import UserGrupoModal from './UserGrupoModal'

interface RegistroAcademicoProps {
  userId: number
}

interface ModalState {
  open: boolean
  mode: 'create' | 'edit'
  userGrupo?: UserGrupo
}

interface DeleteConfirmState {
  open: boolean
  userGrupo?: UserGrupo
}

const RegistroAcademico: React.FC<RegistroAcademicoProps> = ({ userId }) => {
  const [userGrupos, setUserGrupos] = useState<UserGrupo[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUserGrupo, setSelectedUserGrupo] = useState<UserGrupo | undefined>(undefined)
  const [deleteConfirmState, setDeleteConfirmState] = useState<DeleteConfirmState>({ open: false })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)
  
  // Ref para controlar si ya se cargaron los datos para este userId
  const loadedUserIdRef = useRef<number | null>(null)
  const isLoadingRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!userId) return
    
    // Evitar cargas duplicadas
    if (isLoadingRef.current || loadedUserIdRef.current === userId) return
    
    try {
      isLoadingRef.current = true
      setLoading(true)
      const data = await UsersGruposService.getUserGruposByUser(userId)
      setUserGrupos(data)
      loadedUserIdRef.current = userId
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los registros académicos')
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [userId])

  // Efectos
  useEffect(() => {
    if (userId && loadedUserIdRef.current !== userId) {
      loadData()
    }
  }, [userId, loadData])

  // Handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // TODO: Implementar paginación en el servicio
  }

  // Handlers del modal
  const handleCreate = () => {
    setModalMode('create')
    setSelectedUserGrupo(undefined)
    setModalOpen(true)
  }

  const handleEdit = (userGrupo: UserGrupo) => {
    setModalMode('edit')
    setSelectedUserGrupo(userGrupo)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedUserGrupo(undefined)
  }

  const handleModalSuccess = () => {
    // Resetear el ref para permitir recarga después de cambios
    loadedUserIdRef.current = null
    loadData()
  }

  const handleDelete = (userGrupo: UserGrupo) => {
    setDeleteConfirmState({
      open: true,
      userGrupo
    })
  }

  const handlePrintPDF = async (userGrupo: UserGrupo) => {
    setPrintLoading(true)
    try {
      // Usar httpClient que ya maneja la autenticación automáticamente
      const response = await httpClient.get<any>(`/bk/v1/users-grupos/${userGrupo.id}/ficha-inscripcion-pdf`, {
        headers: {
          'Accept': 'application/pdf, */*'
        }
      })

      // Validar y extraer Blob de la respuesta del httpClient
      if (!response || !response.data || !(response.data instanceof Blob)) {
        throw new Error('La respuesta no contiene un archivo PDF válido')
      }
      const blob: Blob = response.data

      // Crear URL del blob y abrir en nueva pestaña para visualizar
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Limpiar la URL después de un tiempo para liberar memoria
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
      
    } catch (error: any) {
      // Manejar errores específicos del httpClient
      if (error.status === 401) {
        // Solo redirigir si es una llamada API real
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login')) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
          window.location.href = '/auth/login'
        }
        return
      }
      
      const errorMessage = error.data?.message || error.message || 'Error al generar el PDF'
      toast.error(errorMessage)
    } finally {
      setPrintLoading(false)
    }
  }

  const handleSendFichaEmail = async (userGrupo: UserGrupo) => {
    setEmailLoading(true)
    try {
      await UsersGruposService.sendFichaInscripcionEmail(userGrupo.id)
      toast.success('Ficha de inscripción encolada para envío por correo')
    } catch (error: any) {
      if (error.status === 401) {
        // Solo redirigir si es una llamada API real
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login')) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
          window.location.href = '/auth/login'
        }
        return
      }
      const errorMessage = error.message || error.data?.message || 'Error al enviar la ficha por correo'
      toast.error(errorMessage)
    } finally {
      setEmailLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmState.userGrupo) return

    setDeleteLoading(true)
    try {
      await UsersGruposService.deleteUserGrupo(deleteConfirmState.userGrupo.id)
      toast.success('Registro eliminado exitosamente')
      setDeleteConfirmState({ open: false })
      
      // Forzar recarga de datos
      loadedUserIdRef.current = null
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el registro')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRefresh = () => {
    // Resetear el ref para forzar recarga
    loadedUserIdRef.current = null
    loadData()
  }

  const handleViewChanges = (userGrupo: UserGrupo) => {
    setAuditTarget({ model: 'users_grupos', id: userGrupo.id })
    setAuditOpen(true)
  }

  const getEstadoChip = (estado: string) => {
    const colors = {
      activo: 'success',
      no_activo: 'warning',
      retiro_anticipado: 'error'
    } as const

    return (
      <Chip
        label={estado.replace('_', ' ').toUpperCase()}
        color={colors[estado as keyof typeof colors] || 'default'}
        size="small"
      />
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return (
    <Box>
      {/* Header con botones de acción */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2">
          Registro Académico
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={handleRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <PermissionGuard permission="usuarios.alumnos.matricular">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
              size="small"
            >
              Nueva Matrícula
            </Button>
          </PermissionGuard>
        </Box>
      </Box>

      {/* Tabla */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Período Lectivo</TableCell>
                  <TableCell>Grado</TableCell>
                  <TableCell>Grupo</TableCell>
                  <TableCell>Turno</TableCell>
                  <TableCell>Fecha Matrícula</TableCell>
                  <TableCell>Estado</TableCell>
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
                ) : !userGrupos || userGrupos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron registros académicos
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  userGrupos.map((userGrupo) => (
                    <TableRow key={userGrupo.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {userGrupo.periodo_lectivo?.nombre || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {userGrupo.grado?.nombre || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {userGrupo.grupo?.grado?.nombre && userGrupo.grupo?.seccion?.nombre 
                            ? `${userGrupo.grupo.grado.nombre} - ${userGrupo.grupo.seccion.nombre}`
                            : userGrupo.grupo?.nombre || 'Sin grupo'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {userGrupo.turno?.nombre || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(userGrupo.fecha_matricula)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getEstadoChip(userGrupo.estado)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <PermissionGuard permission="usuarios.alumnos.matricular">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(userGrupo)}
                              color="primary"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="usuarios.alumnos.ver">
                            <Tooltip title="Imprimir Ficha de Inscripción">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handlePrintPDF(userGrupo)}
                                disabled={printLoading}
                              >
                                {printLoading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <PrintIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>

                          <PermissionGuard permission="usuarios.alumnos.ver">
                            <Tooltip title="Enviar ficha por correo electrónico">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleSendFichaEmail(userGrupo)}
                                disabled={emailLoading}
                              >
                                {emailLoading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <EmailIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="usuarios.alumnos.matricular">
                            <Tooltip title="Ver Cambios">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewChanges(userGrupo)}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          
                          <PermissionGuard permission="usuarios.alumnos.matricular">
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(userGrupo)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {userGrupos.length > 0 && (
            <TablePagination
              component="div"
              count={userGrupos.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[5, 10, 25]}
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar */}
      <UserGrupoModal
        open={modalOpen}
        mode={modalMode}
        userGrupo={selectedUserGrupo}
        userId={userId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={deleteConfirmState.open}
        onClose={() => setDeleteConfirmState({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar este registro académico? Esta acción no se puede deshacer.
          </Typography>
          {deleteConfirmState.userGrupo && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Período:</strong> {deleteConfirmState.userGrupo.periodo_lectivo?.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Grado:</strong> {deleteConfirmState.userGrupo.grado?.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Grupo:</strong> {deleteConfirmState.userGrupo.grupo?.nombre}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmState({ open: false })}
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal global de auditoría */}
      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Box>
  )
}

export default RegistroAcademico
