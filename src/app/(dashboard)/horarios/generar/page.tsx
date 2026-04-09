'use client'

import ConfirmDialog from '@/components/ConfirmDialog'
import LoadingBackdrop from '@/components/LoadingBackdrop'
import ScheduleService, { DocenteDisponibilidad, HorarioClase } from '@/services/scheduleService'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import {
    Alert,
    Box,
    Button,
    Card,
    CardHeader,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import ClassroomSelectorDialog from './ClassroomSelectorDialog'
import GenerationDialog from './GenerationDialog'
import ManualEntryDialog from './ManualEntryDialog'
import ScheduleGridPainter from './ScheduleGridPainter'
import SubjectPalette from './SubjectPalette'

const normalizeTime = (time?: string) => {
    if (!time) return null
    return time.slice(0, 5) // HH:mm:ss -> HH:mm
}

const ScheduleGeneratorPage = () => {
    // Data States
    const [periodos, setPeriodos] = useState<any[]>([])
    const [turnos, setTurnos] = useState<any[]>([])
    const [grupos, setGrupos] = useState<any[]>([])
    
    // Selection States
    const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
    const [selectedTurno, setSelectedTurno] = useState<number | ''>('')
    const [selectedGrupo, setSelectedGrupo] = useState<number | ''>('')
    
    // Painter State
    const [groupAssignments, setGroupAssignments] = useState<any[]>([])
    const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null)
    
    // Grid Data
    const [scheduleData, setScheduleData] = useState<HorarioClase[]>([])
    
    // Delete Confirmation State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [blockToDelete, setBlockToDelete] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)
    
    // Cleanup States
    const [confirmClearOpen, setConfirmClearOpen] = useState(false)
    const [clearAll, setClearAll] = useState(false)
    
    // AI Generation States
    const [openAIDialog, setOpenAIDialog] = useState(false)
    const [generatingAI, setGeneratingAI] = useState(false)

    // Manual Generation States
    const [generateModalOpen, setGenerateModalOpen] = useState(false)
    const [generateStartTime, setGenerateStartTime] = useState('07:00')
    const [generating, setGenerating] = useState(false)
    
    // Error & Overwrite States
    const [errorModalOpen, setErrorModalOpen] = useState(false)
    const [validationMessage, setValidationMessage] = useState('')
    const [overwriteModalOpen, setOverwriteModalOpen] = useState(false)
    const [blockToOverwrite, setBlockToOverwrite] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Dialog States
    const [flexibleEntryOpen, setFlexibleEntryOpen] = useState(false)
    const [editingClass, setEditingClass] = useState<HorarioClase | undefined>(undefined)
    const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
    const [showContinuityGaps, setShowContinuityGaps] = useState(false)
    
    // Classroom Selection State
    const [classroomDialog, setClassroomDialog] = useState<{
        isOpen: boolean
        dia: number
        bloqueId: number
        pendingData: any | null
    }>({
        isOpen: false,
        dia: 0,
        bloqueId: 0,
        pendingData: null
    })

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [pers, turns] = await Promise.all([
                    ScheduleService.getPeriodos(),
                    ScheduleService.getTurnos()
                ])
                setPeriodos(pers)
                setTurnos(turns)
                if (pers.length > 0) setSelectedPeriodo(pers[0].id)
                if (turns.length > 0) setSelectedTurno(turns[0].id)
            } catch (error) {
                console.error(error)
                toast.error('Error cargando filtros')
            }
        }
        loadInitialData()
    }, [])

    // Load Groups when Periodo/Turno matches (or just Periodo)
    useEffect(() => {
        if (selectedPeriodo) {
            loadGrupos()
        }
    }, [selectedPeriodo])

    const loadGrupos = async () => {
        try {
            const res = await ScheduleService.getGrupos(Number(selectedPeriodo))
            setGrupos(res)
        } catch (error) {
            console.error(error)
        }
    }

    // Load Schedule when Periodo/Turno OR Group changes
    useEffect(() => {
        if (selectedPeriodo && selectedTurno) {
            loadSchedule()
        }
    }, [selectedPeriodo, selectedTurno, selectedGrupo])

    // Load Assignments when Grupo changes
    useEffect(() => {
        if (selectedGrupo) {
            loadGroupAssignments()
            setActiveSubjectId(null)
        } else {
            setGroupAssignments([])
        }
    }, [selectedGrupo]) 

    const loadGroupAssignments = async () => {
        try {
            const data = await ScheduleService.getGroupAssignments(Number(selectedGrupo))
            setGroupAssignments(data)
        } catch (error) {
            console.error(error)
            toast.error('Error cargando asignaturas del grupo')
        }
    }

    // Active Teacher Logic
    const activeSubjectAssignment = groupAssignments.find(a => a.asignatura_grado_id === activeSubjectId)
    const activeTeacherId = activeSubjectAssignment?.docente_id
    const [activeTeacherAvailability, setActiveTeacherAvailability] = useState<DocenteDisponibilidad[]>([])
    const [activeTeacherOccupation, setActiveTeacherOccupation] = useState<HorarioClase[]>([])

    useEffect(() => {
        const fetchAvailability = async () => {
            if (activeTeacherId && selectedPeriodo) {
                try {
                    const [avail, occupation] = await Promise.all([
                        ScheduleService.getDisponibilidad(activeTeacherId),
                        ScheduleService.getTeacherOccupation(activeTeacherId, Number(selectedPeriodo))
                    ])
                    setActiveTeacherAvailability(avail)
                    setActiveTeacherOccupation(occupation)
                } catch (error) {
                    console.error('Error fetching availability', error)
                }
            } else {
                setActiveTeacherAvailability([])
                setActiveTeacherOccupation([])
            }
        }
        fetchAvailability()
    }, [activeTeacherId, selectedPeriodo])

    const loadSchedule = async () => {
        setLoading(true)
        try {
            const data = await ScheduleService.getSchedule({
                periodo_lectivo_id: Number(selectedPeriodo)
            })
            setScheduleData(data)
        } catch (error) {
            console.error(error)
            toast.error('Error cargando horario')
        } finally {
            setLoading(false)
        }
    }

    // Interaction Handlers
    
    const handleDeleteBlock = (id: number) => {
        setBlockToDelete(id)
        setDeleteModalOpen(true)
    }

    const getErrorMessage = (error: any) => {
        const body = error.data || (error.response && error.response.data) || {}
        const errors = body.errors || error.validationErrors || error.errors
        
        if (errors) {
            if (Array.isArray(errors) && errors.length > 0) return errors.join(' | ')
            if (typeof errors === 'object' && errors !== null && Object.keys(errors).length > 0) {
                return Object.values(errors).flat().filter(v => typeof v === 'string').join(' | ')
            }
        }
        return body.message || error.message || error.statusText || 'Error desconocido'
    }

    const showError = (error: any) => {
        const msg = getErrorMessage(error)
        setValidationMessage(msg)
        setErrorModalOpen(true)
        toast.error(msg)
    }

    const handleConfirmDelete = async () => {
        if (!blockToDelete) return
        setDeleting(true)
        try {
            await ScheduleService.deleteBlock(blockToDelete)
            toast.success('Asignación eliminada')
            loadSchedule()
        } catch (error: any) {
            showError(error)
        } finally {
            setDeleting(false)
            setDeleteModalOpen(false)
            setBlockToDelete(null)
        }
    }

    const handleCellClick = async (dia: number, currentClasses: HorarioClase[]) => {
        if (!selectedGrupo) {
            return toast.warning('Seleccione un grupo para editar')
        }

        let newInitialData: any = undefined

        if (currentClasses && currentClasses.length > 0) {
            newInitialData = { ...currentClasses[0] }
        } else {
            // New Entry Logic (Suggested Times)
            const assignment = activeSubjectId 
                ? groupAssignments.find(a => a.asignatura_grado_id === activeSubjectId)
                : null
            
            newInitialData = {
                grupo_id: Number(selectedGrupo),
                asignatura_grado_id: activeSubjectId || null,
                docente_id: assignment?.docente_id || null,
            }

            // Find last class of the day to suggest start time
            const dayClasses = scheduleData
               .filter(c => c.dia_semana === dia && c.grupo_id === Number(selectedGrupo))
               .sort((a, b) => (a.hora_fin_real || '').localeCompare(b.hora_fin_real || ''))
            
            const lastClass = dayClasses[dayClasses.length - 1]
            let startStr = '07:00'
            
            if (lastClass && lastClass.hora_fin_real) {
                startStr = lastClass.hora_fin_real.slice(0, 5)
            }
            
            // Duration: use assignment minutes or default to 45
            const durationMinutes = (assignment && assignment.minutos > 0) ? assignment.minutos : 45
            
            try {
               const [h, m] = startStr.split(':').map(Number)
               const date = new Date()
               date.setHours(h, m, 0, 0)
               date.setMinutes(date.getMinutes() + durationMinutes)
               
               const endH = date.getHours().toString().padStart(2, '0')
               const endM = date.getMinutes().toString().padStart(2, '0')
               const endStr = `${endH}:${endM}`

               newInitialData.hora_inicio_real = startStr
               newInitialData.hora_fin_real = endStr
            } catch (e) {
                console.error("Error calculating time", e)
            }
        }

        setEditingClass(newInitialData)
        setSelectedDay(dia)
        setFlexibleEntryOpen(true)
    }

    const handleConfirmOverwrite = async () => {
        if (!blockToOverwrite) return
        try {
            const normalized = {
                ...blockToOverwrite,
                hora_inicio_real: normalizeTime(blockToOverwrite.hora_inicio_real),
                hora_fin_real: normalizeTime(blockToOverwrite.hora_fin_real)
            }
            await ScheduleService.saveBlock(normalized)
            toast.success('Clase actualizada')
            loadSchedule()
        } catch (error: any) {
            showError(error)
        } finally {
            setOverwriteModalOpen(false)
            setBlockToOverwrite(null)
        }
    }

    const handleClassroomSelect = async (aulaId: number, startTime?: string, endTime?: string) => {
        if (!classroomDialog.pendingData) return

        const finalData = {
            ...classroomDialog.pendingData,
            aula_id: aulaId,
            hora_inicio_real: normalizeTime(startTime || classroomDialog.pendingData.hora_inicio_real),
            hora_fin_real: normalizeTime(endTime || classroomDialog.pendingData.hora_fin_real)
        }

        try {
            await ScheduleService.saveBlock(finalData)
            toast.success('Clase asignada con aula')
            loadSchedule()
        } catch (error: any) {
            showError(error)
        } finally {
             setClassroomDialog(prev => ({ ...prev, isOpen: false, pendingData: null }))
        }
    }

    const handleManualSave = async (data: any) => {
        try {
            const normalized = {
                ...data,
                hora_inicio_real: normalizeTime(data.hora_inicio_real),
                hora_fin_real: normalizeTime(data.hora_fin_real)
            }
            await ScheduleService.saveBlock(normalized)
            toast.success('Clase asignada manualmente')
            loadSchedule()
        } catch (error: any) {
            showError(error)
        }
    }

    const handleGenerateAI = () => {
        if (!selectedPeriodo || !selectedTurno) {
            toast.warning('Seleccione periodo y turno')
            return
        }
        setOpenAIDialog(true)
    }

    const onSubmitGenerateAI = async (config: {
        dailyConfig: any, 
        additionalInstructions: string, 
        recessMinutes: number,
        subjectDuration: number 
    }) => {
        setOpenAIDialog(false)
        setGeneratingAI(true)
        try {
            const res = await ScheduleService.generateWithAISchedule(
                Number(selectedPeriodo),
                Number(selectedTurno),
                selectedGrupo ? Number(selectedGrupo) : undefined,
                config.dailyConfig,
                config.additionalInstructions,
                config.recessMinutes,
                config.subjectDuration
            )
            
            if (res.status === 'success') {
                toast.success(res.message)
                loadSchedule()
            } else {
                toast.error(res.message || 'Error en la IA')
            }
        } catch (error: any) {
            showError(error)
        } finally {
            setGeneratingAI(false)
        }
    }

    const onSubmitGenerateStandard = async (config: { dailyConfig: any, recessMinutes: number, subjectDuration: number }) => {
        setGenerateModalOpen(false)
        setGenerating(true)
        try {
            await ScheduleService.generateSchedule(
                Number(selectedPeriodo),
                Number(selectedTurno),
                selectedGrupo ? Number(selectedGrupo) : undefined,
                config.dailyConfig,
                config.recessMinutes,
                config.subjectDuration
            )
            toast.success('Horario generado correctamente')
            loadSchedule()
        } catch (error: any) {
            showError(error)
        } finally {
            setGenerating(false)
        }
    }

    const handleClearClick = (type: 'all' | 'group') => {
        if (!selectedPeriodo) {
            toast.warning('Seleccione un periodo lectivo')
            return
        }
        setClearAll(type === 'all')
        setConfirmClearOpen(true)
    }

    const handleConfirmClear = async () => {
        setConfirmClearOpen(false)
        setLoading(true)
        try {
            const res = await ScheduleService.clearSchedule(
                Number(selectedPeriodo),
                clearAll ? undefined : Number(selectedGrupo)
            )
            toast.success(res.message || 'Horario limpiado')
            loadSchedule()
        } catch (error: any) {
            showError(error)
        } finally {
            setLoading(false)
        }
    }

    const recalculateDayTimes = (clases: HorarioClase[]) => {
        if (clases.length === 0) return []
        
        let currentStartTime = '07:00'
        // Ideally we pick the start time of the first class if it exists and we want to preserve it,
        // but the user wants "todo el tiempo seguido" starting from somewhere. 
        // Let's use the first class's start time as the base for the day.
        if (clases[0].hora_inicio_real) {
            currentStartTime = clases[0].hora_inicio_real.slice(0, 5)
        }

        return clases.map(c => {
            const [h, m] = currentStartTime.split(':').map(Number)
            const date = new Date()
            date.setHours(h, m, 0, 0)
            
            // Duration logic
            const assignment = groupAssignments.find(a => a.asignatura_grado_id === c.asignatura_grado_id)
            // @ts-ignore - 'minutos' might be in the object if from backend
            const duration = c.minutos || assignment?.minutos || 45
            
            date.setMinutes(date.getMinutes() + duration)
            
            const startStr = currentStartTime
            const endH = date.getHours().toString().padStart(2, '0')
            const endM = date.getMinutes().toString().padStart(2, '0')
            const endStr = `${endH}:${endM}`
            
            currentStartTime = endStr // Nex class starts when this ends (contiguous)
            
            return {
                ...c,
                hora_inicio_real: startStr,
                hora_fin_real: endStr
            }
        })
    }

    const handleDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result

        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const sourceDay = Number(source.droppableId)
        const destDay = Number(destination.droppableId)

        // Clone current state
        let newSchedule = [...scheduleData]
        const groupSchedule = newSchedule.filter(c => c.grupo_id === Number(selectedGrupo))
        const otherGroupsSchedule = newSchedule.filter(c => c.grupo_id !== Number(selectedGrupo))

        // Get classes for source and dest days within this group
        const sourceClasses = groupSchedule
            .filter(c => c.dia_semana === sourceDay)
            .sort((a, b) => (a.hora_inicio_real || '').localeCompare(b.hora_inicio_real || ''))
            
        const destClasses = sourceDay === destDay 
            ? sourceClasses 
            : groupSchedule
                .filter(c => c.dia_semana === destDay)
                .sort((a, b) => (a.hora_inicio_real || '').localeCompare(b.hora_inicio_real || ''))

        // Remove from source
        const [movedBlock] = sourceClasses.splice(source.index, 1)
        movedBlock.dia_semana = destDay // Update day if changed

        // Add to destination
        destClasses.splice(destination.index, 0, movedBlock)

        // Recalculate times
        const updatedSourceDay = recalculateDayTimes(sourceClasses)
        const updatedDestDay = sourceDay === destDay ? updatedSourceDay : recalculateDayTimes(destClasses)

        // Merge back
        const updatedGroupSchedule = [
            ...groupSchedule.filter(c => c.dia_semana !== sourceDay && c.dia_semana !== destDay),
            ...updatedSourceDay,
            ...(sourceDay !== destDay ? updatedDestDay : [])
        ]

        const finalSchedule = [...otherGroupsSchedule, ...updatedGroupSchedule]
        setScheduleData(finalSchedule)

        // Save to backend
        try {
            const blocksToUpdate = [...updatedSourceDay, ...updatedDestDay].map(b => ({
                id: b.id!,
                dia_semana: b.dia_semana,
                hora_inicio_real: b.hora_inicio_real!,
                hora_fin_real: b.hora_fin_real!
            }))

            await ScheduleService.bulkUpdateSchedule(blocksToUpdate)
            toast.success('Horario reordenado correctamente')
        } catch (error: any) {
            showError(error)
            loadSchedule() // Rollback on error
        }
    }

    return (
        <Card sx={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <CardHeader 
                title="Generador de Horarios (Modo Flexible)"
                sx={{ pb: 1 }}
                action={
                    <Stack direction="row" spacing={2}>
                        <Button
                             variant="outlined"
                             size="small"
                             color="primary"
                             onClick={() => setGenerateModalOpen(true)}
                             disabled={!selectedPeriodo || !selectedTurno}
                        >
                            {selectedGrupo ? 'Generar Grupo' : 'Generar Todo'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            startIcon={generatingAI ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                            onClick={handleGenerateAI}
                            disabled={!selectedPeriodo || !selectedTurno || generatingAI}
                            sx={{ fontWeight: 'bold' }}
                        >
                            {generatingAI ? 'IA Pensando...' : 'Generar con IA (Smart)'}
                        </Button>
                        <Button
                            variant="outlined" 
                            color="error" 
                            size="small"
                            startIcon={<DeleteSweepIcon />}
                            onClick={() => handleClearClick(selectedGrupo ? 'group' : 'all')}
                            disabled={!selectedPeriodo || loading}
                        >
                            {selectedGrupo ? 'Limpiar Grupo' : 'Limpiar Todo'}
                        </Button>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant={showContinuityGaps ? "contained" : "outlined"}
                                color={showContinuityGaps ? "error" : "primary"}
                                startIcon={<AutoAwesomeIcon sx={{ transform: showContinuityGaps ? 'rotate(180deg)' : 'none' }} />}
                                onClick={() => setShowContinuityGaps(!showContinuityGaps)}
                                size="small"
                                title="Resaltar huecos de tiempo"
                            >
                                {showContinuityGaps ? "Ocultar Huecos" : "Ver Huecos"}
                            </Button>
                        </Stack>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setFlexibleEntryOpen(true)}
                            disabled={!selectedPeriodo}
                        >
                            Agregar Clase Manual
                        </Button>
                    </Stack>
                }
            />

            {loading && <LoadingBackdrop open={true} />}

            <ConfirmDialog
                open={confirmClearOpen}
                onClose={() => setConfirmClearOpen(false)}
                onConfirm={handleConfirmClear}
                color="error"
                title={clearAll ? '¿Limpiar Todo el Horario?' : '¿Limpiar Horario del Grupo?'}
                message={`Esta acción eliminará todos los bloques de horario ${clearAll ? 'de este periodo' : 'de este grupo'} que no estén marcados como fijos. ¿Deseas continuar?`}
            />

            <GenerationDialog
                open={openAIDialog}
                title="Configuración de Generación Inteligente (IA)"
                isAI={true}
                onClose={() => setOpenAIDialog(false)}
                onGenerate={onSubmitGenerateAI}
                loading={generatingAI}
            />

            <Box sx={{ px: 3, pb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Periodo Lectivo</InputLabel>
                            <Select value={selectedPeriodo} label="Periodo Lectivo" onChange={e => setSelectedPeriodo(Number(e.target.value))}>
                                {periodos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Turno</InputLabel>
                            <Select value={selectedTurno} label="Turno" onChange={e => setSelectedTurno(Number(e.target.value))}>
                                {turnos.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" error={!selectedGrupo}>
                            <InputLabel>Grupo (Seleccione para editar)</InputLabel>
                            <Select
                                value={selectedGrupo}
                                label="Grupo (Seleccione para editar)"
                                onChange={e => setSelectedGrupo(Number(e.target.value))}
                                disabled={!selectedPeriodo}
                            >
                                <MenuItem value=""><em>-- Seleccionar Grupo --</em></MenuItem>
                                {grupos.filter(g => !selectedTurno || g.turno_id === Number(selectedTurno)).map(g => (
                                    <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            <Divider />

            <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Grid item xs={12} md={9} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2 }}>
                    {!selectedGrupo && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Seleccione un <strong>Grupo</strong> arriba para activar el modo de edición.
                        </Alert>
                    )}

                    <ScheduleGridPainter
                        scheduleData={selectedGrupo ? scheduleData.filter(c => c.grupo_id === Number(selectedGrupo)) : []}
                        activeSubjectId={activeSubjectId}
                        activeTeacherId={activeTeacherId}
                        teacherAvailability={activeTeacherAvailability}
                        teacherOccupation={activeTeacherOccupation}
                        allScheduleData={scheduleData}
                        onCellClick={handleCellClick}
                        onDelete={handleDeleteBlock}
                        showContinuityGaps={showContinuityGaps}
                        onDragEnd={handleDragEnd}
                    />
                </Grid>

                <Grid item xs={12} md={3} sx={{ height: '100%', borderLeft: '1px solid rgba(0,0,0,0.12)', bgcolor: 'background.default' }}>
                    <Box sx={{ p: 2, height: '100%' }}>
                        {selectedGrupo ? (
                            <SubjectPalette 
                                assignments={groupAssignments}
                                scheduleData={scheduleData.filter(c => c.grupo_id === Number(selectedGrupo))}
                                activeSubjectId={activeSubjectId}
                                onSelectSubject={setActiveSubjectId}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 4 }}>
                                Seleccione un grupo para ver sus materias disponibles.
                            </Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* Modals */}
            <Dialog 
                open={deleteModalOpen} 
                onClose={() => !deleting && setDeleteModalOpen(false)}
            >
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que desea eliminar esta asignación del horario? 
                        Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        color="error" 
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting && <CircularProgress size={20} color="inherit" />}
                    >
                        {deleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={errorModalOpen} 
                onClose={() => setErrorModalOpen(false)}
            >
                <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
                    Conflicto Detectado
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography>{validationMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setErrorModalOpen(false)} variant="contained">
                        Entendido
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={overwriteModalOpen}
                onClose={() => setOverwriteModalOpen(false)}
            >
                <DialogTitle sx={{ bgcolor: 'warning.main', color: 'black' }}>
                    Confirmar Sobrescritura
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                   <Typography>¿Está seguro de que desea reemplazar la clase existente en este bloque?</Typography>
                   <Typography variant="caption" color="text.secondary">
                       La asignación anterior se perderá permanentemente.
                   </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOverwriteModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmOverwrite} variant="contained" color="warning">
                        Sobrescribir
                    </Button>
                </DialogActions>
            </Dialog>

            <GenerationDialog
                open={generateModalOpen}
                title="Generar Horario Automático (Estándar)"
                isAI={false}
                onClose={() => setGenerateModalOpen(false)}
                onGenerate={onSubmitGenerateStandard}
                loading={generating}
            />

            <ManualEntryDialog
                open={flexibleEntryOpen}
                onClose={() => {
                    setFlexibleEntryOpen(false)
                    setEditingClass(undefined)
                    setSelectedDay(undefined)
                }}
                onSave={handleManualSave}
                periodoId={Number(selectedPeriodo)}
                defaultGroupId={selectedGrupo ? Number(selectedGrupo) : undefined}
                dia={selectedDay}
                initialData={editingClass}
            />

            {classroomDialog.isOpen && (
                <ClassroomSelectorDialog 
                    open={classroomDialog.isOpen}
                    onClose={() => setClassroomDialog(prev => ({ ...prev, isOpen: false }))}
                    onSelect={handleClassroomSelect}
                    currentDay={classroomDialog.dia}
                    currentBlockId={classroomDialog.bloqueId}
                    initialStartTime={classroomDialog.pendingData?.hora_inicio_real}
                    initialEndTime={classroomDialog.pendingData?.hora_fin_real}
                    scheduleData={scheduleData.filter(c => c.periodo_lectivo_id === Number(selectedPeriodo))}
                    title="Seleccionar Aula para la Clase"
                />
            )}
        </Card>
    )
}

export default ScheduleGeneratorPage
