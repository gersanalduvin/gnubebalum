"use client"
import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button, Alert, IconButton, Tooltip } from '@mui/material'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import { toast } from 'react-hot-toast'

import type { AreaAsignatura, AreaModalMode, ValidationErrors } from '../types'
import areasService from '../services/areasService'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { PermissionGuard } from '@/components/PermissionGuard'

interface Props {
  open: boolean
  mode: AreaModalMode
  area?: AreaAsignatura
  onClose: () => void
  onSuccess: () => void
}

const AreaModal: React.FC<Props> = ({ open, mode, area, onClose, onSuccess }) => {
  const isEdit = mode === 'edit'
  const [nombre, setNombre] = useState('')
  const [orden, setOrden] = useState<number | ''>('')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  useEffect(() => {
    if (open) {
      if (isEdit && area) {
        setNombre(area.nombre || '')
        setOrden(area.orden ?? '')
        setErrors({})
        setGeneralError(null)
      } else {
        setNombre('')
        setOrden('')
        setErrors({})
        setGeneralError(null)
      }
    }
  }, [open, isEdit, area])

  const payload = useMemo(() => ({
    nombre: String(nombre).trim(),
    orden: typeof orden === 'number' ? orden : Number(orden || 0)
  }), [nombre, orden])

  const processBackendErrors = (errorData: any) => {
    setErrors({})
    setGeneralError(null)
    if (!errorData) return
    if (errorData.errors && typeof errorData.errors === 'object') {
      const newFieldErrors: ValidationErrors = {}
      Object.keys(errorData.errors).forEach(field => {
        const msgs = errorData.errors[field]
        if (Array.isArray(msgs) && msgs.length > 0) {
          newFieldErrors[field] = msgs
        }
      })
      if (Object.keys(newFieldErrors).length > 0) {
        setErrors(newFieldErrors)
        return
      }
    }
    const message = errorData.message || 'Error al procesar la solicitud'
    setGeneralError(message)
    toast.error(message)
  }

  const handleSave = async () => {
    const fieldErrors: ValidationErrors = {}
    if (!String(nombre).trim()) fieldErrors.nombre = ['El campo nombre es obligatorio']
    if (orden === '' || isNaN(Number(orden))) fieldErrors.orden = ['El campo orden es obligatorio']
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error('Complete todos los campos requeridos')
      return
    }
    setSaving(true)
    try {
      if (isEdit && area?.id) {
        await areasService.update(area.id, payload)
        toast.success('Área actualizada exitosamente')
      } else {
        await areasService.create(payload)
        toast.success('Área creada exitosamente')
      }
      setErrors({})
      setGeneralError(null)
      onClose()
      onSuccess()
    } catch (error: any) {
      processBackendErrors(error?.data || error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Editar Área de Asignatura' : 'Nueva Área de Asignatura'}</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{generalError}</Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Nombre"
              value={nombre}
              onChange={e => { setNombre(e.target.value); if (errors.nombre) setErrors(prev => ({ ...prev, nombre: [] })) }}
              fullWidth
              size="small"
              required
              error={Boolean(errors.nombre && errors.nombre.length > 0)}
              helperText={errors.nombre?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {isEdit && area?.id && (
              <PermissionGuard permission="auditoria.ver">
                <Tooltip title="Auditoría de Área">
                  <IconButton color="info" onClick={() => { setAuditTarget({ model: 'not_materias_areas', id: area.id! }); setAuditOpen(true) }}>
                    <ManageHistoryIcon />
                  </IconButton>
                </Tooltip>
              </PermissionGuard>
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Orden"
              value={orden}
              onChange={e => { const v = e.target.value; const n = Number(v); setOrden(v === '' ? '' : (isNaN(n) ? '' : n)); if (errors.orden) setErrors(prev => ({ ...prev, orden: [] })) }}
              fullWidth
              size="small"
              required
              error={Boolean(errors.orden && errors.orden.length > 0)}
              helperText={errors.orden?.[0] || ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{isEdit ? 'Guardar Cambios' : 'Crear Área'}</Button>
      </DialogActions>

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />
    </Dialog>
  )
}

export default AreaModal
