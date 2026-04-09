'use client'
import { useEffect, useMemo, useState } from 'react'

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
  TextField,
  Tooltip
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import asignaturasService from '../services/asignaturasService'
import type { AreaAsignatura, Asignatura, AsignaturaModalMode, ValidationErrors } from '../types'

interface Props {
  open: boolean
  mode: AsignaturaModalMode
  asignatura?: Asignatura
  onClose: () => void
  onSuccess: () => void
}

const AsignaturaModal: React.FC<Props> = ({ open, mode, asignatura, onClose, onSuccess }) => {
  const isEdit = mode === 'edit'
  const [nombre, setNombre] = useState('')
  const [abreviatura, setAbreviatura] = useState('')
  const [materiaId, setMateriaId] = useState<number | ''>('')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)
  const [areasLoading, setAreasLoading] = useState(false)
  const [areasError, setAreasError] = useState<string | null>(null)
  const [areas, setAreas] = useState<AreaAsignatura[]>([])
  const [selectedArea, setSelectedArea] = useState<AreaAsignatura | null>(null)

  useEffect(() => {
    if (open) {
      if (isEdit && asignatura) {
        setNombre(asignatura.nombre || '')
        setAbreviatura(asignatura.abreviatura || '')
        setMateriaId(asignatura.materia_id || '')
        setSelectedArea(null)
        setErrors({})
        setGeneralError(null)
      } else {
        setNombre('')
        setAbreviatura('')
        setMateriaId('')
        setSelectedArea(null)
        setErrors({})
        setGeneralError(null)
      }
    }
  }, [open, isEdit, asignatura])

  const payload = useMemo(
    () => ({
      nombre: String(nombre).trim(),
      abreviatura: String(abreviatura).trim(),
      materia_id: typeof materiaId === 'number' ? materiaId : Number(materiaId || 0)
    }),
    [nombre, abreviatura, materiaId]
  )

  useEffect(() => {
    const loadAreas = async () => {
      setAreasLoading(true)
      setAreasError(null)
      try {
        const list = await asignaturasService.listAreas()
        setAreas(list)
        if (isEdit && asignatura?.materia_id) {
          const found = list.find(a => a.id === asignatura.materia_id) || null
          setSelectedArea(found)
        }
      } catch (e: any) {
        const msg = e?.data?.message || 'Error al cargar áreas de asignaturas'
        setAreasError(msg)
        toast.error(msg)
      } finally {
        setAreasLoading(false)
      }
    }
    if (open) loadAreas()
  }, [open, isEdit, asignatura])

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
    if (!String(abreviatura).trim()) fieldErrors.abreviatura = ['El campo abreviatura es obligatorio']
    if (materiaId === '' || isNaN(Number(materiaId))) fieldErrors.materia_id = ['El campo área es obligatorio']
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error('Complete todos los campos requeridos')
      return
    }
    setSaving(true)
    try {
      if (isEdit && asignatura?.id) {
        const result = await asignaturasService.update(asignatura.id, payload)
        toast.success('Materia actualizada exitosamente')
      } else {
        const result = await asignaturasService.create(payload)
        toast.success('Materia creada exitosamente')
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

  const handleSelectArea = (area: AreaAsignatura | null) => {
    setSelectedArea(area)
    setMateriaId(area ? area.id : '')
    if (errors.materia_id) setErrors(prev => ({ ...prev, materia_id: [] }))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{isEdit ? 'Editar Asignatura' : 'Nueva Asignatura'}</DialogTitle>
      <DialogContent>
        {generalError && (
          <Alert severity='error' variant='filled' sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={8}>
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
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {isEdit && asignatura?.id && (
              <PermissionGuard permission='auditoria.ver'>
                <Tooltip title='Auditoría de Asignatura'>
                  <IconButton
                    color='info'
                    onClick={() => {
                      setAuditTarget({ model: 'not_materias', id: asignatura.id! })
                      setAuditOpen(true)
                    }}
                  >
                    <ManageHistoryIcon />
                  </IconButton>
                </Tooltip>
              </PermissionGuard>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={12}>
            <Autocomplete
              loading={areasLoading}
              options={areas}
              value={selectedArea}
              onChange={(_, v) => handleSelectArea(v)}
              getOptionLabel={o => String(o?.nombre || '')}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Área de Asignatura'
                  size='small'
                  required
                  error={Boolean(errors.materia_id && errors.materia_id.length > 0)}
                  helperText={errors.materia_id?.[0] || ''}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {areasLoading ? <CircularProgress color='inherit' size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {isEdit ? 'Guardar Cambios' : 'Crear Asignatura'}
        </Button>
      </DialogActions>

      <AuditoriaModal
        open={auditOpen}
        model={auditTarget?.model || ''}
        id={auditTarget?.id || 0}
        onClose={() => setAuditOpen(false)}
      />
    </Dialog>
  )
}

export default AsignaturaModal
