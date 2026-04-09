'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { useInitialLoad } from '@/hooks/useInitialLoad'

import AuditoriaViewer from '../components/AuditoriaViewer'
import RubroDeleteConfirmDialog from '../components/RubroDeleteConfirmDialog'
import RubroModal from '../components/RubroModal'
import planPagoService from '../services/planPagoService'
import type {
  ConfigPlanPago,
  ConfigRubro,
  CursoLectivo,
  RubroDeleteConfirmState,
  RubroModalState,
  ValidationErrors
} from '../types'

const RubrosPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { executeOnce } = useInitialLoad()

  // Estados principales
  const [rubros, setRubros] = useState<ConfigRubro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Estado para información del plan de pago
  const [planPagoInfo, setPlanPagoInfo] = useState<ConfigPlanPago | null>(null)

  // Estados para filtros (ya no necesarios pero mantenemos para compatibilidad)
  const [cursosLectivos, setCursosLectivos] = useState<CursoLectivo[]>([])
  const [planesPago, setPlanesPago] = useState<ConfigPlanPago[]>([])
  const [selectedPeriodoLectivo, setSelectedPeriodoLectivo] = useState<string>('')
  const [selectedPlanPago, setSelectedPlanPago] = useState<string>('')

  // Estados de modales
  const [modalState, setModalState] = useState<RubroModalState>({
    open: false,
    mode: 'create',
    rubro: undefined
  })

  const [deleteConfirmState, setDeleteConfirmState] = useState<RubroDeleteConfirmState>({
    open: false,
    rubro: undefined
  })

  // Estado para ver cambios
  const [auditoriaDialog, setAuditoriaDialog] = useState<{
    open: boolean
    rubro?: ConfigRubro
  }>({
    open: false,
    rubro: undefined
  })

  // Cargar períodos lectivos
  const loadPeriodosLectivos = useCallback(async () => {
    try {
      const response = await planPagoService.getPeriodosLectivos()
      
      // getPeriodosLectivos ahora devuelve directamente CursoLectivo[]
      setCursosLectivos(response)
    } catch (error: any) {
      setCursosLectivos([])
      console.error('Error al cargar períodos lectivos:', error)
    }
  }, [])

  // Cargar planes de pago por período lectivo
  const loadPlanesPago = useCallback(async (periodoLectivoId: number) => {
    try {
      const response = await planPagoService.getPlanesByPeriodo(periodoLectivoId)
      
      // getPlanesByPeriodo ahora devuelve directamente ConfigPlanPago[]
      setPlanesPago(response)
    } catch (error: any) {
      console.error('Error al cargar planes de pago:', error)
      setPlanesPago([])
    }
  }, [])

  // Cargar rubros por plan de pago (para compatibilidad con modales)
  const loadRubros = useCallback(async (planPagoId?: number) => {
    try {
      setLoading(true)
      setErrors({})

      let rubrosData: ConfigRubro[] = []
      if (planPagoId) {
        const response = await planPagoService.getRubrosByPlanPago(planPagoId)
        
        // getRubrosByPlanPago ahora devuelve directamente ConfigRubro[]
        rubrosData = response
      }

      setRubros(rubrosData)
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Error al cargar los rubros'
      toast.error(errorMessage)
      setErrors({ general: [errorMessage] })
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar información del plan de pago y sus rubros (solo para carga inicial)
  const loadPlanPagoInfo = useCallback(async (planPagoId: number) => {
    try {
      setLoading(true)
      setErrors({})

      // Cargar información completa del plan de pago con detalles
      const response = await planPagoService.getPlanPagoConDetalles(planPagoId)

      setPlanPagoInfo(response.plan_pago)

      // Los rubros vienen en response.detalles.data
      const rubrosData = response.detalles?.data || []
      setRubros(rubrosData)

      // Establecer el plan seleccionado para compatibilidad con modales
      setSelectedPlanPago(planPagoId.toString())
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Error al cargar la información del plan de pago'
      toast.error(errorMessage)
      setErrors({ general: [errorMessage] })
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(async () => {
      const planPagoId = searchParams.get('planPagoId')

      if (planPagoId) {
        await loadPlanPagoInfo(parseInt(planPagoId))
      } else {
        // Si no hay planPagoId, cargar períodos lectivos (comportamiento anterior)
        await loadPeriodosLectivos()
      }
    })
  }, [executeOnce, searchParams, loadPlanPagoInfo, loadPeriodosLectivos])

  // Handlers para cambios de filtros
  const handlePeriodoLectivoChange = (periodoId: string) => {
    setSelectedPeriodoLectivo(periodoId)
  }

  const handlePlanPagoChange = (planId: string) => {
    setSelectedPlanPago(planId)
  }

  // Filtrar rubros por término de búsqueda
  const filteredRubros = (rubros || []).filter(
    rubro =>
      rubro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rubro.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers de modales
  const handleOpenCreateModal = () => {
    setModalState({
      open: true,
      mode: 'create',
      rubro: undefined
    })
  }

  const handleOpenEditModal = (rubro: ConfigRubro) => {
    setModalState({
      open: true,
      mode: 'edit',
      rubro
    })
  }

  const handleCloseModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      rubro: undefined
    })
  }

  const handleModalSuccess = () => {
    // Recargar información completa del plan de pago según el contexto
    const planPagoId = searchParams.get('planPagoId')
    if (planPagoId) {
      // Recargar información completa del plan de pago
      loadPlanPagoInfo(parseInt(planPagoId))
    } else if (selectedPlanPago) {
      loadRubros(parseInt(selectedPlanPago))
    }
  }

  const handleDeleteSuccess = () => {
    // Recargar información completa del plan de pago según el contexto
    const planPagoId = searchParams.get('planPagoId')
    if (planPagoId) {
      // Recargar información completa del plan de pago
      loadPlanPagoInfo(parseInt(planPagoId))
    } else if (selectedPlanPago) {
      loadRubros(parseInt(selectedPlanPago))
    }
  }

  // Handlers de eliminación
  const handleOpenDeleteConfirm = (rubro: ConfigRubro) => {
    setDeleteConfirmState({
      open: true,
      rubro
    })
  }

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmState({
      open: false,
      rubro: undefined
    })
  }

  // Handler para ver cambios
  const handleViewChanges = (rubro: ConfigRubro) => {
    setAuditoriaDialog({
      open: true,
      rubro
    })
  }

  const handleCloseAuditoria = () => {
    setAuditoriaDialog({
      open: false,
      rubro: undefined
    })
  }

  // Handler para volver
  const handleGoBack = () => {
    router.back()
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant='h4' component='h1' sx={{ flexGrow: 1 }}>
          Gestión de Rubros
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
          disabled={loading || (!selectedPlanPago && !planPagoInfo)}
        >
          Nuevo Rubro
        </Button>
      </Box>

      {/* Información del Plan de Pago */}
      {planPagoInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Información del Plan de Pago
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Nombre del Plan
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {planPagoInfo.nombre}
                </Typography>
              </Box>

              {planPagoInfo.estado !== undefined && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Estado
                  </Typography>
                  <Typography variant='body1'>{planPagoInfo.estado ? 'Activo' : 'Inactivo'}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Estado
                </Typography>
                <Chip
                  label={planPagoInfo.estado ? 'Activo' : 'Inactivo'}
                  color={planPagoInfo.estado ? 'success' : 'default'}
                  size='small'
                />
              </Box>

              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Fecha de Creación
                </Typography>
                <Typography variant='body1'>{new Date(planPagoInfo.created_at).toLocaleDateString('es-CR')}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Errores generales */}
      {errors.general && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {errors.general[0]}
        </Alert>
      )}

      {/* Tabla de rubros */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : !selectedPlanPago && !planPagoInfo ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography variant='body2' color='text.secondary'>
                Seleccione un período lectivo y un plan de pago para ver los rubros
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Importe</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell align='center'>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRubros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {searchTerm
                            ? 'No se encontraron rubros que coincidan con la búsqueda'
                            : 'No hay rubros registrados para este plan de pago'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRubros.map(rubro => (
                      <TableRow key={rubro.id} hover>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {rubro.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' fontWeight='medium'>
                            {rubro.nombre}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant='body2'>
                            {rubro.moneda ? '$' : 'C$'} {Number(rubro.importe || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {new Date(rubro.created_at).toLocaleDateString('es-CR')}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title='Ver cambios'>
                              <IconButton size='small' onClick={() => handleViewChanges(rubro)}>
                                <VisibilityIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Editar'>
                              <IconButton size='small' onClick={() => handleOpenEditModal(rubro)}>
                                <EditIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Eliminar'>
                              <IconButton size='small' color='error' onClick={() => handleOpenDeleteConfirm(rubro)}>
                                <DeleteIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de crear/editar rubro */}
      <RubroModal
        open={modalState.open}
        mode={modalState.mode}
        rubro={modalState.rubro}
        planPagoId={selectedPlanPago ? parseInt(selectedPlanPago) : undefined}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      <RubroDeleteConfirmDialog
        open={deleteConfirmState.open}
        rubro={deleteConfirmState.rubro}
        onClose={handleCloseDeleteConfirm}
        onSuccess={handleDeleteSuccess}
      />

      {/* Modal de auditoría */}
      <Dialog open={auditoriaDialog.open} onClose={handleCloseAuditoria} maxWidth='lg' fullWidth>
        <DialogTitle>
          Historial de Cambios - {auditoriaDialog.rubro?.nombre}
        </DialogTitle>
        <DialogContent>
          {auditoriaDialog.rubro?.cambios && <AuditoriaViewer cambios={auditoriaDialog.rubro.cambios} />}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default RubrosPage
