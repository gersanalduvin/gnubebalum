"use client"
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import configNotEscalaService from '../services/configNotEscalaService'
import type { Escala, EscalaDetalle, EscalaModalMode, ValidationErrors } from '../types'
import EscalaDetalleModal from './EscalaDetalleModal'

interface Props {
  open: boolean
  mode: EscalaModalMode
  escala?: Escala
  onClose: () => void
  onSuccess: () => void
}

const EscalaModal: React.FC<Props> = ({ open, mode, escala, onClose, onSuccess }) => {
  const isEdit = mode === 'edit'
  const [nombre, setNombre] = useState('')
  const [detalles, setDetalles] = useState<EscalaDetalle[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [detalleEditing, setDetalleEditing] = useState<EscalaDetalle | undefined>(undefined)
  const [detalleEditingIndex, setDetalleEditingIndex] = useState<number | null>(null)
  const [detalleErrors, setDetalleErrors] = useState<Record<number, ValidationErrors>>({})

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  useEffect(() => {
    if (open) {
      if (isEdit && escala) {
        setNombre(escala.nombre || '')
        setDetalles(Array.isArray(escala.detalles) ? escala.detalles : [])
        setErrors({})
        setGeneralError(null)
      } else {
        setNombre('')
        setDetalles([])
        setErrors({})
        setGeneralError(null)
      }
    }
  }, [open, isEdit, escala])

  const handleAddDetalle = () => {
    setDetalleEditing(undefined)
    setDetalleModalOpen(true)
    setDetalleEditingIndex(detalles.length)
  }

  const handleEditDetalle = (detalle: EscalaDetalle) => {
    const idx = detalles.findIndex(d => d === detalle || (detalle.id && d.id === detalle.id))
    setDetalleEditing(detalle)
    setDetalleModalOpen(true)
    setDetalleEditingIndex(idx >= 0 ? idx : null)
  }

  const handleSaveDetalle = (detalle: EscalaDetalle) => {
    setDetalleModalOpen(false)
    if (detalleEditing?.id) {
      setDetalles(prev => prev.map(d => (d.id === detalleEditing!.id ? { ...detalle, id: detalleEditing!.id } : d)))
    } else {
      setDetalles(prev => [...prev, detalle])
    }
  }

  const handleDeleteDetalleLocal = (detalle: EscalaDetalle) => {
    setDetalles(prev => prev.filter(d => d !== detalle))
  }

  const handleDeleteDetalleRemote = async (detalle: EscalaDetalle) => {
    if (!detalle.id) return handleDeleteDetalleLocal(detalle)
    try {
      await configNotEscalaService.removeDetalle(detalle.id)
      toast.success('Detalle eliminado exitosamente')
      setDetalles(prev => prev.filter(d => d.id !== detalle.id))
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al eliminar el detalle')
    }
  }

  const payload = useMemo(() => ({
    id: isEdit ? escala?.id : undefined,
    nombre: nombre.trim(),
    detalles
  }), [isEdit, escala, nombre, detalles])

  const processBackendErrors = (errorData: any) => {
    setErrors({})
    setGeneralError(null)
    setDetalleErrors({})
    if (!errorData) return
    if (errorData.errors && typeof errorData.errors === 'object') {
      const newFieldErrors: ValidationErrors = {}
      const newDetalleErrors: Record<number, ValidationErrors> = {}
      Object.keys(errorData.errors).forEach(field => {
        const msgs = errorData.errors[field]
        if (Array.isArray(msgs) && msgs.length > 0) {
          const match = field.match(/^detalles\.(\d+)\.(\w+)/)
          if (match) {
            const idx = Number(match[1])
            const key = match[2]
            if (!newDetalleErrors[idx]) newDetalleErrors[idx] = {}
            newDetalleErrors[idx][key] = msgs
          } else {
            newFieldErrors[field] = msgs
          }
        }
      })
      if (Object.keys(newFieldErrors).length > 0) {
        setErrors(newFieldErrors)
      }
      if (Object.keys(newDetalleErrors).length > 0) {
        setDetalleErrors(newDetalleErrors)
        const firstIdx = Object.keys(newDetalleErrors).map(n => Number(n)).sort((a, b) => a - b)[0]
        if (typeof firstIdx === 'number') {
          setDetalleEditing(detalles[firstIdx])
          setDetalleEditingIndex(firstIdx)
          setDetalleModalOpen(true)
        }
        return
      }
    }
    const message = errorData.message || 'Error al procesar la solicitud'
    setGeneralError(message)
    toast.error(message)
  }

  const handleSave = async () => {
    if (!payload.nombre) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const result = await configNotEscalaService.upsert(payload)
      toast.success(isEdit ? 'Escala actualizada exitosamente' : 'Escala creada exitosamente')
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Editar Escala' : 'Nueva Escala'}</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{generalError}</Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={8}>
            <TextField 
              label="Nombre de Escala"
              value={nombre}
              onChange={e => {
                setNombre(e.target.value)
                if (errors.nombre) setErrors(prev => ({ ...prev, nombre: [] }))
              }}
              fullWidth 
              size="small"
              error={Boolean(errors.nombre && errors.nombre.length > 0)}
              helperText={errors.nombre?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            {isEdit && escala?.id && (
              <PermissionGuard permission="auditoria.ver">
                <Tooltip title="Auditoría de Escala">
                  <IconButton color="info" onClick={() => { setAuditTarget({ model: 'config_not_escala', id: escala.id! }); setAuditOpen(true) }}>
                    <ManageHistoryIcon />
                  </IconButton>
                </Tooltip>
              </PermissionGuard>
            )}
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <strong>Detalles de la Escala</strong>
              <PermissionGuard permission="config_not_escala.update">
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAddDetalle}>Agregar Detalle</Button>
              </PermissionGuard>
            </Stack>
            {Array.isArray(errors.detalles) && errors.detalles.length > 0 && (
              <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
                {errors.detalles[0]}
              </Alert>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Abreviatura</TableCell>
                  <TableCell>Rango</TableCell>
                  <TableCell>Orden</TableCell>
                  <TableCell align="center" width={160}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((detalle, idx) => (
                  <TableRow key={detalle.id ? `db-${detalle.id}` : `new-${idx}`} hover>
                    <TableCell>{detalle.nombre}</TableCell>
                    <TableCell>{detalle.abreviatura}</TableCell>
                    <TableCell>{detalle.rango_inicio} - {detalle.rango_fin}</TableCell>
                    <TableCell>{detalle.orden}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {detalle.id && (
                          <PermissionGuard permission="auditoria.ver">
                            <Tooltip title="Auditoría del Detalle">
                              <IconButton color="info" onClick={() => { setAuditTarget({ model: 'config_not_escala_detalle', id: detalle.id! }); setAuditOpen(true) }}>
                                <ManageHistoryIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                        )}
                        <PermissionGuard permission="config_not_escala.update">
                          <Tooltip title="Editar">
                            <IconButton color="primary" onClick={() => handleEditDetalle(detalle)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard permission="config_not_escala.delete">
                          <Tooltip title="Eliminar">
                            <IconButton color="error" onClick={() => handleDeleteDetalleRemote(detalle)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </PermissionGuard>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{isEdit ? 'Guardar Cambios' : 'Crear Escala'}</Button>
      </DialogActions>

      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={() => setAuditOpen(false)} />

      <EscalaDetalleModal
        open={detalleModalOpen}
        detalle={detalleEditing}
        errors={typeof detalleEditingIndex === 'number' ? detalleErrors[detalleEditingIndex] : undefined}
        onClose={() => setDetalleModalOpen(false)}
        onSave={handleSaveDetalle}
      />
    </Dialog>
  )
}

export default EscalaModal
