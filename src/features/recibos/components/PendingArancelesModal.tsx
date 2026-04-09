import { ExpandLess, ExpandMore, AttachMoney as MoneyIcon } from '@mui/icons-material'
import { Box, Button, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputAdornment, InputLabel, List, ListItem, ListItemText, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import UserArancelesService from '../../alumnos/services/userArancelesService'
import recibosService from '../services/recibosService'
import type { Alumno, ArancelPendiente, ReciboDetalleRequest } from '../types'

interface Props {
  open: boolean
  alumno: Alumno | null
  onClose: () => void
  onAdd: (detalle: ReciboDetalleRequest) => void
  detalles?: ReciboDetalleRequest[]
}

const PendingArancelesModal: React.FC<Props> = ({ open, alumno, onClose, onAdd, detalles = [] }) => {
  const [montos, setMontos] = useState<Record<number, number>>({})
  const [pendientes, setPendientes] = useState<ArancelPendiente[]>([])
  const [loading, setLoading] = useState(false)
  
  // Plan assignment state
  const [showAssign, setShowAssign] = useState(false)
  const [periodos, setPeriodos] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  const handleAdd = (item: ArancelPendiente) => {
    const monto = montos[item.id] ?? Number(item.saldo_actual)
    const ordSelRaw = (item as any)?.rubro?.orden_mes ?? (item as any)?.orden_mes
    const ordSel = typeof ordSelRaw === 'string' ? parseInt(ordSelRaw as any, 10) : ordSelRaw
    const pendientesNoAgregados = pendientes.filter(p => {
      const ord = typeof (p as any).rubro?.orden_mes !== 'undefined' ? (p as any).rubro?.orden_mes : (p as any).orden_mes
      const ordNum = typeof ord === 'string' ? parseInt(ord as any, 10) : ord
      const yaAgregado = detalles.some(d => (p.rubro_id && d.rubro_id === p.rubro_id) || (p.aranceles_id && d.aranceles_id === p.aranceles_id))
      return typeof ordNum !== 'undefined' && String(p.estado || '').toLowerCase() === 'pendiente' && !yaAgregado
    })
    const minOrd = pendientesNoAgregados.reduce((min: number | undefined, p: any) => {
      const ord = typeof p?.rubro?.orden_mes !== 'undefined' ? p.rubro.orden_mes : p.orden_mes
      const ordNum = typeof ord === 'string' ? parseInt(ord as any, 10) : ord
      return typeof min === 'undefined' ? ordNum : Math.min(min as number, ordNum as number)
    }, undefined)
    if (typeof ordSel !== 'undefined' && typeof minOrd !== 'undefined' && ordSel > (minOrd as number)) {
      toast.error('Debe pagar primero los rubros de meses anteriores')
      return
    }
    const detalle: ReciboDetalleRequest = {
      concepto: item.rubro?.nombre || 'Rubro pendiente',
      cantidad: 1,
      monto: Number(monto) || 0,
      tipo_pago: 'total',
      rubro_id: item.rubro_id,
      aranceles_id: item.aranceles_id
    }
    const ord = (item as any)?.rubro?.orden_mes ?? (item as any)?.orden_mes
    if (typeof ord !== 'undefined') {
      ;(detalle as any).orden_mes = typeof ord === 'string' ? parseInt(ord as any, 10) : ord
    }
    onAdd(detalle)
  }

  const loadPendientes = async () => {
    if (!open) return
    setMontos({})
    setPendientes([])
    if (!alumno) return
    
    // Always refresh from API to check if new plans applied
    setLoading(true)
    try {
        // Try getting by ID first if we have it, otherwise search
        // Ideally we should have an endpoint getPendientesByUserId
        // We can use UserArancelesService for this directly
        const pend = await UserArancelesService.getUserArancelesPendientesByUserId(alumno.id)
        if (Array.isArray(pend) && pend.length > 0) {
             setPendientes(pend.map(p => ({
              id: Number(p.id),
              rubro_id: p.rubro_id != null ? Number(p.rubro_id) : undefined,
              aranceles_id: p.aranceles_id != null ? Number(p.aranceles_id) : undefined,
              producto_id: p.producto_id != null ? Number(p.producto_id) : undefined,
              importe_total: Number(p.importe_total || 0),
              saldo_actual: Number(p.saldo_actual || 0),
              estado: String(p.estado || ''),
              rubro: p.rubro ? { id: Number(p.rubro.id), codigo: (p.rubro as any).codigo, nombre: p.rubro.nombre, orden_mes: typeof (p.rubro as any)?.orden_mes === 'string' ? parseInt((p.rubro as any).orden_mes as any, 10) : (p.rubro as any)?.orden_mes } : undefined,
              orden_mes: (p as any).orden_mes
            })))
        } else {
             // Fallback to existing search logic if getUserArancelesPendientesByUserId returns empty or fails (though it returns [] on no items)
             const q = alumno.codigo_unico || alumno.email || `${alumno.primer_nombre} ${alumno.primer_apellido}`
              if (!q) return
              const response = await recibosService.searchAlumnos(q, 5)
              if ((response as any).success) {
                const list = (response as any).data || []
                const match = list.find((x: Alumno) => x.id === alumno.id)
                const pendRaw = (match as any)?.arancelesPendientes || (match as any)?.aranceles_pendientes || []
                 if (Array.isArray(pendRaw)) {
                  setPendientes(pendRaw.map(p => ({
                    id: Number(p.id),
                    rubro_id: p.rubro_id != null ? Number(p.rubro_id) : undefined,
                    aranceles_id: p.aranceles_id != null ? Number(p.aranceles_id) : undefined,
                    producto_id: p.producto_id != null ? Number(p.producto_id) : undefined,
                    importe_total: Number(p.importe_total || 0),
                    saldo_actual: Number(p.saldo_actual || 0),
                    estado: String(p.estado || ''),
                    rubro: p.rubro ? { id: Number(p.rubro.id), codigo: p.rubro.codigo, nombre: p.rubro.nombre, orden_mes: typeof (p.rubro as any)?.orden_mes === 'string' ? parseInt((p.rubro as any).orden_mes as any, 10) : (p.rubro as any)?.orden_mes } : undefined,
                    orden_mes: (p as any).orden_mes
                  })))
                }
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendientes()
    if (open) {
        setShowAssign(false)
        setSelectedPeriodo('')
        setSelectedPlan('')
        loadPeriodos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alumno?.id])

  const loadPeriodos = async () => {
    try {
        const resp = await recibosService.getPeriodosPlanesPago()
        if((resp as any).success) {
            setPeriodos((resp as any).data || [])
        }
    } catch {}
  }

  const handleApplyPlan = async () => {
    if(!alumno || !selectedPlan) return
    setAssignLoading(true)
    try {
        const resp = await UserArancelesService.aplicarPlanPago({
            plan_pago_id: Number(selectedPlan),
            user_id: alumno.id
        })
        if(resp.success) {
            toast.success(resp.message)
            setShowAssign(false)
            loadPendientes()
        } else {
            toast.error(resp.message)
        }
    } catch(e: any) {
        toast.error(e.message || 'Error al aplicar plan')
    } finally {
        setAssignLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Aranceles pendientes
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {!loading && (
            <Box sx={{ mb: 2 }}>
                <Button 
                    size="small" 
                    endIcon={showAssign ? <ExpandLess /> : <ExpandMore />} 
                    onClick={() => setShowAssign(!showAssign)}
                >
                    Asignar Plan de Pago Manual
                </Button>
                <Collapse in={showAssign}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 1, border: '1px solid', borderColor: 'divider' }}>
                         <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                            Si el alumno no tiene rubros generados, asigne un plan de pago aquí.
                         </Typography>
                         <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Período Lectivo</InputLabel>
                            <Select 
                                label="Período Lectivo"
                                value={selectedPeriodo}
                                onChange={(e) => {
                                    const val = e.target.value
                                    setSelectedPeriodo(val)
                                    const p = periodos.find(x => String(x.periodo?.id) === String(val))
                                    setPlanes(p?.planes_pago_activos || [])
                                    setSelectedPlan('')
                                }}
                            >
                                {periodos.map((p: any) => (
                                    <MenuItem key={p.periodo?.id} value={p.periodo?.id}>{p.periodo?.nombre}</MenuItem>
                                ))}
                            </Select>
                         </FormControl>
                         <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={!selectedPeriodo}>
                            <InputLabel>Plan de Pago</InputLabel>
                            <Select 
                                label="Plan de Pago"
                                value={selectedPlan}
                                onChange={(e) => setSelectedPlan(e.target.value)}
                            >
                                {planes.map((p: any) => (
                                    <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                                ))}
                            </Select>
                         </FormControl>
                         <Button 
                            variant="contained" 
                            fullWidth 
                            disabled={!selectedPlan || assignLoading}
                            onClick={handleApplyPlan}
                         >
                            {assignLoading ? <CircularProgress size={20} /> : 'Generar Rubros'}
                         </Button>
                    </Box>
                </Collapse>
            </Box>
        )}

        {!loading && (!pendientes || pendientes.length === 0) ? (
          <Box sx={{ p: 2 }}>No hay aranceles pendientes</Box>
        ) : (
          <List dense>
            {pendientes.map((item, index) => (
              <ListItem
                key={item.id}
                divider
                sx={{
                  bgcolor: index % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                      {item.rubro?.nombre || 'Rubro pendiente'}
                    </Typography>
                  }
                />
                <Box sx={{ minWidth: 200, ml: 2, display: 'flex', alignItems: 'center' }}>
                  <TextField
                    label="Monto a Pagar"
                    type="number"
                    size="small"
                    fullWidth
                    value={montos[item.id] ?? Number(item.saldo_actual)}
                    onChange={e => setMontos(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) }))}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" sx={{ mr: -1.7 }}>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={() => handleAdd(item)}
                            sx={{
                              borderTopLeftRadius: 0,
                              borderBottomLeftRadius: 0,
                              color: '#ffffff !important',
                              fontWeight: 'bold',
                              height: '100%',
                              px: 3
                            }}
                          >
                            Agregar
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default PendingArancelesModal
