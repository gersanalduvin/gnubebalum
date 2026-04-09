'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { es } from 'date-fns/locale'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Controller, useForm } from 'react-hook-form'

// Icon Imports
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import CloseIcon from '@mui/icons-material/Close'

// Types & Services
import { AgendaEvent, createEvent, deleteEvent, updateEvent, getAgendaGruposDisponibles } from '@/services/agendaService'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'react-hot-toast'

// Register Spanish locale
registerLocale('es', es)

interface Props {
  open: boolean
  handleClose: () => void
  event: AgendaEvent | null
  refetchEvents: () => void
  currentUserCanEdit: boolean
  currentUserCanDelete: boolean
}

const defaultValues: Partial<AgendaEvent> = {
  title: '',
  description: '',
  location: '',
  color: 'primary',
  all_day: false,
  event_url: '',
  start_date: new Date().toISOString(),
  end_date: new Date().toISOString(),
  grupos_ids: []
}

const EVENT_COLORS = [
  { name: 'Azul', value: 'primary', hex: '#666CFF' },
  { name: 'Verde', value: 'success', hex: '#72E128' },
  { name: 'Rojo', value: 'error', hex: '#FF4D49' },
  { name: 'Naranja', value: 'warning', hex: '#FDB528' },
  { name: 'Celeste', value: 'info', hex: '#26C6F9' },
  { name: 'Gris', value: 'secondary', hex: '#8592A3' }
]

const EventDialog = ({ open, handleClose, event, refetchEvents, currentUserCanEdit, currentUserCanDelete }: Props) => {
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableGroups, setAvailableGroups] = useState<any[]>([])
  const [isParaTodos, setIsParaTodos] = useState(true)

  // Permissions
  const { user, isSuperAdmin } = usePermissions()
  const isAdmin = isSuperAdmin || user?.tipo_usuario === 'administrativo'

  // Hooks
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues
  })

  // Watch all_day to toggle time inputs
  const allDay = watch('all_day')
  const watchGruposIds = watch('grupos_ids') || []

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const res = await getAgendaGruposDisponibles()
        setAvailableGroups(res.data || res || [])
      } catch (error) {
        console.error('Error fetching groups', error)
      }
    }
    fetchGrupos()
  }, [])

  useEffect(() => {
    if (event) {
      const gruposIds = event.grupos?.map((g: any) => g.id) || []
      
      reset({
        ...defaultValues,
        ...event,
        all_day: Boolean(event.all_day),
        start_date: event.start_date,
        end_date: event.end_date,
        grupos_ids: gruposIds
      })

      if (isAdmin) {
        setIsParaTodos(gruposIds.length === 0)
      } else {
        setIsParaTodos(false) // Docentes must select groups
      }
    } else {
      reset(defaultValues)
      setIsParaTodos(isAdmin)
    }
  }, [event, reset, isAdmin])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)

    // Formatear payload
    const payload = {
        ...data,
        grupos_ids: isParaTodos ? [] : data.grupos_ids
    }

    try {
      if (event?.id) {
        await updateEvent(event.id, payload)
        toast.success('Evento actualizado correctamente')
      } else {
        await createEvent(payload)
        toast.success('Evento creado correctamente')
      }
      refetchEvents()
      handleClose()
    } catch (error: any) {
      console.error(error)
      if (error.response?.status === 422 && error.response.data.errors) {
        let firstErrorMessage = 'Por favor revise los campos con error.'
        Object.keys(error.response.data.errors).forEach((key, index) => {
          const errMsg = error.response.data.errors[key][0]
          if (index === 0) firstErrorMessage = errMsg
          setError(key as any, {
            type: 'manual',
            message: errMsg
          })
        })
        toast.error(firstErrorMessage)
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Error al guardar el evento')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!event?.id) return
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    try {
      await deleteEvent(event.id)
      toast.success('Evento eliminado')
      refetchEvents()
      handleClose()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // Determine view mode
  const isReadOnly = !!event?.id && !currentUserCanEdit

  // --- Read Only View ---
  if (isReadOnly && event) {
    const colorObj = EVENT_COLORS.find(c => c.value === event.color)
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth='sm'
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        {/* Header Ribbon */}
        <Box
          sx={{
            height: 12,
            bgcolor: colorObj?.hex || '#666CFF',
            width: '100%'
          }}
        />

        <DialogContent sx={{ p: 4, pt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant='h5' fontWeight='600' sx={{ color: '#333' }}>
                {event.title}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Date & Time */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <i className='ri-time-line' style={{ fontSize: 20, color: '#666' }}></i>
                <Box>
                  <Typography variant='body1' fontWeight='500'>
                    {event.all_day
                      ? startDate.toDateString() === endDate.toDateString()
                        ? startDate.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : `Del ${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : startDate.toDateString() === endDate.toDateString()
                        ? startDate.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : `Del ${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} al ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {event.all_day
                      ? 'Todo el día'
                      : startDate.toDateString() === endDate.toDateString()
                        ? `${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Evento de varios días'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Location */}
            {event.location && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <i className='ri-map-pin-line' style={{ fontSize: 20, color: '#666' }}></i>
                  <Typography variant='body1'>{event.location}</Typography>
                </Box>
              </Grid>
            )}

            {/* Target Groups info in View Mode */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5 }}>
                <i className='ri-group-line' style={{ fontSize: 20, color: '#666' }}></i>
                <Typography variant='body1'>
                  {event.grupos && event.grupos.length > 0
                    ? `Publicado para: ${event.grupos.map((g: any) => `${g.grado?.nombre || ''} - ${g.seccion?.nombre || ''}`).join(', ')}`
                    : 'Evento Global (Para Todos)'}
                </Typography>
              </Box>
            </Grid>

            {/* URL */}
            {event.event_url && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <i className='ri-link' style={{ fontSize: 20, color: '#666' }}></i>
                  <Typography
                    variant='body1'
                    component='a'
                    href={event.event_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {event.event_url}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Description */}
            {event.description && (
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 2, borderRadius: 2 }}>
                  <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', color: '#444' }}>
                    {event.description}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        {/* Footer Actions (Only if can delete, otherwise pure close) */}
        <DialogActions sx={{ px: 4, pb: 3 }}>
          {currentUserCanDelete ? (
            <Button
              variant='outlined'
              color='error'
              startIcon={<i className='ri-delete-bin-line'></i>}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          ) : null}
          <Button variant='contained' onClick={handleClose}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // --- Edit / Create View ---
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle
        component='div'
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
      >
        <Typography variant='h6'>{event?.id ? 'Editar Evento' : 'Nuevo Evento'}</Typography>
        <IconButton onClick={handleClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={3}>
            {' '}
            {/* Compact spacing */}
            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name='title'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size='small' // Compact input
                    label='Título del evento *'
                    error={Boolean(errors.title)}
                    helperText={errors.title && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    fullWidth
                    multiline
                    minRows={2}
                    size='small' // Compact input
                    label='Descripción'
                  />
                )}
              />
            </Grid>
            
            {/* Target Group logic */}
            {isAdmin && (
              <Grid item xs={12} sx={{ pt: 1, pb: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isParaTodos}
                      onChange={(e) => {
                        setIsParaTodos(e.target.checked)
                        if (e.target.checked) {
                          setValue('grupos_ids', [], { shouldValidate: true })
                        }
                      }}
                      color="primary"
                    />
                  }
                  label={<Typography variant='body1' fontWeight="500">Evento Global (Para todos los grupos)</Typography>}
                />
              </Grid>
            )}

            {(!isAdmin || !isParaTodos) && (
              <Grid item xs={12}>
                <FormControl fullWidth size='small' error={Boolean(errors.grupos_ids)}>
                  <InputLabel>Grupos Destino *</InputLabel>
                  <Controller
                      name='grupos_ids'
                      control={control}
                      rules={{ required: 'Debe seleccionar al menos un grupo' }}
                      render={({ field }) => (
                      <Select
                          {...field}
                          multiple
                          label='Grupos Destino *'
                          onChange={(e) => field.onChange(e.target.value)}
                          renderValue={(selected: any) => {
                              const selectedGroups = availableGroups.filter(g => (selected || []).includes(g.id));
                              return selectedGroups.map(g => g.nombre_completo).join(', ');
                          }}
                      >
                          {availableGroups.map((grupo) => (
                          <MenuItem key={grupo.id} value={grupo.id}>
                              <Checkbox checked={(field.value || []).indexOf(grupo.id) > -1} size="small" />
                              <ListItemText primary={grupo.nombre_completo} primaryTypographyProps={{ variant: 'body2' }} />
                          </MenuItem>
                          ))}
                      </Select>
                      )}
                  />
                  {errors.grupos_ids && (
                      <Typography variant='caption' color='error' sx={{ ml: 2, mt: 0.5 }}>
                        {errors.grupos_ids.message as string || "Debe seleccionar al menos un grupo"}
                      </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
            {/* Color */}
            <Grid item xs={12}>
              <FormControl fullWidth size='small'>
                <InputLabel>Color</InputLabel>
                <Controller
                  name='color'
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label='Color'
                      renderValue={selected => {
                        const color = EVENT_COLORS.find(c => c.value === selected)
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color?.hex || '#8592A3' }}
                            />
                            {color?.name || selected}
                          </Box>
                        )
                      }}
                    >
                      {EVENT_COLORS.map(color => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color.hex }} />
                            {color.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            {/* All Day Checkbox */}
            <Grid item xs={12} sx={{ py: 0 }}>
              <Controller
                name='all_day'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} size='small' />}
                    label={<Typography variant='body2'>Todo el día</Typography>}
                  />
                )}
              />
            </Grid>
            {/* Dates Row */}
            {/* Start Date */}
            <Grid item xs={12} sm={allDay ? 6 : 4}>
              <Controller
                name='start_date'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    selected={value ? new Date(value) : null}
                    onChange={(date: Date | null) => onChange(date?.toISOString())}
                    dateFormat='dd/MM/yyyy'
                    locale='es'
                    customInput={<TextField fullWidth size='small' label='Fecha inicio *' />}
                  />
                )}
              />
            </Grid>
            {/* Start Time (Hidden if all_day) */}
            {!allDay && (
              <Grid item xs={12} sm={4}>
                <Controller
                  name='start_date'
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DatePicker
                      selected={value ? new Date(value) : null}
                      onChange={(date: Date | null) => onChange(date?.toISOString())}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption='Hora'
                      dateFormat='HH:mm'
                      locale='es'
                      customInput={<TextField fullWidth size='small' label='Hora inicio' />}
                    />
                  )}
                />
              </Grid>
            )}
            {/* End Date */}
            <Grid item xs={12} sm={allDay ? 6 : 4}>
              <Controller
                name='end_date'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    selected={value ? new Date(value) : null}
                    onChange={(date: Date | null) => onChange(date?.toISOString())}
                    dateFormat='dd/MM/yyyy'
                    locale='es'
                    customInput={<TextField fullWidth size='small' label='Fecha fin' />}
                  />
                )}
              />
            </Grid>
            {/* Location */}
            <Grid item xs={12} sm={6}>
              <Controller
                name='location'
                control={control}
                render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} fullWidth size='small' label='Ubicación' />
                )}
              />
            </Grid>
            {/* URL */}
            <Grid item xs={12} sm={6}>
              <Controller
                name='event_url'
                control={control}
                render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} fullWidth size='small' label='URL del evento' />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {event?.id && currentUserCanDelete && (
            <Button
              variant='outlined'
              color='error'
              onClick={handleDelete}
              disabled={isSubmitting}
              startIcon={<i className='ri-delete-bin-line'></i>}
            >
              Eliminar
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button variant='outlined' color='secondary' onClick={handleClose}>
            Cancelar
          </Button>
          <Button type='submit' variant='contained' disabled={isSubmitting}>
            {event?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default EventDialog
