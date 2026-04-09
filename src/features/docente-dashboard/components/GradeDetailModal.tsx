import { Close, History, Save, Visibility } from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
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
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { getGradeDetails, saveGrade } from '../services/gradesService'
interface GradeDetailModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  taskId: number
  studentId: number
  taskName: string
  studentName: string
  isLocked?: boolean
}

const GradeDetailModal = ({
  open,
  onClose,
  onSuccess,
  taskId,
  studentId,
  taskName,
  studentName,
  isLocked: isLockedProp
}: GradeDetailModalProps) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gradeData, setGradeData] = useState<any>(null)
  const [audits, setAudits] = useState<any[]>([])

  // Final lock state
  const isLocked = isLockedProp || !!gradeData?.is_locked

  // Form State
  const [nota, setNota] = useState('')
  const [estado, setEstado] = useState('entregada')
  const [observacion, setObservacion] = useState('')

  useEffect(() => {
    if (open && taskId && studentId) {
      fetchDetails()
    }
  }, [open, taskId, studentId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const data = await getGradeDetails(taskId, studentId)
      const g = data.grade
      setAudits(data.audits || [])

      if (g) {
        setGradeData(g)
        setNota(String(g.nota))
        setEstado(g.estado || 'entregada')
        setObservacion(g.retroalimentacion_docente || '')
      } else {
        setGradeData(null)
        setNota('')
        setEstado('entregada')
        setObservacion('')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar detalles')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveGrade({
        user_id: studentId,
        tarea_id: taskId,
        nota: parseFloat(nota) || 0,
        retroalimentacion: observacion,
        estado
      } as any) // Type assertion if saveGrade type definition is strict and missing 'estado'

      toast.success('Calificación actualizada')
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
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

  const formatChange = (oldVal: any, newVal: any) => {
    if (oldVal === newVal) return null
    return (
      <Box display='flex' alignItems='center' gap={1}>
        {oldVal !== null && (
          <Typography variant='caption' sx={{ textDecoration: 'line-through', color: 'error.main' }}>
            {String(oldVal)}
          </Typography>
        )}
        <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
          &rarr;
        </Typography>
        <Typography variant='caption' sx={{ color: 'success.main' }}>
          {String(newVal)}
        </Typography>
      </Box>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h6' component='div'>
            Detalles de Calificación
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {taskName} - {studentName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size='small'>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Form Section */}
            <Grid item xs={12} md={5}>
              <Box display='flex' flexDirection='column' gap={3}>
                {/* Teacher Grading Section */}
                <Box>
                  <Typography
                    variant='overline'
                    display='block'
                    color='primary'
                    fontWeight='bold'
                    sx={{ mb: 1, letterSpacing: 1.5 }}
                  >
                    — CALIFICACIÓN Y RETROALIMENTACIÓN (DOCENTE)
                  </Typography>

                  <Box display='flex' flexDirection='column' gap={2}>
                    <Box
                      display='flex'
                      flexDirection='column'
                      alignItems='center'
                      bgcolor='primary.50'
                      p={2}
                      borderRadius={2}
                      border={1}
                      borderColor='primary.200'
                    >
                      <Typography variant='overline' color='primary.main' fontWeight='bold' lineHeight={1}>
                        PUNTAJE
                      </Typography>
                      <Typography variant='h2' fontWeight='900' color='primary.main' sx={{ mt: 1 }}>
                        {nota || '0'}
                      </Typography>
                    </Box>

                    <FormControl fullWidth size='small'>
                      <InputLabel>Estado de revisión</InputLabel>
                      <Select
                        value={estado}
                        label='Estado de revisión'
                        onChange={e => setEstado(e.target.value)}
                        disabled={isLocked}
                      >
                        <MenuItem value='pendiente'>Pendiente</MenuItem>
                        <MenuItem value='entregada'>Entregada (Sin revisar)</MenuItem>
                        <MenuItem value='revisada'>Revisada (Finalizada)</MenuItem>
                        <MenuItem value='no_entregado'>No Entregado</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label='Tu Retroalimentación al Estudiante'
                      value={observacion}
                      onChange={e => setObservacion(e.target.value)}
                      multiline
                      rows={4}
                      fullWidth
                      size='small'
                      disabled={isLocked}
                      placeholder='Escribe aquí tu retroalimentación, correcciones o comentarios para el estudiante...'
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Student Submissions Section */}
                <Box>
                  <Typography
                    variant='overline'
                    display='block'
                    color='secondary.main'
                    fontWeight='bold'
                    sx={{ mb: 1, letterSpacing: 1.5 }}
                  >
                    — ENTREGA DEL ESTUDIANTE
                  </Typography>

                  {gradeData?.tarea?.entrega_en_linea || (gradeData?.archivos && gradeData.archivos.length > 0) ? (
                    <Box p={2} bgcolor='grey.50' borderRadius={2} border={1} borderColor='grey.300'>
                      {/* Student Comment */}
                      <Box mb={2}>
                        <Typography variant='caption' fontWeight='bold' color='text.secondary'>
                          COMENTARIO DEL ALUMNO:
                        </Typography>
                        <Box
                          sx={{
                            bgcolor: 'white',
                            p: 1.5,
                            borderRadius: 1,
                            mt: 0.5,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            minHeight: 40
                          }}
                        >
                          {gradeData.observacion_estudiante ? (
                            <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
                              {gradeData.observacion_estudiante}
                            </Typography>
                          ) : (
                            <Typography variant='caption' color='text.disabled'>
                              El alumno no dejó comentarios en su entrega.
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Files */}
                      <Box>
                        <Typography variant='caption' fontWeight='bold' color='text.secondary'>
                          ARCHIVOS ADJUNTOS ({gradeData.archivos?.length || 0}):
                        </Typography>
                        {gradeData.archivos && gradeData.archivos.length > 0 ? (
                          <Box display='flex' flexDirection='column' gap={1} mt={1}>
                            {gradeData.archivos.map((file: any, index: number) => (
                              <Box
                                key={index}
                                display='flex'
                                alignItems='center'
                                justifyContent='space-between'
                                p={1}
                                bgcolor='white'
                                borderRadius={1}
                                boxShadow='0 1px 2px rgba(0,0,0,0.05)'
                              >
                                <Typography variant='caption' noWrap sx={{ maxWidth: '65%', fontWeight: 500 }}>
                                  {file.name || `Archivo ${index + 1}`}
                                </Typography>
                                <Button
                                  size='small'
                                  variant='contained'
                                  disableElevation
                                  onClick={() => openFile(file)}
                                  startIcon={<Visibility sx={{ fontSize: 14 }} />}
                                  sx={{ py: 0.5, px: 1.5, textTransform: 'none', fontSize: '0.7rem' }}
                                >
                                  Abrir
                                </Button>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography
                            variant='caption'
                            display='block'
                            color='text.disabled'
                            sx={{ mt: 0.5, fontStyle: 'italic' }}
                          >
                            No hay archivos adjuntos en esta entrega.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      p={3}
                      textAlign='center'
                      bgcolor='grey.50'
                      borderRadius={2}
                      border='1px dashed'
                      borderColor='grey.400'
                    >
                      <Typography variant='caption' color='text.secondary'>
                        Esta tarea no está configurada para recibir entregas en línea o el estudiante aún no ha
                        entregado nada.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Divider */}
            <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Divider orientation='vertical' />
            </Grid>

            {/* History Section */}
            <Grid item xs={12} md={6}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <History fontSize='small' color='action' />
                <Typography variant='subtitle2' fontWeight='bold'>
                  Historial de Cambios
                </Typography>
              </Box>

              {audits.length === 0 ? (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  align='center'
                  sx={{ py: 4, bgcolor: 'grey.50', borderRadius: 1 }}
                >
                  No hay historial registrado.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 300 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha/Usuario</TableCell>
                        <TableCell>Cambios</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {audits.map((audit, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant='caption' display='block' fontWeight='bold'>
                              {audit.created_at}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {audit.user}
                            </Typography>
                            <Chip label={audit.event} size='small' sx={{ height: 16, fontSize: '0.6rem' }} />
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='column' gap={0.5}>
                              {audit.new_values &&
                                Object.keys(audit.new_values).map(key => {
                                  if (['updated_at', 'id', 'user_id', 'estudiante_id', 'tarea_id'].includes(key))
                                    return null
                                  const oldVal = audit.old_values ? audit.old_values[key] : null
                                  const newVal = audit.new_values[key]
                                  if (oldVal == newVal && audit.event === 'updated') return null

                                  return (
                                    <Box key={key} display='flex' alignItems='center' justifyContent='space-between'>
                                      <Typography
                                        variant='caption'
                                        sx={{ textTransform: 'capitalize', mr: 1, color: 'text.secondary' }}
                                      >
                                        {key}:
                                      </Typography>
                                      {formatChange(oldVal, newVal)}
                                    </Box>
                                  )
                                })}
                              {/* If Created */}
                              {audit.event === 'created' && (
                                <Typography variant='caption' color='success.main'>
                                  Registro Creado
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='inherit' disabled={saving}>
          Cerrar
        </Button>
        {!isLocked && (
          <Button
            onClick={handleSave}
            variant='contained'
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          >
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default GradeDetailModal
