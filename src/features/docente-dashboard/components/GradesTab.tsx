'use client'

import {
  getGradesByAssignment,
  saveGradesBatch,
  updateTaskStatusBatch
} from '@/features/docente-dashboard/services/gradesService'
import { Add, AutoAwesome, CheckCircle, Delete, Edit, HighlightOff, MoreVert, Visibility } from '@mui/icons-material'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import GradeDetailModal from '../components/GradeDetailModal'
import StudentEvidencesModal from '../components/StudentEvidencesModal'
import StudentProfileModal from '../components/StudentProfileModal'
import TaskFormModal from '../components/TaskFormModal'
import { Task, deleteTask } from '../services/tasksService'
import { EvidenceCell } from './EvidenceCell'

interface GradesTabProps {
  assignmentId: number
  selectedCorte: number | ''
  isLocked?: boolean // Optional if we want to force lock from parent
}

const GradesTab = ({ assignmentId, selectedCorte }: GradesTabProps) => {
  const [fetchingGrades, setFetchingGrades] = useState(false)

  const [students, setStudents] = useState<any[]>([])
  const [evidences, setEvidences] = useState<any[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLocked, setIsLocked] = useState(false)

  const [profileStudent, setProfileStudent] = useState<any | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  // Scores: studentId -> evidenceId -> value (Legacy)
  const [gradesData, setGradesData] = useState<Record<number, Record<number, string>>>({})
  // Tasks: studentId -> taskId -> value (Numeric)
  const [taskGradesData, setTaskGradesData] = useState<Record<number, Record<number, string>>>({})
  const [taskGradeStatuses, setTaskGradeStatuses] = useState<Record<number, Record<number, string>>>({})

  // INITATIVE DATA: studentId -> evidenceId (which comes in tasks array) -> { escala_detalle_id, indicadores_check }
  const [initiativeData, setInitiativeData] = useState<
    Record<number, Record<string | number, { escala_detalle_id: number | ''; indicadores_check: any }>>
  >({})

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<{
    taskId: number
    studentId: number
    taskName: string
    studentName: string
  } | null>(null)

  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set()) // stored as "t-{sid}-{tid}" or "e-{sid}-{eid}" or "i-{sid}-{eid}"
  const [savingDocs, setSavingDocs] = useState(false)

  const [isInitiative, setIsInitiative] = useState(false)
  const [scaleValues, setScaleValues] = useState<any[]>([])
  const [notaMaxima, setNotaMaxima] = useState<number | null>(null)

  // Modal State
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Menu State
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [menuTaskId, setMenuTaskId] = useState<number | null>(null)

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, taskId: number) => {
    setMenuAnchorEl(event.currentTarget)
    setMenuTaskId(taskId)
  }

  const handleCloseMenu = () => {
    setMenuAnchorEl(null)
    setMenuTaskId(null)
  }
  
  // Focus State for Highlights
  const [focusedRow, setFocusedRow] = useState<number | null>(null)
  const [focusedCol, setFocusedCol] = useState<number | null>(null)

  const handleFocus = (rowIndex: number, colIndex: number) => {
    setFocusedRow(rowIndex)
    setFocusedCol(colIndex)
  }

  const handleBlur = () => {
    setFocusedRow(null)
    setFocusedCol(null)
  }

  // Estado: studiante especial – modal de evidencias personalizadas
  const [evidenciasModalOpen, setEvidenciasModalOpen] = useState(false)
  const [evidenciasStudent, setEvidenciasStudent] = useState<{ id: number; name: string } | null>(null)
  // not_asignatura_grado_cortes.id (tabla intermedia) para el corte activo
  const [asignaturaGradoCorteId, setAsignaturaGradoCorteId] = useState<number | null>(null)
  // Mapa: studentId -> array de evidencias personalizadas (de la respuesta del backend)
  const [customEvidencesByStudent, setCustomEvidencesByStudent] = useState<Record<number, any[]>>({})


  // 2. Fetch Grades when Corte changes
  const fetchGrades = async () => {
    if (!assignmentId || !selectedCorte) return

    try {
      setFetchingGrades(true)
      const data = await getGradesByAssignment(assignmentId, Number(selectedCorte))

      setStudents(data.students || [])
      setEvidences(data.evidences || [])
      // If Initiative, 'tasks' holds the predefined evidences
      setTasks(data.tasks || [])
      setIsLocked(!!data.metadata?.is_locked)
      setIsInitiative(!!data.es_para_educacion_iniciativa)
      setScaleValues(data.escala_valores || [])
      setNotaMaxima(data.metadata?.nota_maxima || null)

      // Guardar el ID del registro not_asignatura_grado_cortes para el corte activo
      if (data.metadata?.asignatura_grado_corte_id) {
        setAsignaturaGradoCorteId(data.metadata.asignatura_grado_corte_id)
      }

      // Mapear evidencias_custom por estudiante (Opción A: viene del backend)
      const customMap: Record<number, any[]> = {}
      const studentsList2 = data.students || []
      studentsList2.forEach((item: any) => {
        if (item.student?.id && item.evidencias_custom) {
          customMap[item.student.id] = item.evidencias_custom
        }
      })
      setCustomEvidencesByStudent(customMap)

      // Map existing grades
      const initialGrades: Record<number, Record<number, string>> = {}
      const initialTaskGrades: Record<number, Record<number, string>> = {}
      const initialTaskStatuses: Record<number, Record<number, string>> = {}
      const initialInitiative: Record<number, Record<string | number, any>> = {}

      const studentsList = data.students || []
      studentsList.forEach((item: any) => {
        const studentId = item.student.id

        // Evidence Grades (Legacy)
        initialGrades[studentId] = {}
        if (item.grades) {
          Object.keys(item.grades).forEach(evId => {
            const g = item.grades[evId]
            if (g && g.nota != null) {
              initialGrades[studentId][Number(evId)] = String(g.nota)
            }
          })
        }

        // Task/Evidence Grades
        initialTaskGrades[studentId] = {}
        initialTaskStatuses[studentId] = {}
        initialInitiative[studentId] = {}

        if (item.task_grades) {
          Object.keys(item.task_grades).forEach(tId => {
            const g = item.task_grades[tId]
            if (g) {
              if (data.es_para_educacion_iniciativa) {
                // Qualitative Data (Use raw string ID like g_1 or c_1)
                initialInitiative[studentId][tId] = {
                  escala_detalle_id: g.escala_detalle_id || '',
                  indicadores_check: g.indicadores_check || {}
                }
              } else {
                // Numeric Tasks (Convert to number)
                const nId = Number(tId)
                if (g.nota != null) {
                  initialTaskGrades[studentId][nId] = String(g.nota)
                }
                initialTaskStatuses[studentId][nId] = g.estado || 'pendiente'
              }
            }
          })
        }
      })

      setGradesData(initialGrades)
      setTaskGradesData(initialTaskGrades)
      setTaskGradeStatuses(initialTaskStatuses)
      setInitiativeData(initialInitiative)

      // Debug logging

      setPendingChanges(new Set())

      if (data.escala_valores) {
        setScaleValues(data.escala_valores)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al cargar calificaciones')
    } finally {
      setFetchingGrades(false)
    }
  }

  useEffect(() => {
    fetchGrades()
  }, [assignmentId, selectedCorte])

  // Handle Updates
  const getTotals = (studentId: number) => {
    const sGrades = taskGradesData[studentId] || {}
    let aum = 0
    let exam = 0

    tasks.forEach(t => {
      const val = parseFloat(sGrades[t.id] || '0')
      if (!isNaN(val)) {
        if (t.tipo === 'examen') {
          exam += val
        } else {
          aum += val
        }
      }
    })

    aum = Number(aum.toFixed(2))
    exam = Number(exam.toFixed(2))
    const nf = Number((aum + exam).toFixed(2))

    let esc = '-'
    if (scaleValues.length > 0) {
      const match = scaleValues.find(s => nf >= parseFloat(s.rango_inicio) && nf <= parseFloat(s.rango_fin))
      if (match) esc = match.abreviatura
    }

    return { aum, exam, nf, esc }
  }

  const handleGradeChange = (studentId: number, evidenceId: number, value: string) => {
    setGradesData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [evidenceId]: value }
    }))
    setPendingChanges(prev => new Set(prev).add(`e-${studentId}-${evidenceId}`))
  }

  const handleTaskGradeChange = (studentId: number, taskId: number, value: string) => {
    // Validate input: Allow empty, integer, or decimal. Reject otherwise.
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return

    setTaskGradesData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [taskId]: value }
    }))
    setPendingChanges(prev => new Set(prev).add(`t-${studentId}-${taskId}`))
  }

  const handleInitiativeChange = (
    studentId: number,
    evidenceId: string | number,
    newVal: { escala_detalle_id: number | ''; indicadores_check: any }
  ) => {
    setInitiativeData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [evidenceId]: newVal }
    }))
    setPendingChanges(prev => new Set(prev).add(`i-${studentId}-${evidenceId}`))
  }

  const handleCopyDown = (studentId: number, sourceTaskId: number | string, type: 'task' | 'initiative', colIndex: number = -1) => {
    // Find current student index
    const currentIndex = students.findIndex((item: any) => item.student.id === studentId)
    if (currentIndex === -1) return

    // Get the value to copy
    let valueToCopy: any
    if (type === 'task') {
      valueToCopy = taskGradesData[studentId]?.[sourceTaskId as number] || ''
      if (!valueToCopy) return // Don't copy empty values

      // Copy to all students below
      const newGrades = { ...taskGradesData }
      for (let i = currentIndex + 1; i < students.length; i++) {
        const targetStudentId = students[i].student.id
        if (!newGrades[targetStudentId]) newGrades[targetStudentId] = {}
        newGrades[targetStudentId][sourceTaskId as number] = valueToCopy
        setPendingChanges(prev => new Set(prev).add(`t-${targetStudentId}-${sourceTaskId}`))
      }
      setTaskGradesData(newGrades)
    } else if (type === 'initiative') {
      valueToCopy = initiativeData[studentId]?.[sourceTaskId]
      if (!valueToCopy || (!valueToCopy.escala_detalle_id && (!valueToCopy.indicadores_check || Object.keys(valueToCopy.indicadores_check).length === 0))) return // Don't copy empty values

      // Copy to all students below
      const newData = { ...initiativeData }
      for (let i = currentIndex + 1; i < students.length; i++) {
        const targetStudentId = students[i].student.id
        if (!newData[targetStudentId]) newData[targetStudentId] = {}

        let targetTaskId = sourceTaskId;

        if (colIndex >= 0) {
          let isSelectTask = false;
          if (tasks[colIndex]) {
            try {
              const tInd = typeof tasks[colIndex].indicador === 'string' ? JSON.parse(tasks[colIndex].indicador) : (tasks[colIndex].indicador || {});
              isSelectTask = tInd?.type === 'select';
            } catch(e) {}
          }

          const targetCustomEvs = customEvidencesByStudent[targetStudentId];

          if (!isSelectTask && targetCustomEvs && targetCustomEvs.length > 0) {
            const nonSelectTasksBefore = tasks.slice(0, colIndex).filter((t: any) => {
              let tInd: any = {}
              try {
                tInd = typeof t.indicador === 'string' ? JSON.parse(t.indicador) : (t.indicador || {})
              } catch(e) {}
              return tInd?.type !== 'select'
            }).length

            const targetCustom = targetCustomEvs[nonSelectTasksBefore];
            if (targetCustom) {
              targetTaskId = `c_${targetCustom.id}`;
            } else {
              targetTaskId = `g_${tasks[colIndex].id}`;
            }
          } else {
            targetTaskId = `g_${tasks[colIndex].id}`;
          }
        }

        newData[targetStudentId][targetTaskId] = { ...valueToCopy }
        setPendingChanges(prev => new Set(prev).add(`i-${targetStudentId}-${targetTaskId}`))
      }
      setInitiativeData(newData)
    }

    toast.success(`Valor copiado a ${students.length - currentIndex - 1} estudiante(s)`)
  }

  const handleBatchSave = async () => {
    if (pendingChanges.size === 0) return

    setSavingDocs(true)
    const toastId = toast.loading('Guardando cambios...')

    try {
      const updates: any[] = []
      let valid = true

      // Use Array.from to allow breaking or easier iteration if not inside a callback returning void
      const keys = Array.from(pendingChanges)

      for (const key of keys) {
        const parts = key.split('-') // e.g. "t-123-45", "e-123-67", "i-123-c_88"
        const type = parts[0]
        const studentId = parseInt(parts[1])
        const rawItemId = parts[2]
        const itemId = type === 'i' ? rawItemId : parseInt(rawItemId)

        let payload: any = {
          user_id: studentId,
          nota: 0,
          observaciones: '' // TODO: Handle observations if needed
        }

        if (type === 't') {
          // Task Grade
          const val = taskGradesData[studentId]?.[itemId as number] || ''
          // Validate
          if (!isInitiative && val !== '') {
            const num = parseFloat(val)
            const task = tasks.find((t: any) => t.id === itemId)
            const max = task?.puntaje_maximo || 10
            if (num < 0 || num > max) valid = false
          }

          payload.tarea_id = itemId
          payload.evidencia_id = null // Explicitly null for tasks to avoid backend validation error
          payload.nota = val === '' ? 0 : val
        } else if (type === 'i') {
          // Initiative Evidence (Qualitative)
          const eData = initiativeData[studentId]?.[rawItemId]

          // Detectar si esta evidencia es personalizada (c_) o general (g_)
          const isEspecial = String(rawItemId).startsWith('c_')
          const numericItemId = parseInt(String(rawItemId).replace(/[^\d]/g, ''))

          payload.escala_detalle_id = eData?.escala_detalle_id || null
          payload.indicadores_check = eData?.indicadores_check || null
          payload.nota = null

          if (isEspecial) {
            payload.evidencia_estudiante_id = numericItemId
            payload.evidencia_id = null
          } else {
            payload.evidencia_id = numericItemId
            payload.evidencia_estudiante_id = null
          }
        } else {
          // Evidence Grade (Legacy)
          const val = gradesData[studentId]?.[itemId as number] || ''
          // Validate
          if (!isInitiative && val !== '') {
            const num = parseFloat(val)
            if (num < 0 || num > 10) valid = false
          }

          payload.evidencia_id = itemId
          payload.nota = val === '' ? 0 : val
        }
        updates.push(payload)
      }

      // Validate accumulated grades don't exceed nota_maxima
      if (!isInitiative && notaMaxima) {
        const studentAccumulated: Record<number, number> = {}

        // Calculate accumulated for each student
        students.forEach((item: any) => {
          const studentId = item.student.id
          let total = 0

          tasks.forEach((task: any) => {
            const grade = taskGradesData[studentId]?.[task.id]
            if (grade && grade !== '') {
              total += parseFloat(grade)
            }
          })

          studentAccumulated[studentId] = total
        })

        // Check if any student exceeds the maximum
        const exceededStudents: string[] = []
        Object.entries(studentAccumulated).forEach(([studentId, accumulated]) => {
          if (accumulated > notaMaxima) {
            const student = students.find((s: any) => s.student.id === parseInt(studentId))
            const studentName = student?.student.nombre_completo || `ID ${studentId}`
            exceededStudents.push(`${studentName} (${accumulated}/${notaMaxima})`)
          }
        })

        if (exceededStudents.length > 0) {
          toast.error(
            `El acumulado de tareas supera la nota máxima (${notaMaxima}) para:\n${exceededStudents.join('\n')}`,
            { id: toastId, duration: 6000 }
          )
          setSavingDocs(false)
          return
        }
      }

      if (!valid) {
        toast.error('Hay calificaciones inválidas. Por favor corrígelas.', { id: toastId })
        setSavingDocs(false)
        return
      }

      // Batch Save
      // Assuming saveGradesBatch is imported from '@/features/docente-dashboard/services/gradesService'
      // and takes an array of grade payloads.
      await saveGradesBatch(updates)

      toast.success('Cambios guardados correctamente', { id: toastId })
      setPendingChanges(new Set())
      fetchGrades()
    } catch (error: any) {
      console.error('Error batch saving grades:', error)
      if (error.response?.data) {
        console.error('Server Error Data:', error.response.data)
        toast.error(`Error: ${error.response.data.message || 'Error desconocido'}`, { id: toastId })
      } else {
        toast.error('Error al guardar cambios', { id: toastId })
      }
    } finally {
      setSavingDocs(false)
    }
  }

  const handleMarkAsReviewed = async () => {
    if (!menuTaskId) return

    const toastId = toast.loading('Actualizando estados...')
    try {
      await updateTaskStatusBatch(menuTaskId, 'revisada')
      toast.success('Estado actualizado', { id: toastId })
      handleCloseMenu()
      fetchGrades()
    } catch (error) {
      console.error(error)
      toast.error('Error al actualizar', { id: toastId })
    }
  }

  const handleMarkAsNotDelivered = async () => {
    if (!menuTaskId) return

    const toastId = toast.loading('Actualizando estados...')
    try {
      await updateTaskStatusBatch(menuTaskId, 'no_entregado')
      toast.success('Estado actualizado', { id: toastId })
      handleCloseMenu()
      fetchGrades()
    } catch (error) {
      console.error(error)
      toast.error('Error al actualizar', { id: toastId })
    }
  }

  const openGradeDetail = (taskId: number, studentId: number, taskName: string, studentName: string) => {
    setSelectedDetail({ taskId, studentId, taskName, studentName })
    setDetailModalOpen(true)
  }

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteTask = (id: number) => {
    setTaskToDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDeleteId) return

    setIsDeleting(true)
    const toastId = toast.loading('Eliminando tarea...')
    try {
      await deleteTask(taskToDeleteId)
      toast.success('Tarea eliminada', { id: toastId })

      setTasks(prev => prev.filter(t => t.id !== taskToDeleteId))
      setTaskToDeleteId(null)
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar tarea', { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const hasTasks = tasks.length > 0
  // const showLegacyEvidences = !hasTasks && evidences.length > 0;

  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    colIndex: number,
    type?: 't' | 'e',
    itemId?: number,
    currentValue?: string
  ) => {
    // Copy Down to ALL cells below (Ctrl + ArrowDown)
    if (e.ctrlKey && e.key === 'ArrowDown' && type && itemId !== undefined && currentValue !== undefined) {
      e.preventDefault()

      // Don't copy empty values
      if (!currentValue || currentValue === '') {
        toast.error('No hay valor para copiar')
        return
      }

      // Copy to all students below current row
      let copiedCount = 0
      for (let i = rowIndex + 1; i < students.length; i++) {
        const targetStudent = students[i]
        if (targetStudent?.student?.id) {
          if (type === 't') {
            handleTaskGradeChange(targetStudent.student.id, itemId, currentValue)
          } else {
            handleGradeChange(targetStudent.student.id, itemId, currentValue)
          }
          copiedCount++
        }
      }

      if (copiedCount > 0) {
        toast.success(`Valor "${currentValue}" copiado a ${copiedCount} estudiante(s)`)
      }
      return
    }

    // Navigate with arrows or Enter
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      e.preventDefault()
      let nextRow = rowIndex
      let nextCol = colIndex

      const totalCols = hasTasks ? tasks.length : evidences.length

      switch (e.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, rowIndex - 1)
          break
        case 'ArrowDown':
        case 'Enter':
          nextRow = Math.min(students.length - 1, rowIndex + 1)
          break
        case 'ArrowLeft':
          nextCol = Math.max(0, colIndex - 1)
          break
        case 'ArrowRight':
          nextCol = Math.min(totalCols - 1, colIndex + 1)
          break
      }

      const nextId = `grade-input-${nextRow}-${nextCol}`
      const nextInput = document.getElementById(nextId)
      if (nextInput) {
        nextInput.focus()
        if (nextInput instanceof HTMLInputElement) {
          nextInput.select()
        }
      }
    }
  }

  const showLegacyEvidences = !hasTasks && evidences.length > 0

  return (
    <Box sx={{ py: 2 }}>
      {selectedCorte && !isInitiative && (
        <Box mb={2} display='flex' justifyContent='flex-end'>
          <Button
            variant='contained'
            startIcon={<Add />}
            size='small'
            disabled={isLocked}
            onClick={() => {
              setEditingTask(null)
              setShowTaskModal(true)
            }}
          >
            Nueva Tarea
          </Button>
        </Box>
      )}

      {selectedCorte && isInitiative && (
        <Box mb={2} display='flex' justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={2}>
          <Alert severity='info' variant='outlined' sx={{ flex: 1 }}>
            <AlertTitle>Educación Inicial</AlertTitle>
            Calificación cualitativa: Haga clic en la celda para ver criterio y asignar nivel.
          </Alert>
          <Button
            variant='contained'
            color='warning'
            startIcon={<AutoAwesome />}
            size='small'
            disabled={isLocked}
            onClick={() => {
              setEvidenciasStudent(null)
              setEvidenciasModalOpen(true)
            }}
          >
            Asignar a Varios Alumnos
          </Button>
        </Box>
      )}

      {isLocked && (
        <Box mb={2}>
          <Alert severity='warning' variant='filled' sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 'bold' }}>Periodo Bloqueado</AlertTitle>
            El ingreso y modificación de notas para este corte evaluativo está cerrado.
          </Alert>
        </Box>
      )}

      {fetchingGrades ? (
        <Box display='flex' justifyContent='center' my={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {selectedCorte ? (
            <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto', maxHeight: '70vh' }}>
              <Table size='small' stickyHeader>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        minWidth: 200,
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'grey.50',
                        zIndex: 10,
                        py: 1
                      }}
                    >
                      Estudiante
                    </TableCell>

                    {tasks.map((task, colIndex) => {
                      const isColFocused = focusedCol === colIndex
                      return (
                        <TableCell 
                          key={task.id} 
                          align='center' 
                          sx={{ 
                            minWidth: isInitiative ? 150 : 60, 
                            py: 1,
                            bgcolor: isColFocused ? 'rgba(25, 118, 210, 0.12)' : 'grey.50',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                            <Tooltip title={isInitiative ? (typeof task.nombre === 'string' ? task.nombre : JSON.stringify(task.nombre)) : (task.descripcion || '')}>
                              <Typography
                                variant='caption'
                                fontWeight='bold'
                                sx={{ 
                                  maxWidth: 250, 
                                  cursor: 'help', 
                                  whiteSpace: 'normal', 
                                  lineHeight: 1.1, 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textAlign: 'center'
                                }}
                              >
                                {typeof task.nombre === 'string' ? task.nombre : JSON.stringify(task.nombre)}
                              </Typography>
                            </Tooltip>
                            {!isInitiative && (
                              <IconButton size='small' onClick={e => handleOpenMenu(e, task.id)} sx={{ p: 0.2 }}>
                                <MoreVert fontSize='small' sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      )
                    })}

                    {/* Summary Columns (Only for Numeric) */}
                    {hasTasks && !isInitiative && (
                      <>
                        <TableCell align='center' sx={{ fontWeight: 'bold', minWidth: 50, bgcolor: 'grey.100' }}>
                          ACUM
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold', minWidth: 50, bgcolor: 'grey.100' }}>
                          EXAM
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold', minWidth: 50, bgcolor: 'primary.50' }}>
                          NF
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold', minWidth: 50, bgcolor: 'primary.50' }}>
                          ESC
                        </TableCell>
                      </>
                    )}

                    {!hasTasks &&
                      evidences.map(ev => (
                        <TableCell key={ev.id} align='center' sx={{ fontWeight: 'bold', py: 1, minWidth: 120 }}>
                          <Tooltip title={ev.evidencia || ''}>
                            <Typography
                                variant='caption'
                                fontWeight='bold'
                                sx={{ 
                                  maxWidth: 200, 
                                  whiteSpace: 'normal', 
                                  lineHeight: 1.1, 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textAlign: 'center'
                                }}
                              >
                                {ev.evidencia}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((item: any, rowIndex: number) => {
                    const isRowFocused = focusedRow === rowIndex
                    return (
                      <TableRow 
                        key={item.student.id} 
                        hover
                        sx={{ 
                          bgcolor: isRowFocused ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <TableCell 
                          sx={{ 
                            position: 'sticky', 
                            left: 0, 
                            bgcolor: isRowFocused ? 'rgba(235, 245, 255, 1)' : 'background.paper', 
                            py: 0.5, 
                            zIndex: 9 
                          }}
                        >
                          <Box display='flex' alignItems='center' gap={0.5}>
                            <Typography
                              variant='body2'
                              fontSize='0.875rem'
                              sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                              onClick={() => {
                                setProfileStudent(item.student)
                                setProfileOpen(true)
                              }}
                            >
                              {rowIndex + 1}. {item.student.nombre_completo}
                            </Typography>
                            {/* Ícono estudiante especial (solo en Educación Inicial) */}
                            {isInitiative && (
                              <Tooltip title={item.student.es_especial ? 'Estudiante especial – Ver/editar evidencias personalizadas' : 'Personalizar evidencias para este estudiante'}>
                                <IconButton
                                  size='small'
                                  sx={{
                                    p: 0.2,
                                    color: item.student.es_especial ? 'warning.main' : 'text.disabled',
                                    '&:hover': { color: 'warning.dark' }
                                  }}
                                  onClick={() => {
                                    setEvidenciasStudent({ id: item.student.id, name: item.student.nombre_completo })
                                    setEvidenciasModalOpen(true)
                                  }}
                                >
                                  <AutoAwesome sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {tasks.map((task, colIndex) => {
                          const isColFocused = focusedCol === colIndex
                          // For initiative, existing evidences are passed as 'tasks' but might not have students pivot if query wasn't updated
                          // Re-using logic: if task.estudiantes is undefined, we assume it applies to all or handle it.
                          // In Backend we updated NotAsignaturaGradoCorteEvidencia to NOT belong to students specifically (it's general).
                          // So for Initiative we skip assignment check.

                          const isAssigned = !!(isInitiative
                            ? true
                            : task.estudiantes?.some((e: any) => e.id === item.student.users_grupo_id))

                          if (isAssigned === false) {
                            return (
                              <TableCell 
                                key={task.id}
                                sx={{ bgcolor: isColFocused ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}
                              >
                                <Typography variant='caption'>-</Typography>
                              </TableCell>
                            )
                          }

                          if (isInitiative) {
                            // Parse indicator ahead of time to detect type
                            let baseParsedIndicators: any = {}
                            try {
                              const baseInd = (task as any).indicador
                              baseParsedIndicators = typeof baseInd === 'string' ? JSON.parse(baseInd) : (baseInd || {})
                            } catch (e) {}

                            const isSelectTask = baseParsedIndicators?.type === 'select'

                            // Detectar si el estudiante tiene evidencias personalizadas
                            const studentCustomEvs = customEvidencesByStudent[item.student.id]
                            const hasCustom = !isSelectTask && studentCustomEvs && studentCustomEvs.length > 0
                            let currentStringId = `g_${task.id}`

                            if (hasCustom) {
                              // Mapear por índice contabilizando SOLO las tareas que NO SON de tipo 'select'
                              const nonSelectTasksBefore = tasks.slice(0, colIndex).filter((t: any) => {
                                let tInd: any = {}
                                try {
                                  tInd = typeof t.indicador === 'string' ? JSON.parse(t.indicador) : (t.indicador || {})
                                } catch(e) {}
                                return tInd?.type !== 'select'
                              }).length

                              const matchingCustom = studentCustomEvs[nonSelectTasksBefore]
                              if (!matchingCustom) {
                                // Este estudiante no tiene una evidencia personalizada para esta posición de columna no-select
                                return (
                                  <TableCell 
                                    key={task.id} 
                                    align='center' 
                                    padding='none' 
                                    sx={{ 
                                      borderRight: '1px solid #eee', 
                                      bgcolor: isColFocused ? 'rgba(25, 118, 210, 0.12)' : 'warning.50' 
                                    }}
                                  >
                                    <Tooltip title='Sin evidencia personalizada definida para esta posición'>
                                      <Typography variant='caption' color='warning.main' fontSize='0.7rem'>—</Typography>
                                    </Tooltip>
                                  </TableCell>
                                )
                              }
                              
                              // Usamos los datos de la evidencia personalizada para la celda
                              task = { ...task, id: matchingCustom.id, nombre: matchingCustom.evidencia, indicador: matchingCustom.indicador }
                              currentStringId = `c_${matchingCustom.id}`
                            }
                            // Qualitative Cell
                            const currentData = initiativeData[item.student.id]?.[currentStringId] || {
                              escala_detalle_id: '',
                              indicadores_check: {}
                            }

                            // Parse indicator for this specific task/evidence
                            const indicatorData = (task as any).indicador
                            let parsedIndicators = {}
                            try {
                              parsedIndicators =
                                typeof indicatorData === 'string' ? JSON.parse(indicatorData) : indicatorData
                            } catch (e) {}

                            return (
                              <TableCell
                                key={task.id}
                                align='center'
                                padding='none'
                                sx={{ 
                                  borderRight: '1px solid #eee',
                                  bgcolor: isColFocused ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                                  transition: 'background-color 0.2s'
                                }}
                              >
                                <EvidenceCell
                                  studentId={item.student.id}
                                  evidenceId={currentStringId}
                                  evidenceName={task.nombre}
                                  indicators={parsedIndicators}
                                  currentValue={currentData}
                                  scaleValues={scaleValues}
                                  isLocked={isLocked}
                                  isAssigned={isAssigned}
                                  isCustom={hasCustom}
                                  onChange={handleInitiativeChange}
                                  onCopyDown={(studentId, evidenceId) =>
                                    handleCopyDown(studentId, evidenceId, 'initiative', colIndex)
                                  }
                                  onFocus={() => handleFocus(rowIndex, colIndex)}
                                  onBlur={handleBlur}
                                  colIndex={colIndex}
                                />
                              </TableCell>
                            )
                          } else {
                            // Numeric Task Cell
                            const inputId = `grade-input-${rowIndex}-${colIndex}`
                            const hasChanged = pendingChanges.has(`t-${item.student.id}-${task.id}`)
                            const val = taskGradesData[item.student.id]?.[task.id] || ''
                            let isInvalid = false
                            if (val !== '') {
                              const num = parseFloat(val)
                              const max = task.puntaje_maximo || 10
                              if (num < 0 || num > max) isInvalid = true
                            }

                            const status = taskGradeStatuses[item.student.id]?.[task.id] || 'pendiente'
                            const statusConfig: Record<string, { label: string; color: string }> = {
                              pendiente: { label: 'P', color: '#9e9e9e' },
                              entregada: { label: 'E', color: '#2196f3' },
                              revisada: { label: 'R', color: '#4caf50' },
                              no_entregado: { label: 'N', color: '#f44336' }
                            }
                            const currentStatus = statusConfig[status] || statusConfig.pendiente

                            return (
                              <TableCell 
                                key={task.id} 
                                align='center' 
                                padding='none' 
                                sx={{ 
                                  p: 1, 
                                  minWidth: 110,
                                  bgcolor: isColFocused ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                                  transition: 'background-color 0.2s'
                                }}
                              >
                                <TextField
                                  value={val}
                                  onChange={e => handleTaskGradeChange(item.student.id, task.id, e.target.value)}
                                  onFocus={() => handleFocus(rowIndex, colIndex)}
                                  onBlur={handleBlur}
                                  size='small'
                                  type='text'
                                  fullWidth
                                  error={isInvalid}
                                  disabled={isLocked}
                                  placeholder={currentStatus.label}
                                  inputProps={{
                                    maxLength: 5,
                                    style: { textAlign: 'center', padding: '4px 0px', fontSize: '0.75rem' },
                                    id: inputId,
                                    onKeyDown: (e: any) => handleKeyDown(e, rowIndex, colIndex, 't', task.id, val)
                                  }}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position='start' sx={{ ml: 0.5, mr: 0 }}>
                                        <Typography variant='caption' sx={{ fontWeight: 'bold', fontSize: '0.65rem', color: currentStatus.color, opacity: 0.8 }}>
                                          {currentStatus.label}
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                    endAdornment: (
                                      <InputAdornment position='end' sx={{ mr: 0.5 }}>
                                        <IconButton
                                          size='small'
                                          tabIndex={-1}
                                          onClick={() =>
                                            openGradeDetail(
                                              task.id,
                                              item.student.id,
                                              task.nombre,
                                              item.student.nombre_completo
                                            )
                                          }
                                          sx={{ p: 0.2 }}
                                        >
                                          <Visibility sx={{ fontSize: 13, opacity: 0.5 }} />
                                        </IconButton>
                                      </InputAdornment>
                                    )
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      p: 0,
                                      borderLeft: `3px solid ${currentStatus.color}`,
                                      borderRadius: '4px',
                                      bgcolor: isInvalid
                                        ? 'error.lighter'
                                        : hasChanged
                                          ? 'warning.lighter'
                                          : 'transparent',
                                      '& fieldset': {
                                        borderColor: 'rgba(0,0,0,0.1)'
                                      }
                                    },
                                    '& .MuiInputBase-input': {
                                      px: 0.5
                                    }
                                  }}
                                />
                              </TableCell>
                            )
                          }
                        })}

                      {/* Numeric Totals */}
                      {hasTasks &&
                        !isInitiative &&
                        (() => {
                          const { aum, exam, nf, esc } = getTotals(item.student.id)
                          const aumNum = parseFloat(String(aum)) || 0
                          const exceedsMax = notaMaxima && aumNum > notaMaxima
                          return (
                            <>
                              <TableCell
                                align='center'
                                sx={{
                                  bgcolor: exceedsMax ? 'error.light' : 'grey.50',
                                  color: exceedsMax ? 'error.contrastText' : 'inherit'
                                }}
                              >
                                <Typography variant='caption' fontWeight={exceedsMax ? 'bold' : 'normal'}>
                                  {aum}
                                  {exceedsMax && ` ⚠️`}
                                </Typography>
                              </TableCell>
                              <TableCell align='center' sx={{ bgcolor: 'grey.50' }}>
                                <Typography variant='caption'>{exam}</Typography>
                              </TableCell>
                              <TableCell align='center' sx={{ bgcolor: 'primary.50' }}>
                                <Typography variant='body2' fontWeight='bold'>
                                  {nf}
                                </Typography>
                              </TableCell>
                              <TableCell align='center' sx={{ bgcolor: 'primary.50' }}>
                                <Typography variant='body2' fontWeight='bold'>
                                  {esc}
                                </Typography>
                              </TableCell>
                            </>
                          )
                        })()}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box display='flex' justifyContent='center' my={8}>
              <Typography color='text.secondary'>Seleccione un corte.</Typography>
            </Box>
          )}
        </>
      )}

      {/* Floating Save Footer */}
      {pendingChanges.size > 0 && !isLocked && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            px: 4,
            py: 1.5,
            borderRadius: 8,
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant='body2' fontWeight='500' sx={{ color: 'text.primary' }}>
            Tienes{' '}
            <Box component='span' fontWeight='bold' color='primary.main'>
              {pendingChanges.size}
            </Box>{' '}
            cambios sin guardar
          </Typography>
          <Button
            variant='contained'
            onClick={handleBatchSave}
            disabled={savingDocs}
            size='small'
            sx={{
              fontWeight: 'bold',
              borderRadius: 6,
              px: 3,
              textTransform: 'none'
            }}
          >
            {savingDocs ? <CircularProgress size={16} color='inherit' /> : 'Guardar'}
          </Button>
        </Paper>
      )}

      {/* Task Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{ elevation: 3 }}
      >
        <MenuItem onClick={handleMarkAsReviewed} disabled={isLocked}>
          <CheckCircle fontSize='small' sx={{ mr: 1, color: isLocked ? 'text.disabled' : 'success.main' }} /> Marcar
          todas revisadas
        </MenuItem>

        <MenuItem onClick={handleMarkAsNotDelivered} disabled={isLocked}>
          <HighlightOff fontSize='small' sx={{ mr: 1, color: isLocked ? 'text.disabled' : 'error.main' }} /> Marcar
          todas No Entregado
        </MenuItem>

        {/* Divider and Edit/Delete are only shown if NOT locked */}
        {!isLocked && <Divider />}
        {!isLocked && (
          <MenuItem
            onClick={() => {
              if (menuTaskId) {
                const t = tasks.find(t => t.id === menuTaskId)
                if (t) {
                  setEditingTask(t)
                  setShowTaskModal(true)
                }
              }
              handleCloseMenu()
            }}
          >
            <Edit fontSize='small' sx={{ mr: 1, color: 'text.secondary' }} /> Editar
          </MenuItem>
        )}
        {!isLocked && (
          <MenuItem
            onClick={() => {
              if (menuTaskId) {
                // Trigger existing delete handler
                handleDeleteTask(menuTaskId)
              }
              handleCloseMenu()
            }}
          >
            <Delete fontSize='small' sx={{ mr: 1, color: 'error.main' }} />
            <Typography color='error'>Eliminar</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Task Form Modal */}
      {showTaskModal && (
        <TaskFormModal
          open={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSuccess={fetchGrades}
          assignmentId={assignmentId}
          corteId={Number(selectedCorte)}
          taskToEdit={editingTask}
          isInitiative={isInitiative}
          evidences={evidences} // Pass EVIDENCES for initiative selection
          students={students} // Pass STUDENTS for assignment
        />
      )}

      {/* Grade Detail Modal */}
      {selectedDetail && (
        <GradeDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onSuccess={fetchGrades}
          taskId={selectedDetail.taskId}
          studentId={selectedDetail.studentId}
          taskName={selectedDetail.taskName}
          studentName={selectedDetail.studentName}
          isLocked={isLocked}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar esta tarea? Se perderán todas las notas asociadas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color='inherit' disabled={isDeleting}>
            Cancelar
          </Button>
          <Button onClick={confirmDeleteTask} color='error' variant='contained' autoFocus disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={24} color='inherit' /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <StudentProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} student={profileStudent} />

      {/* Modal Evidencias Personalizadas – Estudiante Especial */}
      {evidenciasModalOpen && asignaturaGradoCorteId && (
        <StudentEvidencesModal
          open={evidenciasModalOpen}
          onClose={() => setEvidenciasModalOpen(false)}
          studentId={evidenciasStudent?.id || null}
          studentName={evidenciasStudent?.name || null}
          allStudents={students.map((s: any) => ({ id: s.student.id, name: s.student.nombre_completo }))}
          asignaturaGradoCorteId={asignaturaGradoCorteId}
          isLocked={isLocked}
          onChanged={fetchGrades}
          globalEvidences={tasks.filter((t: any) => {
            try {
              const baseInd = typeof t.indicador === 'string' ? JSON.parse(t.indicador) : (t.indicador || {})
              return baseInd?.type !== 'select'
            } catch (e) {
              return true
            }
          })}
        />
      )}
    </Box>
  )
}

export default GradesTab
