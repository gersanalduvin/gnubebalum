'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  Add as AddIcon,
  CardGiftcard as BecaIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  LocalOffer as DescuentoIcon,
  CleaningServices as ExonerarIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import { usePermissions } from '@/hooks/usePermissions'
import { UserArancelesService } from '../services/userArancelesService'
import type { PeriodoLectivo, PlanPago, UserArancel, UserArancelFormData } from '../types/aranceles'

interface ArancelesTabProps {
  userId: number
}

function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      style={{ display: value !== index ? 'none' : 'block' }}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ArancelesTab({ userId }: ArancelesTabProps) {
  const { hasPermission } = usePermissions()
  const { executeOnce, reset } = useInitialLoad()

  // Verificaciones de permisos
  const canView = hasPermission('users_aranceles.by_user')
  const canCreate = hasPermission('users_aranceles.store')
  const canDelete = hasPermission('users_aranceles.destroy')

  const [aranceles, setAranceles] = useState<UserArancel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedArancel, setSelectedArancel] = useState<UserArancel | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Estados para auditoría
  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null)

  // Estados para el modal de aplicar plan de pago
  const [openAplicarPlanModal, setOpenAplicarPlanModal] = useState(false)
  const [periodosLectivos, setPeriodosLectivos] = useState<PeriodoLectivo[]>([])
  const [planesPago, setPlanesPago] = useState<PlanPago[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedPlan, setSelectedPlan] = useState<number | ''>('')
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [loadingPlanes, setLoadingPlanes] = useState(false)
  const [aplicandoPlan, setAplicandoPlan] = useState(false)

  // Estados para aplicar pagos
  const [selectedAranceles, setSelectedAranceles] = useState<number[]>([])
  const [aplicandoPago, setAplicandoPago] = useState(false)

  // Estados para nuevas acciones masivas
  const [showBecaModal, setShowBecaModal] = useState(false)
  const [showDescuentoModal, setShowDescuentoModal] = useState(false)
  const [showExonerarModal, setShowExonerarModal] = useState(false)
  const [showAnularRecargoModal, setShowAnularRecargoModal] = useState(false)

  const [becaValue, setBecaValue] = useState<number>(0)
  const [descuentoValue, setDescuentoValue] = useState<number>(0)
  const [exonerarObservacion, setExonerarObservacion] = useState('')
  const [anularRecargoObservacion, setAnularRecargoObservacion] = useState('')

  const [procesandoAccion, setProcesandoAccion] = useState(false)

  // Estados para organización por tabs
  const [tabValue, setTabValue] = useState(0)
  const [recibos, setRecibos] = useState<any[]>([])
  const [loadingRecibos, setLoadingRecibos] = useState(false)
  const [reciboFilters, setReciboFilters] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  })
  const [pagadosPage, setPagadosPage] = useState(0)
  const [pagadosRowsPerPage, setPagadosRowsPerPage] = useState(10)
  const [printingTab, setPrintingTab] = useState(false)
  const [printingReciboId, setPrintingReciboId] = useState<number | null>(null)

  // Estado del formulario para agregar arancel
  const [formData, setFormData] = useState<UserArancelFormData>({
    user_id: userId,
    importe: 0,
    importe_total: 0,
    saldo_actual: 0
  })

  // Función para procesar errores del backend
  const processBackendErrors = (errors: any, message?: string) => {
    // Si hay errores específicos de validación
    if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
      // Mostrar el primer error encontrado
      const firstField = Object.keys(errors)[0]
      const firstError = Array.isArray(errors[firstField]) ? errors[firstField][0] : errors[firstField]
      toast.error(firstError || message || 'Error de validación')
      return
    }

    // Mostrar mensaje general
    toast.error(message || 'Error al procesar la solicitud')
  }

  // Cargar aranceles del usuario
  const loadAranceles = useCallback(async () => {
    if (!canView) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await UserArancelesService.getUserArancelesByUserId(userId)
      setAranceles(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los aranceles')
    } finally {
      setLoading(false)
    }
  }, [userId, canView])

  const loadRecibos = useCallback(async () => {
    try {
      setLoadingRecibos(true)
      const data = await UserArancelesService.getUserRecibos(userId, reciboFilters)
      setRecibos(data?.data || [])
    } catch (error: any) {
      toast.error('Error al cargar historial de recibos')
    } finally {
      setLoadingRecibos(false)
    }
  }, [userId, reciboFilters])

  useEffect(() => {
    if (canView) {
      reset()
      executeOnce(loadAranceles)
    }
  }, [canView, reset, executeOnce, loadAranceles])

  useEffect(() => {
    if (tabValue === 2) {
      loadRecibos()
    }
  }, [tabValue, loadRecibos])

  // Manejar cambios en el formulario
  const handleFormChange = (field: keyof UserArancelFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Agregar nuevo arancel
  const handleAddArancel = async () => {
    try {
      setSaving(true)
      const response = await UserArancelesService.createUserArancel(formData)

      if (response.success) {
        toast.success('Arancel agregado exitosamente')
        setShowAddModal(false)
        setFormData({
          user_id: userId,
          importe: 0,
          importe_total: 0,
          saldo_actual: 0
        })
        loadAranceles()
      } else {
        toast.error(response.message || 'Error al agregar el arancel')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar el arancel')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar arancel
  const handleDeleteArancel = async () => {
    if (!selectedArancel) return

    try {
      setDeleting(true)
      await UserArancelesService.deleteUserArancel(selectedArancel.id)
      toast.success('Arancel eliminado exitosamente')
      setShowDeleteModal(false)
      setSelectedArancel(null)
      loadAranceles()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el arancel')
    } finally {
      setDeleting(false)
    }
  }

  // Cargar períodos lectivos
  const loadPeriodosLectivos = async () => {
    try {
      setLoadingPeriodos(true)
      const data = await UserArancelesService.getPeriodosLectivos()
      setPeriodosLectivos(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los períodos lectivos')
    } finally {
      setLoadingPeriodos(false)
    }
  }

  // Cargar planes de pago por período
  const loadPlanesPago = async (periodoId: number) => {
    try {
      setLoadingPlanes(true)
      const data = await UserArancelesService.getPlanesPagoPorPeriodo(periodoId)
      setPlanesPago(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar los planes de pago')
      setPlanesPago([])
    } finally {
      setLoadingPlanes(false)
    }
  }

  // Manejar cambio de período lectivo
  const handlePeriodoChange = (periodoId: number | '') => {
    setSelectedPeriodo(periodoId)
    setSelectedPlan('')
    setPlanesPago([])

    if (periodoId) {
      loadPlanesPago(periodoId as number)
    }
  }

  // Función para manejar la aplicación de pagos
  const handleAplicarPago = async () => {
    if (selectedAranceles.length === 0) {
      toast.error('Debe seleccionar al menos un arancel para aplicar el pago')
      return
    }

    setAplicandoPago(true)

    try {
      const requestData = {
        ids: selectedAranceles
      }

      const response = await UserArancelesService.aplicarPago(requestData)

      if (response.success) {
        toast.success(response.message || 'Pagos aplicados exitosamente')
        setSelectedAranceles([])
        await loadAranceles()
      } else {
        processBackendErrors(response.errors || {}, response.message)
      }
    } catch (error: any) {
      processBackendErrors(error.data?.errors || {}, error.data?.message || 'Error al aplicar los pagos')
    } finally {
      setAplicandoPago(false)
    }
  }

  // Aplicar plan de pago
  const handleAplicarPlanPago = async () => {
    if (!selectedPeriodo || !selectedPlan) {
      toast.error('Debe seleccionar un período lectivo y un plan de pago')
      return
    }

    try {
      setAplicandoPlan(true)
      const response = await UserArancelesService.aplicarPlanPago({
        user_id: userId,
        plan_pago_id: selectedPlan as number
      })

      if (response.success) {
        toast.success(`Plan de pago aplicado exitosamente. Se crearon ${response.data.aranceles_creados} aranceles`)
        setOpenAplicarPlanModal(false)
        setSelectedPeriodo('')
        setSelectedPlan('')
        setPlanesPago([])
        loadAranceles()
      } else {
        toast.error(response.message || 'Error al aplicar el plan de pago')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al aplicar el plan de pago')
    } finally {
      setAplicandoPlan(false)
    }
  }

  // Manejadores para nuevas acciones masivas
  const handleAplicarBeca = async () => {
    try {
      setProcesandoAccion(true)
      const response = await UserArancelesService.aplicarBeca({
        ids: selectedAranceles,
        beca: becaValue
      })
      if (response.success) {
        toast.success('Beca aplicada exitosamente')
        setShowBecaModal(false)
        setBecaValue(0)
        setSelectedAranceles([])
        loadAranceles()
      }
    } catch (error: any) {
      processBackendErrors(error.data?.errors || {}, error.message)
    } finally {
      setProcesandoAccion(false)
    }
  }

  const handleAplicarDescuento = async () => {
    try {
      setProcesandoAccion(true)
      const response = await UserArancelesService.aplicarDescuento({
        ids: selectedAranceles,
        descuento: descuentoValue
      })
      if (response.success) {
        toast.success('Descuento aplicado exitosamente')
        setShowDescuentoModal(false)
        setDescuentoValue(0)
        setSelectedAranceles([])
        loadAranceles()
      }
    } catch (error: any) {
      processBackendErrors(error.data?.errors || {}, error.message)
    } finally {
      setProcesandoAccion(false)
    }
  }

  const handleExonerarMonto = async () => {
    try {
      setProcesandoAccion(true)
      const response = await UserArancelesService.exonerarAranceles({
        ids: selectedAranceles,
        observacion_exonerado: exonerarObservacion
      })
      if (response.registros_actualizados > 0) {
        toast.success('Aranceles exonerados exitosamente')
        setShowExonerarModal(false)
        setExonerarObservacion('')
        setSelectedAranceles([])
        loadAranceles()
      }
    } catch (error: any) {
      processBackendErrors(error.data?.errors || {}, error.message)
    } finally {
      setProcesandoAccion(false)
    }
  }

  const handleAnularRecargo = async () => {
    try {
      setProcesandoAccion(true)
      const response = await UserArancelesService.anularRecargo({
        ids: selectedAranceles,
        observacion_recargo: anularRecargoObservacion
      })
      if (response.registros_actualizados > 0) {
        toast.success('Recargos anulados exitosamente')
        setShowAnularRecargoModal(false)
        setAnularRecargoObservacion('')
        setSelectedAranceles([])
        loadAranceles()
      }
    } catch (error: any) {
      processBackendErrors(error.data?.errors || {}, error.message)
    } finally {
      setProcesandoAccion(false)
    }
  }

  const handleRevertirArancel = async (arancelId: number) => {
    if (
      !window.confirm(
        '¿Está seguro de que desea revertir el pago de este arancel? Esto volverá a activar el rubro para que pueda ser cobrado nuevamente.'
      )
    ) {
      return
    }

    try {
      setLoading(true)
      const response = await UserArancelesService.revertirArancel(arancelId)
      if (response.success) {
        toast.success('Pago revertido exitosamente')
        loadAranceles()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al revertir el pago')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de aplicar plan de pago
  const handleOpenAplicarPlanModal = () => {
    setOpenAplicarPlanModal(true)
    loadPeriodosLectivos()
  }

  // Formatear moneda
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO'
    }).format(num)
  }

  // Obtener color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'warning'
      case 'pagado':
        return 'success'
      case 'exonerado':
        return 'info'
      default:
        return 'default'
    }
  }

  const handlePrintTab = async (tabIndex: number) => {
    try {
      setPrintingTab(true)
      let blob: Blob
      if (tabIndex === 0) {
        toast.success('Generando reporte de pendientes...')
        blob = await UserArancelesService.exportPdf(userId, { estado: 'pendiente' })
      } else if (tabIndex === 1) {
        toast.success('Generando reporte de pagados...')
        blob = await UserArancelesService.exportPdf(userId, { estado: 'pagado' })
      } else if (tabIndex === 2) {
        toast.success('Generando historial de recibos...')
        blob = await UserArancelesService.exportHistorialPdf(userId, {
          fecha_inicio: reciboFilters.fecha_inicio,
          fecha_fin: reciboFilters.fecha_fin
        })
      } else {
        setPrintingTab(false)
        return
      }

      const url = window.URL.createObjectURL(blob)
      const tab = window.open(url, '_blank')
      if (!tab) {
        toast.error('El navegador bloqueó la apertura de la nueva pestaña. Por favor, permita las ventanas emergentes.')
      }
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (error: any) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF: ' + (error?.data?.message || 'Asegúrese de tener una sesión activa.'))
    } finally {
      setPrintingTab(false)
    }
  }

  const handlePrintRecibo = async (reciboId: number) => {
    try {
      setPrintingReciboId(reciboId)
      toast.success('Generando recibo PDF...')
      const blob = await UserArancelesService.exportReciboPdf(reciboId)
      const url = window.URL.createObjectURL(blob)
      const tab = window.open(url, '_blank')
      if (!tab) {
        toast.error('El navegador bloqueó la apertura de la nueva pestaña.')
      }
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (error: any) {
      console.error('Error al imprimir recibo:', error)
      toast.error('Error al generar el recibo PDF.')
    } finally {
      setPrintingReciboId(null)
    }
  }

  if (!canView) {
    return <Alert severity='warning'>No tienes permisos para ver los aranceles de este usuario.</Alert>
  }

  const pendientes = aranceles.filter(a => a.estado === 'pendiente')
  const pagadosYExonerados = aranceles
    .filter(a => a.estado === 'pagado' || a.estado === 'exonerado')
    .sort((a, b) => b.id - a.id) // Orden descendente por id o fecha si estuviera disponible

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>Aranceles del Alumno</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            startIcon={printingTab ? <CircularProgress size={16} /> : <PrintIcon />}
            onClick={() => handlePrintTab(tabValue)}
            size='small'
            disabled={printingTab}
          >
            {printingTab ? 'Generando...' : 'Imprimir'}
          </Button>
          <IconButton onClick={tabValue === 2 ? loadRecibos : loadAranceles} disabled={loading || loadingRecibos}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newVal) => setTabValue(newVal)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`Pendientes (${pendientes.length})`} />
        <Tab label='Pagados' />
        <Tab label='Historial de recibos' />
      </Tabs>

      <CustomTabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
          {selectedAranceles.length > 0 && (
            <>
              <PermissionGuard permission='users_aranceles.aplicar_beca'>
                <Button
                  variant='outlined'
                  startIcon={<BecaIcon />}
                  onClick={() => setShowBecaModal(true)}
                  size='small'
                  color='secondary'
                >
                  Beca
                </Button>
              </PermissionGuard>
              <PermissionGuard permission='users_aranceles.aplicar_descuento'>
                <Button
                  variant='outlined'
                  startIcon={<DescuentoIcon />}
                  onClick={() => setShowDescuentoModal(true)}
                  size='small'
                  color='secondary'
                >
                  Descuento
                </Button>
              </PermissionGuard>
              <PermissionGuard permission='users_aranceles.exonerar'>
                <Button
                  variant='outlined'
                  startIcon={<ExonerarIcon />}
                  onClick={() => setShowExonerarModal(true)}
                  size='small'
                  color='info'
                >
                  Exonerar
                </Button>
              </PermissionGuard>
              <PermissionGuard permission='users_aranceles.anular_recargo'>
                <Button
                  variant='outlined'
                  startIcon={<BlockIcon />}
                  onClick={() => setShowAnularRecargoModal(true)}
                  size='small'
                  color='warning'
                >
                  Anular Recargo
                </Button>
              </PermissionGuard>
              <PermissionGuard permission='users_aranceles.aplicar_pago'>
                <Button
                  variant='contained'
                  startIcon={aplicandoPago ? <CircularProgress size={16} /> : <PaymentIcon />}
                  onClick={handleAplicarPago}
                  size='small'
                  disabled={aplicandoPago}
                  color='success'
                >
                  Cobrar ({selectedAranceles.length})
                </Button>
              </PermissionGuard>
            </>
          )}

          <PermissionGuard permission='users_aranceles.aplicar_plan_pago'>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleOpenAplicarPlanModal} size='small'>
              Nuevo Plan
            </Button>
          </PermissionGuard>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      indeterminate={selectedAranceles.length > 0 && selectedAranceles.length < pendientes.length}
                      checked={pendientes.length > 0 && selectedAranceles.length === pendientes.length}
                      onChange={e => {
                        const pendientesIds = pendientes.map(a => a.id)
                        setSelectedAranceles(e.target.checked ? pendientesIds : [])
                      }}
                    />
                  </TableCell>
                  <TableCell>Rubro</TableCell>
                  <TableCell align='right'>Importe</TableCell>
                  <TableCell align='right'>Beca</TableCell>
                  <TableCell align='right'>Descuento</TableCell>
                  <TableCell align='right'>Total</TableCell>
                  <TableCell align='right'>Saldo Actual</TableCell>
                  <TableCell align='center'>Estado</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align='center'>
                      No se encontraron aranceles pendientes para este alumno
                    </TableCell>
                  </TableRow>
                ) : (
                  pendientes.map(arancel => (
                    <TableRow key={arancel.id}>
                      <TableCell padding='checkbox'>
                        <Checkbox
                          checked={selectedAranceles.includes(arancel.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedAranceles(prev => [...prev, arancel.id])
                            } else {
                              setSelectedAranceles(prev => prev.filter(id => id !== arancel.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' fontWeight='bold'>
                            {arancel.rubro?.nombre || 'S/N'}
                          </Typography>
                          {arancel.config_plan_pago_detalle?.nombre && (
                            <Typography variant='caption' color='textSecondary'>
                              {arancel.config_plan_pago_detalle.nombre}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align='right'>{formatCurrency(arancel.importe)}</TableCell>
                      <TableCell align='right'>{formatCurrency(arancel.beca)}</TableCell>
                      <TableCell align='right'>{formatCurrency(arancel.descuento)}</TableCell>
                      <TableCell align='right'>{formatCurrency(arancel.importe_total)}</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(arancel.saldo_actual)}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={arancel.estado.toUpperCase()}
                          size='small'
                          color={getEstadoColor(arancel.estado)}
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <PermissionGuard permission='auditoria.ver'>
                            <Tooltip title='Ver Cambios'>
                              <IconButton
                                size='small'
                                color='info'
                                onClick={() => {
                                  setCurrentAuditId(arancel.id)
                                  setAuditModalOpen(true)
                                }}
                              >
                                <HistoryIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                          {canDelete && (
                            <Tooltip title='Eliminar'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => {
                                  setSelectedArancel(arancel)
                                  setShowDeleteModal(true)
                                }}
                              >
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
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Rubro</TableCell>
                  <TableCell align='right'>Importe</TableCell>
                  <TableCell align='right'>Pagado</TableCell>
                  <TableCell align='right'>Saldo</TableCell>
                  <TableCell align='center'>Estado</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagadosYExonerados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No hay registros pagados
                    </TableCell>
                  </TableRow>
                ) : (
                  pagadosYExonerados
                    .slice(pagadosPage * pagadosRowsPerPage, pagadosPage * pagadosRowsPerPage + pagadosRowsPerPage)
                    .map(arancel => (
                      <TableRow key={arancel.id}>
                        <TableCell>
                          <Typography variant='body2'>{arancel.rubro?.nombre || 'S/N'}</Typography>
                          <Typography variant='caption' color='textSecondary'>
                            {arancel.config_plan_pago_detalle?.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align='right'>{formatCurrency(arancel.importe_total)}</TableCell>
                        <TableCell align='right'>{formatCurrency(arancel.saldo_pagado)}</TableCell>
                        <TableCell align='right'>{formatCurrency(arancel.importe_total)}</TableCell>
                        <TableCell align='right'>{formatCurrency(arancel.saldo_pagado)}</TableCell>
                        <TableCell align='right'>{formatCurrency(arancel.saldo_actual)}</TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={arancel.estado.toUpperCase()}
                            size='small'
                            color={getEstadoColor(arancel.estado)}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <IconButton
                              size='small'
                              color='info'
                              onClick={() => {
                                setCurrentAuditId(arancel.id)
                                setAuditModalOpen(true)
                              }}
                              title='Historial'
                            >
                              <HistoryIcon fontSize='small' />
                            </IconButton>
                            {arancel.estado === 'pagado' && (
                              <PermissionGuard permission='users_aranceles.revertir'>
                                <IconButton
                                  size='small'
                                  color='warning'
                                  onClick={() => handleRevertirArancel(arancel.id)}
                                  title='Revertir Pago'
                                >
                                  <RefreshIcon fontSize='small' />
                                </IconButton>
                              </PermissionGuard>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component='div'
              count={pagadosYExonerados.length}
              rowsPerPage={pagadosRowsPerPage}
              page={pagadosPage}
              onPageChange={(_, newPage) => setPagadosPage(newPage)}
              onRowsPerPageChange={e => {
                setPagadosRowsPerPage(parseInt(e.target.value, 10))
                setPagadosPage(0)
              }}
            />
          </TableContainer>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label='Desde'
            type='date'
            size='small'
            InputLabelProps={{ shrink: true }}
            value={reciboFilters.fecha_inicio}
            onChange={e => setReciboFilters(prev => ({ ...prev, fecha_inicio: e.target.value }))}
          />
          <TextField
            label='Hasta'
            type='date'
            size='small'
            InputLabelProps={{ shrink: true }}
            value={reciboFilters.fecha_fin}
            onChange={e => setReciboFilters(prev => ({ ...prev, fecha_fin: e.target.value }))}
          />
          <Button variant='contained' onClick={loadRecibos} disabled={loadingRecibos}>
            Filtrar
          </Button>
        </Box>

        {loadingRecibos ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Número</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell align='right'>Monto</TableCell>
                  <TableCell align='center'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recibos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      No hay recibos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  recibos.map(recibo => (
                    <TableRow key={recibo.id}>
                      <TableCell>
                        {new Date(recibo.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          timeZone: 'UTC'
                        })}
                      </TableCell>
                      <TableCell>{recibo.numero_recibo}</TableCell>
                      <TableCell>
                        <Chip label={recibo.tipo?.toUpperCase()} size='small' variant='outlined' />
                      </TableCell>
                      <TableCell>
                        {recibo.detalles?.map((d: any) => d.concepto).join(', ') || 'Pago de aranceles'}
                      </TableCell>
                      <TableCell align='right'>{formatCurrency(recibo.total)}</TableCell>
                      <TableCell align='center'>
                        <IconButton
                          size='small'
                          color='secondary'
                          onClick={() => handlePrintRecibo(recibo.id)}
                          disabled={printingReciboId === recibo.id}
                        >
                          {printingReciboId === recibo.id ? (
                            <CircularProgress size={20} color='inherit' />
                          ) : (
                            <PrintIcon fontSize='small' />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CustomTabPanel>

      {/* Modal para agregar arancel */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Agregar Nuevo Arancel</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Importe'
                type='number'
                value={formData.importe}
                onChange={e => handleFormChange('importe', parseFloat(e.target.value) || 0)}
                size='small'
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Beca'
                type='number'
                value={formData.beca || 0}
                onChange={e => handleFormChange('beca', parseFloat(e.target.value) || 0)}
                size='small'
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Descuento'
                type='number'
                value={formData.descuento || 0}
                onChange={e => handleFormChange('descuento', parseFloat(e.target.value) || 0)}
                size='small'
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Importe Total'
                type='number'
                value={formData.importe_total}
                onChange={e => handleFormChange('importe_total', parseFloat(e.target.value) || 0)}
                size='small'
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Saldo Actual'
                type='number'
                value={formData.saldo_actual}
                onChange={e => handleFormChange('saldo_actual', parseFloat(e.target.value) || 0)}
                size='small'
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddArancel}
            variant='contained'
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {saving ? 'Guardando...' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Está seguro de que desea eliminar este arancel?</Typography>
          {selectedArancel && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant='body2'>
                <strong>Rubro:</strong> {selectedArancel.rubro?.nombre || 'Sin rubro'}
              </Typography>
              <Typography variant='body2'>
                <strong>Importe:</strong> {formatCurrency(selectedArancel.importe)}
              </Typography>
              <Typography variant='body2'>
                <strong>Estado:</strong> {selectedArancel.estado}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteArancel}
            color='error'
            variant='contained'
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAplicarPlanModal} onClose={() => setOpenAplicarPlanModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Aplicar Plan de Pago</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Período Lectivo</InputLabel>
                <Select
                  value={selectedPeriodo}
                  onChange={e => handlePeriodoChange(e.target.value as number | '')}
                  label='Período Lectivo'
                  disabled={loadingPeriodos}
                >
                  {loadingPeriodos ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Cargando períodos...
                    </MenuItem>
                  ) : (
                    periodosLectivos.map(periodo => (
                      <MenuItem key={periodo.id} value={periodo.id}>
                        {periodo.nombre}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Plan de Pago</InputLabel>
                <Select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value as number | '')}
                  label='Plan de Pago'
                  disabled={!selectedPeriodo || loadingPlanes}
                >
                  {loadingPlanes ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Cargando planes...
                    </MenuItem>
                  ) : planesPago.length === 0 && selectedPeriodo ? (
                    <MenuItem disabled>No hay planes de pago disponibles</MenuItem>
                  ) : (
                    planesPago.map(plan => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.nombre}
                        {plan.descripcion && ` - ${plan.descripcion}`}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAplicarPlanModal(false)} disabled={aplicandoPlan}>
            Cancelar
          </Button>
          <Button
            onClick={handleAplicarPlanPago}
            variant='contained'
            disabled={aplicandoPlan || !selectedPeriodo || !selectedPlan}
            startIcon={aplicandoPlan ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {aplicandoPlan ? 'Aplicando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Aplicar Beca */}
      <Dialog open={showBecaModal} onClose={() => !procesandoAccion && setShowBecaModal(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Aplicar Beca</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Se aplicará el monto de beca a los {selectedAranceles.length} aranceles seleccionados.
            </Typography>
            <TextField
              fullWidth
              label='Monto de Beca'
              type='number'
              autoFocus
              value={becaValue}
              onChange={e => setBecaValue(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBecaModal(false)} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button
            onClick={handleAplicarBeca}
            variant='contained'
            disabled={procesandoAccion}
            startIcon={procesandoAccion && <CircularProgress size={20} />}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Aplicar Descuento */}
      <Dialog
        open={showDescuentoModal}
        onClose={() => !procesandoAccion && setShowDescuentoModal(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Aplicar Descuento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Se aplicará el monto de descuento a los {selectedAranceles.length} aranceles seleccionados.
            </Typography>
            <TextField
              fullWidth
              label='Monto de Descuento'
              type='number'
              autoFocus
              value={descuentoValue}
              onChange={e => setDescuentoValue(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDescuentoModal(false)} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button
            onClick={handleAplicarDescuento}
            variant='contained'
            disabled={procesandoAccion}
            startIcon={procesandoAccion && <CircularProgress size={20} />}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Exonerar */}
      <Dialog
        open={showExonerarModal}
        onClose={() => !procesandoAccion && setShowExonerarModal(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Exonerar Aranceles</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            <Typography variant='body1' sx={{ mb: 2, color: 'info.main', fontWeight: 'bold' }}>
              ⚠️ Se exonerarán los {selectedAranceles.length} aranceles seleccionados.
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
              El saldo actual pasará a cero y quedará registrado como saldo pagado por exoneración.
            </Typography>
            <TextField
              fullWidth
              label='Observación'
              multiline
              rows={4}
              autoFocus
              required
              value={exonerarObservacion}
              onChange={e => setExonerarObservacion(e.target.value)}
              placeholder='Ingrese el motivo detallado de la exoneración...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExonerarModal(false)} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button
            onClick={handleExonerarMonto}
            variant='contained'
            color='info'
            disabled={procesandoAccion || !exonerarObservacion}
            startIcon={procesandoAccion && <CircularProgress size={20} />}
          >
            Aplicar Exoneración
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Anular Recargo */}
      <Dialog
        open={showAnularRecargoModal}
        onClose={() => !procesandoAccion && setShowAnularRecargoModal(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Anular Recargo</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            <Typography variant='body1' sx={{ mb: 2, color: 'warning.main', fontWeight: 'bold' }}>
              ⚠️ Se anulará el recargo de los {selectedAranceles.length} aranceles seleccionados.
            </Typography>
            <TextField
              fullWidth
              label='Observación'
              multiline
              rows={4}
              autoFocus
              required
              value={anularRecargoObservacion}
              onChange={e => setAnularRecargoObservacion(e.target.value)}
              placeholder='Ingrese el motivo de la anulación del recargo...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnularRecargoModal(false)} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button
            onClick={handleAnularRecargo}
            variant='contained'
            color='warning'
            disabled={procesandoAccion || !anularRecargoObservacion}
            startIcon={procesandoAccion && <CircularProgress size={20} />}
          >
            Anular Recargo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auditoria Viewer */}
      {auditModalOpen && currentAuditId && (
        <AuditoriaModal
          open={auditModalOpen}
          onClose={() => {
            setAuditModalOpen(false)
            setCurrentAuditId(null)
          }}
          model='users_aranceles'
          id={currentAuditId}
        />
      )}
    </Box>
  )
}
