'use client'

import {
  createEvidenciaEspecial,
  deleteEvidenciaEspecial,
  EvidenciaEspecial,
  getEvidenciasEspeciales,
  updateEvidenciaEspecial
} from '@/features/docente-dashboard/services/gradesService'
import {
  Add,
  AutoAwesome,
  Close,
  Delete,
  Edit,
  Save
} from '@mui/icons-material'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  studentId: number | null
  studentName: string | null
  allStudents: Array<{ id: number; name: string }>
  /** ID de not_asignatura_grado_cortes (no el corte_id, sino el registro de la tabla intermedia) */
  asignaturaGradoCorteId: number
  isLocked?: boolean
  /** Callback para recargar la tabla de calificaciones cuando se realicen cambios */
  onChanged: () => void
  globalEvidences?: Array<any>
}

const StudentEvidencesModal = ({
  open,
  onClose,
  studentId,
  studentName,
  allStudents,
  asignaturaGradoCorteId,
  isLocked = false,
  onChanged,
  globalEvidences = []
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [evidencias, setEvidencias] = useState<EvidenciaEspecial[]>([])
  
  const [selectedStudents, setSelectedStudents] = useState<Array<{ id: number; name: string }>>([])

  // Formulario
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formValue, setFormValue] = useState('')
  const [indicadoresValue, setIndicadoresValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Importar Globales
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedGlobals, setSelectedGlobals] = useState<number[]>([])

  // ── Carga ──────────────────────────────────────────────────────────────────
  const fetchEvidencias = async (sId: number) => {
    try {
      setLoading(true)
      const data = await getEvidenciasEspeciales(sId, asignaturaGradoCorteId)
      setEvidencias(data.evidencias || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar evidencias personalizadas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      if (studentId && studentName) {
        setSelectedStudents([{ id: studentId, name: studentName }])
        fetchEvidencias(studentId)
      } else {
        setSelectedStudents([])
        setEvidencias([])
        setShowAddForm(true) // Si se abre masivo, mostrar el form de inmediato
      }
    } else {
      setFormValue('')
      setIndicadoresValue('')
      setEditingId(null)
      setShowAddForm(false)
      setShowImportDialog(false)
      setSelectedGlobals([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId, studentName, asignaturaGradoCorteId])

  // ── Agregar ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!formValue.trim() || selectedStudents.length === 0) return
    setSaving(true)
    try {
      let indicadorPayload: any = null
      if (indicadoresValue.trim()) {
        const arr = indicadoresValue.split('\n').map(s => s.trim()).filter(s => s)
        if (arr.length > 0) indicadorPayload = { criterios: arr }
      }

      await createEvidenciaEspecial({
        estudiantes_ids: selectedStudents.map(s => s.id),
        asignatura_grado_cortes_id: asignaturaGradoCorteId,
        evidencia: formValue.trim(),
        indicador: indicadorPayload
      })
      toast.success(selectedStudents.length > 1 ? 'Evidencias agregadas' : 'Evidencia agregada')
      setFormValue('')
      setIndicadoresValue('')
      
      if (selectedStudents.length === 1) {
        setShowAddForm(false)
        await fetchEvidencias(selectedStudents[0].id)
      } else {
        // Cierra el modal completo si se hace masivo para que el usuario retorne a la tabla
        onClose()
      }
      
      onChanged()
    } catch (err) {
      console.error(err)
      toast.error('Error al agregar evidencia')
    } finally {
      setSaving(false)
    }
  }

  // ── Importar Globales ──────────────────────────────────────────────────────
  const handleImportGlobals = async () => {
    if (selectedGlobals.length === 0 || selectedStudents.length === 0) return
    setSaving(true)
    const toastId = toast.loading('Importando evidencias globales...')
    try {
      const selectedTasks = globalEvidences.filter(g => selectedGlobals.includes(g.id))
      
      const promises = selectedTasks.map(task => {
        let indicadorPayload: any = null
        try {
          indicadorPayload = typeof task.indicador === 'string' ? JSON.parse(task.indicador) : task.indicador
        } catch (e) {}
        
        return createEvidenciaEspecial({
          estudiantes_ids: selectedStudents.map(s => s.id),
          asignatura_grado_cortes_id: asignaturaGradoCorteId,
          evidencia: typeof task.nombre === 'string' ? task.nombre : (task.evidencia || 'Evidencia importada'),
          indicador: indicadorPayload
        })
      })

      await Promise.all(promises)
      
      toast.success(selectedStudents.length > 1 ? `Importadas a ${selectedStudents.length} estudiantes` : 'Evidencias importadas', { id: toastId })
      setShowImportDialog(false)
      setSelectedGlobals([])
      
      if (selectedStudents.length === 1) {
        await fetchEvidencias(selectedStudents[0].id)
      } else {
        onClose()
      }
      onChanged()
    } catch (err) {
      console.error(err)
      toast.error('Error al importar', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const toggleGlobalSelection = (id: number) => {
    setSelectedGlobals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  // ── Editar ─────────────────────────────────────────────────────────────────
  const startEditing = (ev: EvidenciaEspecial) => {
    setEditingId(ev.id)
    setFormValue(ev.evidencia)
    let initInd = ''
    if (ev.indicador?.criterios && Array.isArray(ev.indicador.criterios)) {
      initInd = ev.indicador.criterios.join('\n')
    } else if (ev.indicador?.criterio) {
      if (typeof ev.indicador.criterio === 'string') initInd = ev.indicador.criterio
      else if (typeof ev.indicador.criterio === 'object') initInd = Object.values(ev.indicador.criterio).join('\n')
    }
    setIndicadoresValue(initInd)
    setShowAddForm(false)
  }

  const handleUpdate = async () => {
    if (!editingId || !formValue.trim() || selectedStudents.length !== 1) return
    setSaving(true)
    try {
      let indicadorPayload: any = null
      if (indicadoresValue.trim()) {
        const arr = indicadoresValue.split('\n').map(s => s.trim()).filter(s => s)
        if (arr.length > 0) indicadorPayload = { criterios: arr }
      }

      await updateEvidenciaEspecial(editingId, { evidencia: formValue.trim(), indicador: indicadorPayload })
      toast.success('Evidencia actualizada')
      setEditingId(null)
      setFormValue('')
      setIndicadoresValue('')
      await fetchEvidencias(selectedStudents[0].id)
      onChanged()
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar evidencia')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormValue('')
    setIndicadoresValue('')
    setShowAddForm(false)
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteEvidenciaEspecial(id)
      toast.success('Evidencia eliminada')
      setEvidencias(prev => prev.filter(e => e.id !== id))
      onChanged()
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar evidencia')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ pr: 6, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome color='warning' fontSize='small' />
        <Box>
          <Typography variant='subtitle1' fontWeight='bold' component='div'>
            Evidencias Personalizadas
          </Typography>
          <Typography variant='caption' color='text.secondary' component='div'>
            {studentId ? studentName : 'Varios alumnos'}
          </Typography>
        </Box>
        <IconButton
          aria-label='cerrar'
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size='small'
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLocked && (
          <Alert severity='warning' sx={{ mb: 2 }} variant='outlined'>
            El corte está cerrado. No se pueden modificar las evidencias.
          </Alert>
        )}

        {!isLocked && (
          <Alert severity='info' variant='outlined' sx={{ mb: 2, fontSize: '0.8rem' }}>
            Las evidencias que agregues aquí <strong>reemplazarán</strong> las generales del grupo para los estudiantes seleccionados.
          </Alert>
        )}
        
        {/* Selector Multiple de Estudiantes (Solo visible si creamos/editamos o si es masivo) */}
        {!isLocked && (studentId === null || showAddForm) && (
           <Box mb={2}>
              <Autocomplete
                multiple
                options={allStudents}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                value={selectedStudents}
                onChange={(_, newValue) => setSelectedStudents(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField 
                      {...params} 
                      label="Estudiantes a asignar" 
                      placeholder="Selecciona uno o varios" 
                      size="small" 
                  />
                )}
                disabled={saving}
              />
           </Box>
        )}

        {/* Lista de evidencias existentes SOLO CUANDO HAY UN ESTUDIANTE SELECCIONADO EXACTO */}
        {loading && selectedStudents.length === 1 ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {selectedStudents.length === 1 && evidencias.length === 0 && !showAddForm && (
              <Typography color='text.secondary' variant='body2' textAlign='center' py={2}>
                Este estudiante no tiene evidencias personalizadas aún.
                {!isLocked && ' Usa el botón "Agregar" para definirlas.'}
              </Typography>
            )}

            {selectedStudents.length === 1 && (
            <List dense disablePadding>
              {evidencias.map((ev, idx) => (
                <Box key={ev.id}>
                  {editingId === ev.id ? (
                    // Inline edit form
                    <Box sx={{ py: 1 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label={`Editando evidencia ${idx + 1}`}
                        value={formValue}
                        onChange={e => setFormValue(e.target.value)}
                        multiline
                        maxRows={3}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <TextField
                        fullWidth
                        size='small'
                        label='Indicadores Cualitativos (Opcional)'
                        placeholder='Presiona Enter para agregar múltipes indicadores...'
                        value={indicadoresValue}
                        onChange={e => setIndicadoresValue(e.target.value)}
                        multiline
                        minRows={2}
                        maxRows={5}
                        sx={{ mt: 2 }}
                      />
                      <Box display='flex' gap={1} mt={1} justifyContent='flex-end'>
                        <Button size='small' onClick={cancelEdit} disabled={saving}>
                          Cancelar
                        </Button>
                        <Button
                          size='small'
                          variant='contained'
                          startIcon={saving ? <CircularProgress size={12} color='inherit' /> : <Save />}
                          onClick={handleUpdate}
                          disabled={saving || !formValue.trim()}
                        >
                          Guardar
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <ListItem
                      disablePadding
                      sx={{ py: 0.5 }}
                      secondaryAction={
                        !isLocked && (
                          <Box display='flex' gap={0.5}>
                            <Tooltip title='Editar'>
                              <IconButton size='small' onClick={() => startEditing(ev)}>
                                <Edit fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Eliminar'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => handleDelete(ev.id)}
                                disabled={deletingId === ev.id}
                              >
                                {deletingId === ev.id ? (
                                  <CircularProgress size={14} color='inherit' />
                                ) : (
                                  <Delete fontSize='small' />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display='flex' alignItems='center' gap={1}>
                            <Chip
                              label={idx + 1}
                              size='small'
                              sx={{ width: 24, height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                              color='primary'
                            />
                            <Typography variant='body2'>{typeof ev.evidencia === 'string' ? ev.evidencia : JSON.stringify(ev.evidencia)}</Typography>
                          </Box>
                        }
                        sx={{ pr: !isLocked ? 8 : 0 }}
                      />
                    </ListItem>
                  )}
                  {idx < evidencias.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
            )}

            {/* Formulario agregar nueva evidencia */}
            {showAddForm && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Nueva evidencia personalizada'
                  placeholder='Ej: Reconoce su nombre por escrito'
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  multiline
                  maxRows={3}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Escape') cancelEdit()
                  }}
                />
                <TextField
                  fullWidth
                  size='small'
                  label='Indicadores Cualitativos (Opcional)'
                  placeholder='Presiona Enter para separar los indicadores en varias líneas...'
                  value={indicadoresValue}
                  onChange={e => setIndicadoresValue(e.target.value)}
                  multiline
                  minRows={2}
                  maxRows={5}
                  sx={{ mt: 2 }}
                />
                <Box display='flex' gap={1} mt={1} justifyContent='flex-end'>
                  {globalEvidences && globalEvidences.length > 0 && (
                    <Button
                      variant='outlined'
                      color='secondary'
                      startIcon={<AutoAwesome />}
                      size='small'
                      onClick={() => {
                        setSelectedGlobals([])
                        setShowImportDialog(true)
                      }}
                      sx={{ mr: 'auto' }}
                    >
                      Importar Globales
                    </Button>
                  )}
                  <Button size='small' onClick={cancelEdit} disabled={saving || studentId === null}>
                    Cancelar
                  </Button>
                  <Button
                    size='small'
                    variant='contained'
                    color='success'
                    startIcon={saving ? <CircularProgress size={12} color='inherit' /> : <Add />}
                    onClick={handleAdd}
                    disabled={saving || !formValue.trim() || selectedStudents.length === 0}
                  >
                    Agregar a {selectedStudents.length} alumno(s)
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Footer: botón agregar */}
        {!isLocked && !showAddForm && !loading && editingId === null && selectedStudents.length === 1 && (
          <Box mt={2} display='flex' justifyContent='flex-start' gap={1}>
            <Button
              variant='outlined'
              startIcon={<Add />}
              size='small'
              onClick={() => {
                setFormValue('')
                setShowAddForm(true)
              }}
            >
              Agregar evidencia
            </Button>

            {globalEvidences && globalEvidences.length > 0 && (
              <Button
                variant='outlined'
                color='secondary'
                startIcon={<AutoAwesome />}
                size='small'
                onClick={() => {
                  setSelectedGlobals([])
                  setShowImportDialog(true)
                }}
              >
                Importar Globales
              </Button>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Subdialog for Importing Globals */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Importar Evidencias Globales</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List>
            {globalEvidences.map(ev => (
              <ListItem key={ev.id} disablePadding sx={{ borderBottom: '1px solid #f0f0f0' }}>
                <Box
                  sx={{ width: '100%', display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => toggleGlobalSelection(ev.id)}
                >
                  <input 
                    type='checkbox' 
                    checked={selectedGlobals.includes(ev.id)} 
                    onChange={() => {}} 
                    style={{ marginRight: 15, transform: 'scale(1.2)' }}
                  />
                  <ListItemText 
                    primary={typeof ev.nombre === 'string' ? ev.nombre : JSON.stringify(ev.nombre)} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <Box p={2} display='flex' justifyContent='flex-end' gap={1}>
          <Button onClick={() => setShowImportDialog(false)} disabled={saving} size='small'>
            Cancelar
          </Button>
          <Button 
            variant='contained' 
            color='secondary' 
            onClick={handleImportGlobals} 
            disabled={saving || selectedGlobals.length === 0}
            size='small'
          >
            {saving ? <CircularProgress size={20} color='inherit' /> : `Importar seleccionadas (${selectedGlobals.length})`}
          </Button>
        </Box>
      </Dialog>
    </Dialog>
  )
}

export default StudentEvidencesModal
