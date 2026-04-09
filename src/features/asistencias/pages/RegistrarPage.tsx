'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import CorteBadge from '../components/CorteBadge'
import ResumenAsistencia from '../components/ResumenAsistencia'
import SelectorCorte from '../components/SelectorCorte'
import SelectorGrupo from '../components/SelectorGrupo'
import * as adminService from '../services/asistenciasService'
import * as teacherService from '../services/teacherAsistenciasService'
import type { Corte, EstadoAsistencia, ValidationErrors } from '../types'

type Row = {
  user_id: number
  nombre: string
  estado: EstadoAsistencia
  justificacion?: string
  hora_registro?: string
  excepcion_id?: number
}

export default function RegistrarPage({ isTeacherView = false }: { isTeacherView?: boolean }) {
  const mainRef = useRef<HTMLDivElement | null>(null)
  const [periodoId, setPeriodoId] = useState<number | null>(null)
  const [grupoId, setGrupoId] = useState<number | null>(null)
  const [corte, setCorte] = useState<Corte | ''>('')
  const [fecha, setFecha] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [fechasRegistradas, setFechasRegistradas] = useState<string[]>([])
  const [loadingFechas, setLoadingFechas] = useState(false)
  const { hasPermission } = usePermissions()

  // Determinar qué servicio usar según la vista
  // Si es isTeacherView, usar el servicio docente, sino el admin
  const service = isTeacherView ? teacherService : adminService

  const corteLabel = useMemo(() => {
    if (!corte) return ''
    return {
      corte_1: 'Corte 1',
      corte_2: 'Corte 2',
      corte_3: 'Corte 3',
      corte_4: 'Corte 4'
    }[corte]
  }, [corte])

  const fechaLabel = useMemo(() => {
    if (!fecha) return ''
    const parts = fecha.split('-')
    if (parts.length !== 3) return fecha
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }, [fecha])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    if (confirmOpen) {
      const ae = document.activeElement as HTMLElement | null
      ae?.blur()
      el.setAttribute('inert', '')
    } else {
      el.removeAttribute('inert')
    }
  }, [confirmOpen])

  useEffect(() => {
    if (!grupoId || !corte) {
      setFechasRegistradas([])
      return
    }
    setLoadingFechas(true)
    ;(async () => {
      try {
        const fechasRep = await service.getFechasRegistradas(grupoId, corte)
        setFechasRegistradas(fechasRep)
      } catch (error) {
        console.error('Error fetching fechas registradas', error)
      } finally {
        setLoadingFechas(false)
      }
    })()
  }, [grupoId, corte])

  useEffect(() => {
    if (!grupoId || !fecha || !corte) {
      setRows([])
      return
    }
    setLoading(true)
    ;(async () => {
      try {
        const [usuarios, excepciones] = await Promise.all([
          service.getUsuariosGrupo(grupoId),
          service.getExcepciones(grupoId, fecha, corte)
        ])
        const mapEx = new Map<
          number,
          { id: number; estado: EstadoAsistencia; justificacion?: string; hora_registro?: string }
        >()
        excepciones.forEach(e => {
          mapEx.set(e.user_id, {
            id: e.id,
            estado: e.estado as EstadoAsistencia,
            justificacion: e.justificacion,
            hora_registro: e.hora_registro
          })
        })
        const merged: Row[] = usuarios.map(u => {
          const ex = mapEx.get(u.id)
          return {
            user_id: u.id,
            nombre: u.nombre,
            estado: (ex?.estado as EstadoAsistencia) || 'presente',
            justificacion: ex?.justificacion || '',
            hora_registro: ex?.hora_registro || '',
            excepcion_id: ex?.id
          }
        })
        setRows(merged)
      } catch (error: any) {
        if (error?.status === 401) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
          window.location.href = '/auth/login'
          return
        }
        const message = error?.data?.message || 'Error al cargar datos'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [grupoId, fecha, corte])

  const presentes = useMemo(() => rows.filter(r => r.estado === 'presente').length, [rows])
  const excepcionesCount = useMemo(() => rows.length - presentes, [rows, presentes])

  const validateBeforeSave = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!corte) newErrors.corte = ['Seleccione un corte']
    if (!fecha) newErrors.fecha = ['Seleccione una fecha']

    const today = new Date()
    if (fecha) {
      const d = new Date(fecha + 'T00:00:00')
      if (d > today) newErrors.fecha = ['La fecha no puede ser futura']
    }

    // Validaciones por fila: campos obligatorios según estado
    rows.forEach(r => {
      const needsJustificacion =
        r.estado === 'ausencia_justificada' || r.estado === 'tarde_justificada' || r.estado === 'permiso'
      const needsHora = r.estado === 'tarde_justificada' || r.estado === 'tarde_injustificada'

      if (needsJustificacion) {
        if (!(r.justificacion ?? '').toString().trim()) {
          newErrors[`justificacion_${r.user_id}`] = ['La justificación es obligatoria']
        }
      }

      if (needsHora) {
        if (!(r.hora_registro ?? '').toString().trim()) {
          newErrors[`hora_${r.user_id}`] = ['La hora es obligatoria']
        }
      }
    })

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Complete todos los campos requeridos')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateBeforeSave()) return
    setConfirmOpen(true)
  }

  const confirmSave = async () => {
    setConfirmOpen(false)
    if (!grupoId || !fecha || !corte) return

    const buildPayload = (
      r: Row
    ): Partial<{ estado: EstadoAsistencia; justificacion?: string; hora_registro?: string }> => {
      const v = r.estado
      const payload: Partial<{ estado: EstadoAsistencia; justificacion?: string; hora_registro?: string }> = {
        estado: v
      }
      const isJustificada = v === 'ausencia_justificada' || v === 'tarde_justificada' || v === 'permiso'
      const isTarde = v === 'tarde_justificada' || v === 'tarde_injustificada'

      if (isJustificada) {
        const j = (r.justificacion ?? '').toString().trim()
        if (j) payload.justificacion = j
      }

      if (isTarde) {
        const h = (r.hora_registro ?? '').toString().trim()
        if (h) payload.hora_registro = h
      }

      return payload
    }
    const toDelete = rows.filter(r => r.excepcion_id && r.estado === 'presente')
    const toUpdate = rows.filter(r => r.excepcion_id && r.estado !== 'presente')
    const toCreate = rows
      .filter(r => !r.excepcion_id && r.estado !== 'presente')
      .map(r => ({ user_id: r.user_id, ...buildPayload(r) }))
    try {
      setSaving(true)
      for (const r of toDelete) {
        await service.deleteAsistencia(r.excepcion_id as number)
        setRows(prev =>
          prev.map(pr =>
            pr.user_id === r.user_id
              ? {
                  ...pr,
                  estado: 'presente',
                  justificacion: '',
                  hora_registro: '',
                  excepcion_id: undefined
                }
              : pr
          )
        )
      }
      for (const r of toUpdate) {
        const payload = buildPayload(r)
        const updated = await service.updateAsistencia(r.excepcion_id as number, payload)
        setRows(prev =>
          prev.map(pr =>
            pr.user_id === r.user_id
              ? {
                  ...pr,
                  estado: updated.estado as EstadoAsistencia,
                  justificacion: updated.justificacion || '',
                  hora_registro: updated.hora_registro || '',
                  excepcion_id: updated.id
                }
              : pr
          )
        )
      }
      // Siempre llamar a registrarGrupo para asegurar que quede registro de la toma de asistencia
      // aunque no haya excepciones nuevas (updateOrCreate del AsistenciaRegistro)
      const resp = await service.registrarGrupo({
        grupo_id: grupoId as number,
        fecha,
        corte: corte as Corte,
        excepciones: toCreate as any
      })
      if (resp.created && resp.created.length > 0) {
        resp.created.forEach(created => {
          setRows(prev =>
            prev.map(pr =>
              pr.user_id === created.user_id
                ? {
                    ...pr,
                    estado: created.estado as EstadoAsistencia,
                    justificacion: created.justificacion || '',
                    hora_registro: created.hora_registro || '',
                    excepcion_id: created.id
                  }
                : pr
            )
          )
        })
      }
      setLoading(true)
      try {
        const usuarios = await service.getUsuariosGrupo(grupoId as number)
        const excepciones = await service.getExcepciones(grupoId as number, fecha, corte as Corte)
        const mapEx = new Map<
          number,
          { id: number; estado: EstadoAsistencia; justificacion?: string; hora_registro?: string }
        >()
        excepciones.forEach(e => {
          mapEx.set(e.user_id, {
            id: e.id,
            estado: e.estado as EstadoAsistencia,
            justificacion: e.justificacion,
            hora_registro: e.hora_registro
          })
        })
        const merged: Row[] = usuarios.map(u => {
          const ex = mapEx.get(u.id)
          return {
            user_id: u.id,
            nombre: u.nombre,
            estado: (ex?.estado as EstadoAsistencia) || 'presente',
            justificacion: ex?.justificacion || '',
            hora_registro: ex?.hora_registro || '',
            excepcion_id: ex?.id
          }
        })
        setRows(merged)
      } finally {
        setLoading(false)
      }
      toast.success('Cambios guardados')
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const errorData = error?.data || {}
      const backendErrors: ValidationErrors = {}
      if (errorData?.errors) {
        const errObj = errorData.errors as Record<string, string[]>
        Object.keys(errObj).forEach(k => {
          backendErrors[k] = errObj[k]
        })
      }
      setErrors(backendErrors)
      const message = errorData?.message || 'Error al guardar cambios'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box className='p-6' ref={mainRef}>
      <div className='flex items-center justify-between mb-4'>
        <Typography variant='h5' className='font-semibold'>
          Registrar Asistencias
        </Typography>
        {corte && <CorteBadge corte={corte} />}
      </div>
      <Grid container spacing={2} className='mb-4'>
        <Grid item xs={12} md={8}>
          <SelectorGrupo
            periodoId={periodoId}
            grupoId={grupoId}
            onPeriodoChange={setPeriodoId as any}
            onGrupoChange={setGrupoId as any}
            isTeacherView={isTeacherView}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <SelectorCorte value={corte} onChange={setCorte as any} required />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Fecha'
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
            error={Boolean(errors.fecha?.length)}
            helperText={errors.fecha?.[0] || ''}
            InputLabelProps={{ shrink: true }}
            sx={{
              ...(!fecha
                ? {
                    '& input::-webkit-datetime-edit-text, & input::-webkit-datetime-edit-month-field, & input::-webkit-datetime-edit-day-field, & input::-webkit-datetime-edit-year-field':
                      {
                        color: 'transparent'
                      }
                  }
                : {})
            }}
          />
        </Grid>
      </Grid>
      {corte && grupoId && (
        <div className='mb-4'>
          {loadingFechas ? (
            <CircularProgress size={20} />
          ) : fechasRegistradas.length > 0 ? (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant='body2' color='text.secondary' sx={{ mr: 1 }}>
                Registros previos:
              </Typography>
              {fechasRegistradas.map(fDate => {
                const isSelected = fDate === fecha
                const [y, m, d] = fDate.split('-')
                const displayLabel = `${d}/${m}/${y}`
                return (
                  <Chip
                    key={fDate}
                    label={displayLabel}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => setFecha(fDate)}
                    size='small'
                  />
                )
              })}
            </Box>
          ) : (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              No hay asistencias registradas previamente para este corte.
            </Typography>
          )}
        </div>
      )}
      {corte && (
        <div className='mb-4'>
          <ResumenAsistencia
            corteLabel={`Corte ${corteLabel.split(' ')[1]}`}
            presentes={presentes}
            excepciones={excepcionesCount}
          />
        </div>
      )}
      <Paper className='mb-4'>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Alumno</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Justificación</TableCell>
                <TableCell>Hora</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className='flex items-center justify-center p-6'>
                      <CircularProgress size={24} />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                rows.map(r => (
                  <TableRow key={r.user_id}>
                    <TableCell>{r.nombre}</TableCell>
                    <TableCell>
                      <Select
                        size='small'
                        value={r.estado || 'presente'}
                        disabled={savingIds.includes(r.user_id) || saving}
                        onChange={e => {
                          const v = e.target.value as EstadoAsistencia
                          // Siempre limpiar los campos de justificación y hora al cambiar de estado
                          setRows(prev =>
                            prev.map(pr =>
                              pr.user_id === r.user_id ? { ...pr, estado: v, justificacion: '', hora_registro: '' } : pr
                            )
                          )
                          setErrors(prev => ({
                            ...prev,
                            [`justificacion_${r.user_id}`]: [],
                            [`hora_${r.user_id}`]: []
                          }))
                        }}
                      >
                        <MenuItem value='presente'>Presente</MenuItem>
                        <MenuItem value='ausencia_justificada'>Ausencia Justificada</MenuItem>
                        <MenuItem value='ausencia_injustificada'>Ausencia Injustificada</MenuItem>
                        <MenuItem value='tarde_justificada'>Tarde Justificada</MenuItem>
                        <MenuItem value='tarde_injustificada'>Tarde Injustificada</MenuItem>
                        <MenuItem value='permiso'>Permiso</MenuItem>
                        <MenuItem value='suspendido'>Suspendido</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        value={r.justificacion || ''}
                        onChange={e =>
                          setRows(prev =>
                            prev.map(pr => (pr.user_id === r.user_id ? { ...pr, justificacion: e.target.value } : pr))
                          )
                        }
                        disabled={
                          savingIds.includes(r.user_id) ||
                          saving ||
                          !(
                            r.estado === 'ausencia_justificada' ||
                            r.estado === 'tarde_justificada' ||
                            r.estado === 'permiso'
                          )
                        }
                        required={
                          r.estado === 'ausencia_justificada' ||
                          r.estado === 'tarde_justificada' ||
                          r.estado === 'permiso'
                        }
                        error={Boolean(errors[`justificacion_${r.user_id}`]?.length)}
                        helperText={errors[`justificacion_${r.user_id}`]?.[0] || ''}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='time'
                        value={r.hora_registro || ''}
                        onChange={e =>
                          setRows(prev =>
                            prev.map(pr => (pr.user_id === r.user_id ? { ...pr, hora_registro: e.target.value } : pr))
                          )
                        }
                        disabled={
                          savingIds.includes(r.user_id) ||
                          saving ||
                          !(r.estado === 'tarde_justificada' || r.estado === 'tarde_injustificada')
                        }
                        required={r.estado === 'tarde_justificada' || r.estado === 'tarde_injustificada'}
                        error={Boolean(errors[`hora_${r.user_id}`]?.length)}
                        helperText={errors[`hora_${r.user_id}`]?.[0] || ''}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <div className='flex justify-end gap-3'>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSave}
          disabled={!grupoId || !fecha || !corte || saving}
        >
          Guardar
        </Button>
      </div>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar</DialogTitle>
        <DialogContent>
          <Typography>
            Guardar asistencia para {corteLabel} del {fechaLabel}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={confirmSave} variant='contained' autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
