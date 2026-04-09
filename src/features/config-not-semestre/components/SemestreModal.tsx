'use client'
import { useEffect, useMemo, useState } from 'react'

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import {
  Alert,
  Button,
  CircularProgress,
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
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import configNotSemestreService from '../services/configNotSemestreService'
import type { Parcial, Semestre, SemestreModalMode, ValidationErrors } from '../types'
import ParcialModal from './ParcialModal'

interface Props {
  open: boolean
  mode: SemestreModalMode
  semestre?: Semestre
  periodoLectivoId: number
  onClose: () => void
  onSuccess: () => void
}

const SemestreModal: React.FC<Props> = ({ open, mode, semestre, periodoLectivoId, onClose, onSuccess }) => {
  const isEdit = mode === 'edit'
  const [nombre, setNombre] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [orden, setOrden] = useState<number>(1)
  const [parciales, setParciales] = useState<Parcial[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)
  const [parcialModalOpen, setParcialModalOpen] = useState(false)
  const [parcialEditing, setParcialEditing] = useState<Parcial | undefined>(undefined)
  const [parcialEditingIndex, setParcialEditingIndex] = useState<number | null>(null)
  const [deletingParcialIdx, setDeletingParcialIdx] = useState<number | null>(null)

  const blurActive = () => {
    if (typeof document !== 'undefined') {
      const el = document.activeElement as HTMLElement | null
      if (el) el.blur()
    }
  }

  const formatDDMMYYYY = (dateString?: string) => {
    if (!dateString) return ''
    const base = dateString.includes('T') ? dateString.split('T')[0] : dateString
    const parts = base.split('-')
    if (parts.length !== 3) return dateString
    const [y, m, d] = parts
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }

  useEffect(() => {
    if (open) {
      if (isEdit && semestre) {
        setNombre(semestre.nombre || '')
        setAbreviatura(semestre.abreviatura || '')
        setOrden(semestre.orden || 1)
        setParciales(Array.isArray(semestre.parciales) ? semestre.parciales : [])
        setErrors({})
        setGeneralError(null)
      } else {
        setNombre('')
        setAbreviatura('')
        setOrden(1)
        setParciales([])
        setErrors({})
        setGeneralError(null)
      }
    }
  }, [open, isEdit, semestre])

  const payload = useMemo(
    () => ({
      id: isEdit ? semestre?.id : undefined,
      nombre: nombre.trim(),
      abreviatura: abreviatura.trim(),
      orden,
      periodo_lectivo_id: Number(periodoLectivoId),
      parciales
    }),
    [isEdit, semestre, nombre, abreviatura, orden, periodoLectivoId, parciales]
  )

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
        toast.error(errorData.message || 'Errores de validación. Corrija los campos marcados')
        return
      }
    }
    const message = errorData.message || 'Error al procesar la solicitud'
    setGeneralError(message)
    toast.error(message)
  }

  const handleAddParcial = () => {
    blurActive()
    setParcialEditing(undefined)
    setParcialEditingIndex(null)
    setParcialModalOpen(true)
  }

  const handleEditParcial = (parcial: Parcial, index: number) => {
    blurActive()
    setParcialEditing(parcial)
    setParcialEditingIndex(index)
    setParcialModalOpen(true)
  }

  const handleSaveParcial = (parcial: Parcial) => {
    setParcialModalOpen(false)
    setParciales(prev => {
      if (typeof parcialEditingIndex === 'number' && parcialEditingIndex >= 0 && parcialEditingIndex < prev.length) {
        return prev.map((p, i) => (i === parcialEditingIndex ? { ...p, ...parcial } : p))
      }
      const orden = parcial?.orden ?? prev.length + 1
      return [...prev, { ...parcial, orden }]
    })
  }

  const handleRemoveParcial = async (index: number) => {
    const target = parciales[index]
    if (target?.id) {
      try {
        setDeletingParcialIdx(index)
        await configNotSemestreService.removeParcial(target.id)
        toast.success('Parcial eliminado exitosamente')
        setParciales(prev => prev.filter((_, i) => i !== index))
      } catch (error: any) {
        toast.error(error?.data?.message || 'Error al eliminar el parcial')
      } finally {
        setDeletingParcialIdx(null)
      }
    } else {
      setParciales(prev => prev.filter((_, i) => i !== index))
    }
  }

  const preValidate = (): boolean => {
    const fieldErrors: ValidationErrors = {}
    if (!payload.nombre) fieldErrors.nombre = ['El nombre es requerido']
    if (!payload.abreviatura) fieldErrors.abreviatura = ['La abreviatura es requerida']
    if (!payload.periodo_lectivo_id) fieldErrors.periodo_lectivo_id = ['Seleccione un período lectivo']
    if (!Array.isArray(payload.parciales) || payload.parciales.length === 0)
      fieldErrors.parciales = ['Debe agregar al menos un parcial']
    setErrors(fieldErrors)
    return Object.keys(fieldErrors).length === 0
  }

  const handleSave = async () => {
    if (!preValidate()) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      await configNotSemestreService.upsert(payload)
      toast.success(isEdit ? 'Semestre actualizado exitosamente' : 'Semestre creado exitosamente')
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      disableAutoFocus={false}
      disableEnforceFocus={false}
      aria-labelledby='semestre-modal-title'
    >
      <DialogTitle id='semestre-modal-title'>{isEdit ? 'Editar Semestre' : 'Nuevo Semestre'}</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity='error' variant='filled' sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Nombre'
              value={nombre}
              onChange={e => {
                setNombre(e.target.value)
                if (errors.nombre) setErrors(prev => ({ ...prev, nombre: [] }))
              }}
              fullWidth
              size='small'
              required
              error={Boolean(errors.nombre && errors.nombre.length > 0)}
              helperText={errors.nombre?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Abreviatura'
              value={abreviatura}
              onChange={e => {
                setAbreviatura(e.target.value)
                if (errors.abreviatura) setErrors(prev => ({ ...prev, abreviatura: [] }))
              }}
              fullWidth
              size='small'
              required
              error={Boolean(errors.abreviatura && errors.abreviatura.length > 0)}
              helperText={errors.abreviatura?.[0] || ''}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label='Orden'
              type='number'
              value={orden}
              onChange={e => setOrden(Number(e.target.value) || 1)}
              fullWidth
              size='small'
            />
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
            {isEdit && semestre?.id && (
              <PermissionGuard permission='auditoria.ver'>
                <Tooltip title='Auditoría de Semestre'>
                  <IconButton
                    color='info'
                    onClick={() => {
                      setAuditTarget({ model: 'config_not_semestre', id: semestre.id! })
                      setAuditOpen(true)
                    }}
                  >
                    <ManageHistoryIcon />
                  </IconButton>
                </Tooltip>
              </PermissionGuard>
            )}
          </Grid>
          {/* Período lectivo se toma del selector de la vista principal */}

          <Grid item xs={12}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
              <strong>Parciales del Semestre</strong>
              <PermissionGuard permission='config_not_semestre.create'>
                <Button size='small' variant='contained' startIcon={<AddIcon />} onClick={handleAddParcial}>
                  Agregar Parcial
                </Button>
              </PermissionGuard>
            </Stack>
            {Array.isArray(errors.parciales) && errors.parciales.length > 0 && (
              <Alert severity='error' variant='filled' sx={{ mb: 2 }}>
                {errors.parciales[0]}
              </Alert>
            )}
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Abreviatura</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell align='center' width={160}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parciales.map((parcial, idx) => (
                  <TableRow key={parcial.id ?? idx} hover>
                    <TableCell>{parcial.nombre}</TableCell>
                    <TableCell>{parcial.abreviatura}</TableCell>
                    <TableCell>{formatDDMMYYYY(parcial.fecha_inicio_corte)}</TableCell>
                    <TableCell>{formatDDMMYYYY(parcial.fecha_fin_corte)}</TableCell>
                    <TableCell align='center'>
                      <Stack direction='row' spacing={0.5} justifyContent='center'>
                        {parcial.id && (
                          <PermissionGuard permission='auditoria.ver'>
                            <Tooltip title='Auditoría del Parcial'>
                              <IconButton
                                color='info'
                                onClick={() => {
                                  setAuditTarget({ model: 'config_not_semestre_parciales', id: parcial.id! })
                                  setAuditOpen(true)
                                }}
                              >
                                <ManageHistoryIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </PermissionGuard>
                        )}
                        <PermissionGuard permission='config_not_semestre.create'>
                          <Tooltip title='Editar'>
                            <IconButton color='primary' onClick={() => handleEditParcial(parcial, idx)}>
                              <EditIcon fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard permission='config_not_semestre.delete'>
                          <Tooltip title='Eliminar'>
                            <IconButton
                              color='error'
                              onClick={() => handleRemoveParcial(idx)}
                              disabled={deletingParcialIdx === idx}
                            >
                              {deletingParcialIdx === idx ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DeleteIcon fontSize='small' />
                              )}
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
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {isEdit ? 'Guardar Cambios' : 'Crear Semestre'}
        </Button>
      </DialogActions>

      <AuditoriaModal
        open={auditOpen}
        model={auditTarget?.model || ''}
        id={auditTarget?.id || 0}
        onClose={() => setAuditOpen(false)}
      />
      <ParcialModal
        open={parcialModalOpen}
        parcial={parcialEditing}
        errors={
          typeof parcialEditingIndex === 'number'
            ? {
                nombre: errors[`parciales.${parcialEditingIndex}.nombre`],
                abreviatura: errors[`parciales.${parcialEditingIndex}.abreviatura`],
                orden: errors[`parciales.${parcialEditingIndex}.orden`],
                fecha_inicio_corte: errors[`parciales.${parcialEditingIndex}.fecha_inicio_corte`],
                fecha_fin_corte: errors[`parciales.${parcialEditingIndex}.fecha_fin_corte`],
                fecha_inicio_publicacion_notas:
                  errors[`parciales.${parcialEditingIndex}.fecha_inicio_publicacion_notas`],
                fecha_fin_publicacion_notas: errors[`parciales.${parcialEditingIndex}.fecha_fin_publicacion_notas`]
              }
            : undefined
        }
        onClose={() => setParcialModalOpen(false)}
        onSave={handleSaveParcial}
      />
    </Dialog>
  )
}

export default SemestreModal
