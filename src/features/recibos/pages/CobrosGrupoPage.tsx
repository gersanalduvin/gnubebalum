'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Chip,
  Alert
} from '@mui/material'
import {
  Groups as GroupsIcon,
  Paid as PaidIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Money as MoneyIcon
} from '@mui/icons-material'
import { listasGrupoService } from '../../listas-grupo/services/listasGrupoService'
import type { CatalogosListasGrupo, AlumnoGrupoItem } from '../../listas-grupo/types'
import { usePermissions } from '@/hooks/usePermissions'
import UserArancelesService from '../../alumnos/services/userArancelesService'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material'

const CobrosGrupoPage: React.FC = () => {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canView = hasPermission('cobros_grupo.index')

  const [catalogos, setCatalogos] = useState<CatalogosListasGrupo | null>(null)
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedGrupo, setSelectedGrupo] = useState<number | ''>('')
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)
  const [alumnos, setAlumnos] = useState<AlumnoGrupoItem[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<AlumnoGrupoItem | null>(null)
  const [allAranceles, setAllAranceles] = useState<any[]>([])
  const [loadingPendientes, setLoadingPendientes] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [processingPayment, setProcessingPayment] = useState(false)

  // Plan Assignment State
  const [availablePlans, setAvailablePlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('')
  const [applyingPlan, setApplyingPlan] = useState(false)

  const loadAlumnos = async () => {
    if (!selectedPeriodo || !selectedGrupo) {
      setAlumnos([])
      return
    }
    setLoadingAlumnos(true)
    try {
      const data = await listasGrupoService.getAlumnos({
        periodo_lectivo_id: Number(selectedPeriodo),
        grupo_id: Number(selectedGrupo)
      })
      setAlumnos(data)
    } catch (error) {
      console.error('Error al cargar alumnos', error)
    } finally {
      setLoadingAlumnos(false)
    }
  }

  useEffect(() => {
    const loadCatalogos = async () => {
      setLoadingCatalogos(true)
      try {
        const data = await listasGrupoService.getCatalogos()
        setCatalogos(data)
        if (data.periodos_lectivos.length > 0) {
          setSelectedPeriodo(data.periodos_lectivos[0].id)
        }
      } catch (error) {
        console.error('Error al cargar catálogos', error)
      } finally {
        setLoadingCatalogos(false)
      }
    }
    loadCatalogos()
  }, [])

  useEffect(() => {
    loadAlumnos()
  }, [selectedPeriodo, selectedGrupo])

  const loadStudentData = async (studentId: number) => {
    setLoadingPendientes(true)
    try {
      const data = await UserArancelesService.getUserArancelesByUserId(studentId)
      setAllAranceles(data)

      // If no aranceles, load available plans
      if (data.length === 0 && selectedPeriodo) {
        const plans = await UserArancelesService.getPlanesPagoPorPeriodo(Number(selectedPeriodo))
        setAvailablePlans(plans)
      } else {
        setAvailablePlans([])
      }
    } catch (error) {
      toast.error('Error al cargar datos del alumno')
    } finally {
      setLoadingPendientes(false)
    }
  }

  const handleOpenModal = async (student: AlumnoGrupoItem) => {
    setSelectedStudent(student)
    setModalOpen(true)
    setSelectedIds([])
    setSelectedPlanId('')
    loadStudentData(student.user_id)
  }

  const handleToggleId = (id: number, status: string) => {
    if (status === 'pagado') return // Cannot toggle paid items
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleConfirmPayment = async () => {
    if (selectedIds.length === 0) return
    setProcessingPayment(true)
    try {
      const resp = await UserArancelesService.aplicarPago({ ids: selectedIds })
      if (resp.success) {
        toast.success(resp.message || 'Pago aplicado correctamente')
        loadStudentData(selectedStudent!.user_id)
        setSelectedIds([])
        loadAlumnos() // Refresh list background
      } else {
        toast.error(resp.message || 'Error al aplicar el pago')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleApplyPlan = async () => {
    if (!selectedStudent || !selectedPlanId) return
    setApplyingPlan(true)
    try {
      const resp = await UserArancelesService.aplicarPlanPago({
        plan_pago_id: Number(selectedPlanId),
        user_id: selectedStudent.user_id
      })
      if (resp.success) {
        toast.success('Plan de pago aplicado exitosamente')
        loadStudentData(selectedStudent.user_id)
        loadAlumnos()
      } else {
        toast.error(resp.message || 'Error al aplicar el plan')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al aplicar el plan')
    } finally {
      setApplyingPlan(false)
    }
  }

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tienes permisos para ver esta página</Alert>
      </Box>
    )
  }

  const totalSelected = allAranceles
    .filter(a => selectedIds.includes(a.id))
    .reduce((sum, a) => sum + Number(a.saldo_actual), 0)

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <GroupsIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="h1">
              Cobro por Grupo
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Período Lectivo</InputLabel>
                <Select
                  value={selectedPeriodo}
                  label="Período Lectivo"
                  onChange={(e) => {
                    setSelectedPeriodo(Number(e.target.value))
                    setSelectedGrupo('')
                  }}
                  disabled={loadingCatalogos}
                >
                  {catalogos?.periodos_lectivos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={selectedGrupo}
                  label="Grupo"
                  onChange={(e) => setSelectedGrupo(Number(e.target.value))}
                  disabled={loadingCatalogos || !selectedPeriodo}
                >
                  <MenuItem value="">Seleccione un grupo</MenuItem>
                  {catalogos?.grupos
                    .filter((g: any) => !selectedPeriodo || g.periodo_lectivo_id === selectedPeriodo)
                    .map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined" sx={{ position: 'relative' }}>
        {loadingAlumnos && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">
                Saldo Pendiente
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alumnos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  {loadingAlumnos ? 'Cargando...' : 'No se encontraron alumnos para los filtros seleccionados'}
                </TableCell>
              </TableRow>
            ) : (
              alumnos.map((a, idx) => (
                <TableRow key={a.user_id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 18, color: 'grey.500' }} />
                      <Typography variant="body2">{a.nombre_completo}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`C$ ${Number(a.total_pendiente).toFixed(2)}`}
                      size="small"
                      color={a.total_pendiente > 0 ? 'error' : 'success'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SearchIcon />}
                      onClick={() => handleOpenModal(a)}
                    >
                      Ver Detalle / Pagar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Account Management Modal */}
      <Dialog open={modalOpen} onClose={() => !(processingPayment || applyingPlan) && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          Estado de Cuenta - {selectedStudent?.nombre_completo}
        </DialogTitle>
        <DialogContent dividers>
          {loadingPendientes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={32} />
            </Box>
          ) : allAranceles.length === 0 ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Este alumno no tiene mensualidades asignadas para el periodo seleccionado.
              </Alert>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Asignar Plan de Pago
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Seleccione un Plan</InputLabel>
                  <Select
                    value={selectedPlanId}
                    label="Seleccione un Plan"
                    onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                    disabled={applyingPlan}
                  >
                    {availablePlans.map(plan => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleApplyPlan}
                  disabled={!selectedPlanId || applyingPlan}
                  startIcon={applyingPlan ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                >
                  Asignar
                </Button>
              </Box>
            </Box>
          ) : (
            <List>
              {allAranceles.map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => handleToggleId(item.id, item.estado)}
                  disabled={item.estado === 'pagado'}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    opacity: item.estado === 'pagado' ? 0.7 : 1,
                    bgcolor: item.estado === 'pagado' ? 'grey.50' : 'background.paper'
                  }}
                >
                  <ListItemIcon>
                    {item.estado === 'pagado' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <Checkbox
                        edge="start"
                        checked={selectedIds.includes(item.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.rubro?.nombre || 'Rubro'}
                        </Typography>
                        <Chip
                          label={item.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                          size="small"
                          color={item.estado === 'pagado' ? 'success' : 'error'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Monto: C$ {Number(item.importe_total).toFixed(2)} | {item.estado === 'pagado' ? 'Saldo cancelado' : `Saldo Pendiente: C$ ${Number(item.saldo_actual).toFixed(2)}`}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: allAranceles.length > 0 ? 'space-between' : 'flex-end' }}>
          {allAranceles.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Total a Pagar</Typography>
              <Typography variant="h6" color="primary.main">C$ {totalSelected.toFixed(2)}</Typography>
            </Box>
          )}
          <Box>
            <Button onClick={() => setModalOpen(false)} sx={{ mr: 1 }} disabled={processingPayment || applyingPlan}>
              Cerrar
            </Button>
            {allAranceles.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmPayment}
                disabled={selectedIds.length === 0 || processingPayment}
                startIcon={processingPayment ? <CircularProgress size={16} color="inherit" /> : <PaidIcon />}
              >
                Confirmar Pago
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CobrosGrupoPage
