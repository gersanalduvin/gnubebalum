'use client'

import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import recibosService from '../services/recibosService'
import type { Alumno } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (alumno: Alumno) => void
}

const CrearAlumnoConPlanModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [periodos, setPeriodos] = useState<Array<{ periodo: { id: number; nombre: string }; planes_pago_activos: Array<{ id: number; nombre: string }> }>>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedPlan, setSelectedPlan] = useState<number | ''>('')

  const [primerNombre, setPrimerNombre] = useState('')
  const [primerApellido, setPrimerApellido] = useState('')
  const [sexo, setSexo] = useState<'M' | 'F' | ''>('')

  const planesDelPeriodo = useMemo(() => {
    const p = periodos.find(x => x.periodo.id === selectedPeriodo)
    return p?.planes_pago_activos || []
  }, [periodos, selectedPeriodo])

  const normalizeAlumno = (a: any): Alumno => ({
    id: Number(a.id),
    primer_nombre: a.primer_nombre || '',
    segundo_nombre: a.segundo_nombre || '',
    primer_apellido: a.primer_apellido || '',
    segundo_apellido: a.segundo_apellido || '',
    email: a.email || '',
    tipo_usuario: a.tipo_usuario || 'alumno'
  })

  const resetForm = () => {
    setPrimerNombre('')
    setPrimerApellido('')
    setSexo('')
    setSelectedPeriodo('')
    setSelectedPlan('')
    setError(null)
  }

  useEffect(() => {
    if (open) {
      resetForm()
      loadCatalog()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadCatalog = async () => {
    try {
      setLoadingCatalog(true)
      const resp = await recibosService.getPeriodosPlanesPago()
      if ((resp as any).success) {
        const raw = (resp as any).data || []
        const list = Array.isArray(raw) ? raw : [raw]
        setPeriodos(list.map((item: any) => ({
          periodo: { id: Number(item.periodo.id), nombre: String(item.periodo.nombre) },
          planes_pago_activos: Array.isArray(item.planes_pago_activos) ? item.planes_pago_activos.map((p: any) => ({ id: Number(p.id), nombre: String(p.nombre) })) : []
        })))
      } else {
        setPeriodos([])
        toast.error((resp as any).message || 'Error al cargar períodos y planes')
      }
    } catch (error: any) {
      setPeriodos([])
      toast.error(error?.data?.message || 'Error al cargar catálogos')
    } finally {
      setLoadingCatalog(false)
    }
  }

  const validate = (): boolean => {
    const required = [primerNombre, primerApellido, sexo, selectedPeriodo, selectedPlan]
    if (required.some(v => !String(v).trim())) {
      setError('Complete los campos obligatorios')
      return false
    }
    setError(null)
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      setSaving(true)
      const payload: any = {
        primer_nombre: primerNombre,
        primer_apellido: primerApellido,
        sexo: sexo as 'M' | 'F',
        plan_pago_id: selectedPlan
      }
      const resp = await recibosService.crearAlumnoConPlan(payload)
      if (resp.success) {
        const alumnoRaw = (resp.data as any)?.alumno || {}
        const alumno = normalizeAlumno(alumnoRaw)
        toast.success(resp.message || 'Alumno creado exitosamente')
        onCreated(alumno)
        onClose()
      } else {
        if (resp.errors && Object.keys(resp.errors).length) {
          const firstKey = Object.keys(resp.errors)[0]
          const firstMsg = resp.errors[firstKey]?.[0]
          toast.error(firstMsg || resp.message)
        } else {
          toast.error(resp.message)
        }
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al crear alumno'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Crear alumno y aplicar plan</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Primer nombre" value={primerNombre} onChange={e => setPrimerNombre(e.target.value)} fullWidth size="small" required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Primer apellido" value={primerApellido} onChange={e => setPrimerApellido(e.target.value)} fullWidth size="small" required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Sexo</InputLabel>
              <Select value={sexo || ''} label="Sexo" onChange={e => setSexo(e.target.value as any)}>
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Femenino</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Período Lectivo</InputLabel>
              <Select value={selectedPeriodo} label="Período Lectivo" onChange={e => { setSelectedPeriodo(e.target.value as number | ''); setSelectedPlan('') }} disabled={loadingCatalog}>
                {periodos.map(p => (
                  <MenuItem key={p.periodo.id} value={p.periodo.id}>{p.periodo.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required disabled={!selectedPeriodo || loadingCatalog}>
              <InputLabel>Plan de Pago</InputLabel>
              <Select value={selectedPlan} label="Plan de Pago" onChange={e => setSelectedPlan(e.target.value as number | '')}>
                {planesDelPeriodo.map(pl => (
                  <MenuItem key={pl.id} value={pl.id}>{pl.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : undefined}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CrearAlumnoConPlanModal

