import { Add, AttachFile, Delete, Language, Visibility } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { createTask, Task, updateTask } from '../services/tasksService'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  assignmentId: number
  corteId: number
  taskToEdit?: Task | null
  isInitiative: boolean
  evidences: any[]
  students: any[] // Available students for assignment
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  assignmentId,
  corteId,
  taskToEdit,
  isInitiative,
  evidences,
  students
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha_entrega: '',
    puntaje_maximo: '',
    evidencia_id: '',
    entrega_en_linea: false,
    tipo: 'acumulado' as 'acumulado' | 'examen',
    realizada_en: 'Aula' as 'Aula' | 'Casa'
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]) // users_grupo_id
  const [existingFiles, setExistingFiles] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')
  const [loading, setLoading] = useState(false)

  const formatDateForInput = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      // Returns "YYYY-MM-DDTHH:mm" for datetime-local input
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch (e) {
      return ''
    }
  }

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        nombre: taskToEdit.nombre,
        descripcion: taskToEdit.descripcion || '',
        fecha_entrega: formatDateForInput(taskToEdit.fecha_entrega),
        puntaje_maximo: taskToEdit.puntaje_maximo?.toString() || '',
        evidencia_id: taskToEdit.evidencia_id?.toString() || '',
        entrega_en_linea: taskToEdit.entrega_en_linea,
        tipo: taskToEdit.tipo || 'acumulado',
        realizada_en: taskToEdit.realizada_en || 'Aula'
      })
      setExistingFiles(taskToEdit.archivos || [])
      if (taskToEdit.estudiantes) {
        setSelectedStudents(taskToEdit.estudiantes.map((e: any) => e.pivot?.users_grupo_id || e.id))
      } else {
        setSelectedStudents([])
      }
      setLinks(taskToEdit.links || [])
    } else {
      // Reset and Default Select All
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

      setFormData({
        nombre: '',
        descripcion: '',
        fecha_entrega: nowStr,
        puntaje_maximo: isInitiative ? '' : '10',
        evidencia_id: '',
        entrega_en_linea: false,
        tipo: 'acumulado',
        realizada_en: 'Aula'
      })
      setFiles([])

      // Select all students by default
      const allIds = students.map(s => s.student.users_grupo_id).filter(id => id)
      setSelectedStudents(allIds)
      setLinks([])
      setNewLink('')
    }
    setErrors({})
  }, [taskToEdit, open])

  const handleToggleStudent = (id: number) => {
    const currentIndex = selectedStudents.indexOf(id)
    const newChecked = [...selectedStudents]

    if (currentIndex === -1) {
      newChecked.push(id)
    } else {
      newChecked.splice(currentIndex, 1)
    }
    setSelectedStudents(newChecked)
  }

  const handleSelectAll = (select: boolean) => {
    if (select) {
      const allIds = students.map(s => s.student.users_grupo_id).filter((id: any) => id)
      setSelectedStudents(allIds)
    } else {
      setSelectedStudents([])
    }
  }

  const handleSubmit = async () => {
    setErrors({})
    try {
      setLoading(true)
      const data = new FormData()
      data.append('asignatura_grado_docente_id', assignmentId.toString())
      data.append('corte_id', corteId.toString())
      data.append('nombre', formData.nombre)
      if (formData.descripcion) data.append('descripcion', formData.descripcion)
      data.append('fecha_entrega', formData.fecha_entrega)
      if (formData.puntaje_maximo) data.append('puntaje_maximo', formData.puntaje_maximo)
      if (formData.evidencia_id) data.append('evidencia_id', formData.evidencia_id)
      data.append('entrega_en_linea', formData.entrega_en_linea ? '1' : '0')
      data.append('tipo', formData.tipo)
      data.append('realizada_en', formData.realizada_en)

      // Students
      selectedStudents.forEach((id, index) => {
        data.append(`students[${index}]`, id.toString())
      })

      // Links
      links.forEach((link, index) => {
        data.append(`links[${index}]`, link)
      })

      // Files
      files.forEach(file => {
        data.append('files[]', file)
      })

      if (taskToEdit) {
        // Send existing files metadata
        existingFiles.forEach((f, idx) => {
          data.append(`archivos[${idx}][name]`, f.name)
          data.append(`archivos[${idx}][path]`, f.path)
          data.append(`archivos[${idx}][type]`, f.type)
        })
        await updateTask(taskToEdit.id, data)
      } else {
        await createTask(data)
      }

      toast.success(taskToEdit ? 'Tarea actualizada' : 'Tarea creada')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      if (error.isValidationError) {
        setErrors(error.validationErrors)
        toast.error('Por favor corrija los errores')
      } else {
        toast.error('Error al guardar tarea')
      }
    } finally {
      setLoading(false)
    }
  }

  const openFile = (f: any) => {
    if (!f.url) return
    const extension = f.name?.split('.').pop()?.toLowerCase()
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

    if (officeExtensions.includes(extension)) {
      // Microsoft Office Online Viewer
      window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(f.url)}`, '_blank')
    } else {
      window.open(f.url, '_blank')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>{taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
            <TextField
              fullWidth
              label='Nombre'
              margin='dense'
              size='small'
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              error={!!errors.nombre}
              helperText={errors.nombre?.[0]}
            />
            <TextField
              fullWidth
              label='Descripción'
              margin='dense'
              size='small'
              multiline
              rows={2}
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              error={!!errors.descripcion}
              helperText={errors.descripcion?.[0]}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label='Tipo de Tarea'
                  margin='dense'
                  size='small'
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                >
                  <MenuItem value='acumulado'>Acumulado</MenuItem>
                  <MenuItem value='examen'>Examen</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label='Realizada En'
                  margin='dense'
                  size='small'
                  value={formData.realizada_en}
                  onChange={e => setFormData({ ...formData, realizada_en: e.target.value as any })}
                >
                  <MenuItem value='Aula'>Aula</MenuItem>
                  <MenuItem value='Casa'>Casa</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type='datetime-local'
                  label='Fecha Entrega'
                  margin='dense'
                  size='small'
                  InputLabelProps={{ shrink: true }}
                  value={formData.fecha_entrega}
                  onChange={e => setFormData({ ...formData, fecha_entrega: e.target.value })}
                  error={!!errors.fecha_entrega}
                  helperText={errors.fecha_entrega?.[0]}
                />
              </Grid>
              <Grid item xs={6}>
                {!isInitiative && (
                  <TextField
                    fullWidth
                    type='number'
                    label='Puntaje Máximo'
                    margin='dense'
                    size='small'
                    value={formData.puntaje_maximo}
                    onChange={e => setFormData({ ...formData, puntaje_maximo: e.target.value })}
                    error={!!errors.puntaje_maximo}
                    helperText={errors.puntaje_maximo?.[0]}
                  />
                )}
              </Grid>
            </Grid>

            {isInitiative && (
              <TextField
                select
                fullWidth
                label='Evidencia / Indicador'
                margin='dense'
                size='small'
                value={formData.evidencia_id}
                onChange={e => setFormData({ ...formData, evidencia_id: e.target.value })}
                error={!!errors.evidencia_id}
                helperText={errors.evidencia_id?.[0]}
              >
                {evidences.map((ev: any) => (
                  <MenuItem key={ev.id} value={ev.id}>
                    {ev.evidencia} - {ev.indicador?.nombre || ''}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={formData.entrega_en_linea}
                  onChange={e => setFormData({ ...formData, entrega_en_linea: e.target.checked })}
                />
              }
              label={<Typography variant='body2'>Permitir entrega en línea</Typography>}
            />

            <Box mt={2} p={1.5} bgcolor='grey.50' borderRadius={1} border='1px solid #e0e0e0'>
              <Typography
                variant='caption'
                fontWeight='bold'
                color='text.secondary'
                display='block'
                sx={{ mb: 1, textTransform: 'uppercase' }}
              >
                Archivos Adjuntos
              </Typography>

              {/* Existing Files */}
              {existingFiles.length > 0 && (
                <Box mb={2} display='flex' flexDirection='column' gap={1}>
                  {existingFiles.map((f, idx) => (
                    <Box
                      key={idx}
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      bgcolor='white'
                      p={0.8}
                      borderRadius={1}
                      border='1px solid #eee'
                    >
                      <Box display='flex' alignItems='center' gap={1} sx={{ overflow: 'hidden' }}>
                        <AttachFile sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant='caption' noWrap>
                          {f.name}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size='small' onClick={() => openFile(f)} color='primary'>
                          <Visibility sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => setExistingFiles(existingFiles.filter((_, i) => i !== idx))}
                          color='error'
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Box>
                <Button
                  variant='outlined'
                  component='label'
                  size='small'
                  fullWidth
                  startIcon={<AttachFile />}
                  sx={{ borderStyle: 'dashed', textTransform: 'none', fontSize: 12 }}
                  disabled={existingFiles.length + files.length >= 5}
                >
                  {existingFiles.length + files.length >= 5
                    ? 'Límite de 5 archivos alcanzado'
                    : 'Subir más archivos (Máx 2MB)'}
                  <input
                    type='file'
                    multiple
                    hidden
                    accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*'
                    onChange={e => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files)
                        const totalCount = existingFiles.length + files.length + newFiles.length

                        if (totalCount > 5) {
                          toast.error('Solo se permiten hasta 5 archivos en total')
                          return
                        }

                        const oversized = newFiles.some(f => f.size > 2 * 1024 * 1024)
                        if (oversized) {
                          toast.error('Cada archivo debe pesar máximo 2MB')
                          return
                        }

                        setFiles([...files, ...newFiles])
                      }
                    }}
                  />
                </Button>
              </Box>

              {files.length > 0 && (
                <Box mt={1.5} display='flex' flexWrap='wrap' gap={0.5}>
                  {files.map((file, idx) => (
                    <Chip
                      key={idx}
                      label={file.name}
                      onDelete={() => setFiles(files.filter((_, i) => i !== idx))}
                      size='small'
                      variant='outlined'
                      sx={{ fontSize: 10 }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Links Section */}
            <Box mt={2} p={1.5} bgcolor='grey.50' borderRadius={1} border='1px solid #e0e0e0'>
              <Typography
                variant='caption'
                fontWeight='bold'
                color='text.secondary'
                display='block'
                sx={{ mb: 1, textTransform: 'uppercase' }}
              >
                Enlaces de Interés (Opcional)
              </Typography>

              <Box display='flex' gap={1} mb={links.length > 0 ? 1.5 : 0}>
                <TextField
                  fullWidth
                  placeholder='https://ejemplo.com'
                  size='small'
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newLink.trim()) {
                        if (!newLink.startsWith('http')) {
                          toast.error('El enlace debe comenzar con http:// o https://')
                          return
                        }
                        setLinks([...links, newLink.trim()])
                        setNewLink('')
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Language sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ bgcolor: 'white' }}
                />
                <Button
                  variant='contained'
                  size='small'
                  onClick={() => {
                    if (newLink.trim()) {
                      if (!newLink.startsWith('http')) {
                        toast.error('El enlace debe comenzar con http:// o https://')
                        return
                      }
                      setLinks([...links, newLink.trim()])
                      setNewLink('')
                    }
                  }}
                >
                  <Add />
                </Button>
              </Box>

              {links.length > 0 && (
                <Box display='flex' flexDirection='column' gap={0.8}>
                  {links.map((link, idx) => (
                    <Box
                      key={idx}
                      display='flex'
                      alignItems='center'
                      justifyContent='space-between'
                      bgcolor='white'
                      p={0.8}
                      borderRadius={1}
                      border='1px solid #eee'
                    >
                      <Typography
                        variant='caption'
                        noWrap
                        sx={{ maxWidth: '85%', color: 'primary.main', textDecoration: 'underline' }}
                      >
                        {link}
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                        color='error'
                      >
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={5}>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
              <Typography variant='subtitle2'>Asignar a Estudiantes</Typography>
              <Box>
                <Button
                  size='small'
                  onClick={() => handleSelectAll(true)}
                  sx={{ fontSize: 10, minWidth: 'auto', px: 1 }}
                >
                  Todos
                </Button>
                <Button
                  size='small'
                  onClick={() => handleSelectAll(false)}
                  sx={{ fontSize: 10, minWidth: 'auto', px: 1 }}
                >
                  Ninguno
                </Button>
              </Box>
            </Box>
            <List dense sx={{ height: 260, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {students.map((student: any) => (
                <ListItem key={student.student?.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleToggleStudent(student.student?.users_grupo_id ?? 0)}
                    dense
                    sx={{ py: 0 }}
                  >
                    <Checkbox
                      edge='start'
                      checked={selectedStudents.indexOf(student.student?.users_grupo_id) !== -1}
                      tabIndex={-1}
                      disableRipple
                      size='small'
                    />
                    <ListItemText
                      primary={student.student?.nombre_completo}
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 1 }}>
        <Button onClick={onClose} size='small'>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading} size='small'>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaskFormModal
