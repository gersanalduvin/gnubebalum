'use client'

import { Add, AttachFile, Close, Delete, Edit, Language, Save } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  createDailyEvidence,
  deleteDailyEvidence,
  getDailyEvidences,
  getDailyGrades,
  saveDailyGrades,
  updateDailyEvidence
} from '../services/dailyEvidenceService'
import { getAssignmentMetadata } from '../services/gradesService'
import { EvidenceCell } from './EvidenceCell'

interface DailyEvidencesTabProps {
  assignmentId: number
  selectedCorte: number | ''
  isLocked?: boolean
}

const DailyEvidencesTab = ({ assignmentId, selectedCorte, isLocked }: DailyEvidencesTabProps) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingEvidence, setSavingEvidence] = useState(false)
  const [evidences, setEvidences] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [gradesData, setGradesData] = useState<Record<number, Record<number, any>>>({})
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set())
  const [scaleValues, setScaleValues] = useState<any[]>([])

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [editingEvidence, setEditingEvidence] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    realizada_en: 'Aula' as 'Aula' | 'Casa',
    indicadores: ''
  })
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])

  // Files & Links State
  const [links, setLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<any[]>([])

  const fetchData = async () => {
    if (!assignmentId || !selectedCorte) return
    try {
      setLoading(true)
      // 1. Get Metadata (for scale values and students)
      const meta = await getAssignmentMetadata(assignmentId)
      setScaleValues(meta.escala_valores || [])
      setStudents(meta.estudiantes || [])

      // 2. Get Daily Evidences
      const evs = await getDailyEvidences(assignmentId, Number(selectedCorte))
      setEvidences(evs)

      // 3. Get Grades for each evidence (or optimize to get all at once if backend supports)
      const allGrades: Record<number, Record<number, any>> = {}
      for (const ev of evs) {
        const gds = await getDailyGrades(ev.id)
        gds.forEach((g: any) => {
          if (!allGrades[g.estudiante_id]) allGrades[g.estudiante_id] = {}
          allGrades[g.estudiante_id][ev.id] = {
            escala_detalle_id: g.escala_detalle_id || '',
            indicadores_check: g.indicadores_check || {}
          }
        })
      }
      setGradesData(allGrades)
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar evidencias diarias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [assignmentId, selectedCorte])

  const handleSaveEvidence = async () => {
    if (!formData.nombre || !formData.fecha) {
      toast.error('Nombre y fecha son obligatorios')
      return
    }

    try {
      setSavingEvidence(true)
      const indicatorsArray = formData.indicadores.split('\n').filter(i => i.trim() !== '')

      const data = new FormData()
      data.append('asignatura_grado_docente_id', String(assignmentId))
      data.append('corte_id', String(selectedCorte))
      data.append('nombre', formData.nombre)
      data.append('descripcion', formData.descripcion || '')
      data.append('fecha', formData.fecha)
      data.append('realizada_en', formData.realizada_en)

      data.append('indicadores', JSON.stringify(indicatorsArray))
      data.append('students', JSON.stringify(selectedStudents))
      data.append('links', JSON.stringify(links))

      selectedFiles.forEach(file => {
        data.append('files[]', file)
      })

      // If editing, send existing files metadata (to keep them)
      if (editingEvidence) {
        data.append('archivos', JSON.stringify(existingFiles))
      }

      if (editingEvidence) {
        await updateDailyEvidence(editingEvidence.id, data)
        toast.success('Evidencia actualizada')
      } else {
        await createDailyEvidence(data)
        toast.success('Evidencia creada')
      }
      setOpenModal(false)
      fetchData()
    } catch (error) {
      toast.error('Error al guardar evidencia')
    } finally {
      setSavingEvidence(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta evidencia?')) return
    try {
      await deleteDailyEvidence(id)
      toast.success('Evidencia eliminada')
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleGradeChange = (studentId: number, evidenceId: number | string, newVal: any) => {
    setGradesData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [evidenceId]: newVal
      }
    }))
    setPendingChanges(prev => new Set(prev).add(`${studentId}-${evidenceId}`))
  }

  const handleToggleStudent = (id: number) => {
    setSelectedStudents(prev => {
      const idx = prev.indexOf(id)
      if (idx === -1) return [...prev, id]
      return prev.filter(item => item !== id)
    })
  }

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedStudents(students.map(s => s.users_grupo_id || s.id))
    } else {
      setSelectedStudents([])
    }
  }

  const handleAddLink = () => {
    if (newLink && !links.includes(newLink)) {
      setLinks([...links, newLink])
      setNewLink('')
    }
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...filesArray])
    }
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleBulkSave = async () => {
    if (pendingChanges.size === 0) return
    try {
      setSaving(true)
      // Group pending changes by evidenceId
      const changesByEv: Record<number, any[]> = {}
      pendingChanges.forEach(key => {
        const [sId, eId] = key.split('-').map(Number)
        if (!changesByEv[eId]) changesByEv[eId] = []
        changesByEv[eId].push({
          estudiante_id: sId,
          ...gradesData[sId][eId]
        })
      })

      for (const evId of Object.keys(changesByEv)) {
        await saveDailyGrades(Number(evId), changesByEv[Number(evId)])
      }

      setPendingChanges(new Set())
      toast.success('Calificaciones guardadas')
    } catch (error) {
      toast.error('Error al guardar calificaciones')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <Box textAlign='center' py={5}>
        <CircularProgress />
      </Box>
    )

  return (
    <Box>
      <Box mb={2} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='subtitle1' fontWeight='bold'>
          Registro de Actividades Diarias
        </Typography>
        <Button
          startIcon={<Add />}
          variant='contained'
          size='small'
          onClick={() => {
            setEditingEvidence(null)
            setFormData({
              nombre: '',
              descripcion: '',
              fecha: new Date().toISOString().split('T')[0],
              realizada_en: 'Aula',
              indicadores: ''
            })
            // Select all students by default for new evidence
            setSelectedStudents(students.map(s => s.users_grupo_id || s.id))
            setLinks([])
            setSelectedFiles([])
            setExistingFiles([])
            setOpenModal(true)
          }}
          disabled={isLocked}
        >
          Nueva Actividad
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 'calc(100vh - 350px)' }}>
        <Table stickyHeader size='small'>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 'bold',
                  minWidth: 200,
                  bgcolor: 'white',
                  color: 'text.primary',
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }}
              >
                Estudiante
              </TableCell>
              {evidences.map(ev => (
                <TableCell
                  key={ev.id}
                  align='center'
                  sx={{
                    bgcolor: 'white',
                    color: 'text.primary',
                    borderBottom: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box>
                    <Typography variant='caption' sx={{ display: 'block', fontWeight: 'bold' }}>
                      {ev.nombre}
                    </Typography>
                    <Box mt={0.5}>
                      <IconButton
                        size='small'
                        onClick={() => {
                          setEditingEvidence(ev)
                          setFormData({
                            nombre: ev.nombre,
                            descripcion: ev.descripcion || '',
                            fecha: ev.fecha ? ev.fecha.split('T')[0] : '',
                            realizada_en: ev.realizada_en || 'Aula',
                            indicadores: ev.indicadores?.join('\n') || ''
                          })
                          setSelectedStudents(ev.estudiantes?.map((s: any) => s.id) || [])
                          setLinks(ev.links || [])
                          setExistingFiles(ev.archivos || [])
                          setSelectedFiles([])
                          setOpenModal(true)
                        }}
                        sx={{ color: 'primary.main', p: 0.2 }}
                      >
                        <Edit sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                      <IconButton size='small' onClick={() => handleDelete(ev.id)} sx={{ color: 'error.main', p: 0.2 }}>
                        <Delete sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((item, idx) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Typography variant='body2'>
                    {idx + 1}. {item.nombre_completo}
                  </Typography>
                </TableCell>
                {evidences.map(ev => {
                  const isAssignedArray = Array.isArray(ev.estudiantes) ? ev.estudiantes : []
                  const isAssigned = isAssignedArray.some((e: any) => Number(e.id) === Number(item.users_grupo_id))
                  return (
                    <TableCell key={ev.id} padding='none'>
                      <EvidenceCell
                        studentId={item.student_id || item.id}
                        evidenceId={ev.id}
                        evidenceName={ev.nombre}
                        indicators={{ criterios: ev.indicadores }}
                        isAssigned={!!isAssigned}
                        currentValue={
                          gradesData[item.student_id || item.id]?.[ev.id] || {
                            escala_detalle_id: '',
                            indicadores_check: {}
                          }
                        }
                        scaleValues={scaleValues}
                        isLocked={isLocked || false}
                        onChange={handleGradeChange}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pendingChanges.size > 0 && (
        <Fab
          color='primary'
          variant='extended'
          onClick={handleBulkSave}
          sx={{ position: 'fixed', bottom: 80, right: 30 }}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} /> : <Save sx={{ mr: 1 }} />}
          Guardar Cambios ({pendingChanges.size})
        </Fab>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth='md'>
        <DialogTitle>{editingEvidence ? 'Editar Actividad' : 'Nueva Actividad Diaria'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField
                label='Nombre de la Actividad'
                fullWidth
                size='small'
                margin='dense'
                value={formData.nombre}
                onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
              />
              <TextField
                label='Descripción'
                fullWidth
                size='small'
                margin='dense'
                multiline
                rows={2}
                value={formData.descripcion}
                onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label='Realizada En'
                    margin='dense'
                    size='small'
                    value={formData.realizada_en}
                    onChange={e => setFormData(p => ({ ...p, realizada_en: e.target.value as any }))}
                  >
                    <MenuItem value='Aula'>Aula</MenuItem>
                    <MenuItem value='Casa'>Casa</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label='Fecha de realización'
                    type='date'
                    fullWidth
                    size='small'
                    margin='dense'
                    InputLabelProps={{ shrink: true }}
                    value={formData.fecha}
                    onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Box mt={2} p={1.5} bgcolor='grey.50' borderRadius={1} border='1px solid #e0e0e0'>
                <Typography
                  variant='caption'
                  fontWeight='bold'
                  color='text.secondary'
                  display='block'
                  sx={{ mb: 1, textTransform: 'uppercase' }}
                >
                  Indicadores / Criterios
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  size='small'
                  placeholder='Uno por línea. Ej: Reconoce colores\nSigue instrucciones'
                  value={formData.indicadores}
                  onChange={e => setFormData(p => ({ ...p, indicadores: e.target.value }))}
                  sx={{ bgcolor: 'white' }}
                />
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
                    onKeyPress={e => e.key === 'Enter' && handleAddLink()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Language sx={{ fontSize: 16 }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{ bgcolor: 'white' }}
                  />
                  <Button variant='outlined' onClick={handleAddLink} size='small' sx={{ minWidth: 80 }}>
                    Añadir
                  </Button>
                </Box>
                <Box display='flex' flexWrap='wrap' gap={1}>
                  {links.map((link, index) => (
                    <Chip
                      key={index}
                      label={link}
                      size='small'
                      onDelete={() => handleRemoveLink(index)}
                      color='primary'
                      variant='outlined'
                      sx={{ maxWidth: '100%' }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Files Section */}
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
                <input
                  type='file'
                  multiple
                  id='evidence-files'
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <label htmlFor='evidence-files'>
                  <Button component='span' variant='outlined' size='small' startIcon={<AttachFile />} fullWidth>
                    Seleccionar Archivos
                  </Button>
                </label>

                {/* List of files */}
                <Box mt={1.5}>
                  {/* Existing Files */}
                  {existingFiles.map((file, idx) => (
                    <Box key={idx} display='flex' alignItems='center' justifyContent='space-between' mb={0.5}>
                      <Typography variant='caption' noWrap sx={{ maxWidth: '80%' }}>
                        {file.name} (Existente)
                      </Typography>
                      <IconButton size='small' onClick={() => handleRemoveExistingFile(idx)} color='error'>
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                  {/* Newly Selected Files */}
                  {selectedFiles.map((file, idx) => (
                    <Box key={idx} display='flex' alignItems='center' justifyContent='space-between' mb={0.5}>
                      <Typography variant='caption' noWrap sx={{ maxWidth: '80%', color: 'success.main' }}>
                        {file.name}
                      </Typography>
                      <IconButton size='small' onClick={() => handleRemoveSelectedFile(idx)} color='error'>
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Students Selection */}
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
              <List dense sx={{ height: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                {students.map((item: any) => {
                  const sId = item.users_grupo_id || item.id
                  return (
                    <ListItem key={sId} disablePadding>
                      <ListItemButton onClick={() => handleToggleStudent(sId)} dense sx={{ py: 0 }}>
                        <Checkbox
                          edge='start'
                          checked={selectedStudents.indexOf(sId) !== -1}
                          tabIndex={-1}
                          disableRipple
                          size='small'
                        />
                        <ListItemText primary={item.nombre_completo} primaryTypographyProps={{ variant: 'caption' }} />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} size='small' disabled={savingEvidence}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={handleSaveEvidence} size='small' disabled={savingEvidence}>
            {savingEvidence ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DailyEvidencesTab
