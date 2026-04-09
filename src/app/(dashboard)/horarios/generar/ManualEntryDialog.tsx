import ScheduleService, { ConfigAula } from '@/services/scheduleService'
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

interface ManualEntryDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    periodoId: number
    dia?: number
    initialData?: any // For editing in future
    defaultGroupId?: number
}

const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
    open,
    onClose,
    onSave,
    periodoId,
    dia,
    initialData,
    defaultGroupId
}) => {
    // ... (state)

    // Form State
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Options
    const [grupos, setGrupos] = useState<any[]>([])
    const [asignaturas, setAsignaturas] = useState<any[]>([])
    const [docentes, setDocentes] = useState<any[]>([])
    const [aulas, setAulas] = useState<ConfigAula[]>([])
    // Cache de asignaciones docente-materia para el grupo seleccionado
    const [docenteAssignments, setDocenteAssignments] = useState<any[]>([])

    // Form State
    const [isCustomActivity, setIsCustomActivity] = useState(false)
    const [esSimultanea, setEsSimultanea] = useState(false)
    const [grupoId, setGrupoId] = useState<number | ''>('')
    const [asignaturaId, setAsignaturaId] = useState<number | ''>('')
    const [docenteId, setDocenteId] = useState<number | ''>('')
    const [aulaId, setAulaId] = useState<number | ''>('')
    const [customTitle, setCustomTitle] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    
    // New: Day Selection state (if not passed in props)
    // New: Multi-Day Selection state
    const [selectedDias, setSelectedDias] = useState<number[]>([1])

    useEffect(() => {
        if (open) {
            loadOptions()
            resetForm()
        }
    }, [open, periodoId])

    const resetForm = () => {
        if (initialData) {
            setIsCustomActivity(!!initialData.titulo_personalizado)
            setEsSimultanea(initialData.es_simultanea || false)
            setGrupoId(initialData.grupo_id || '')
            setAsignaturaId(initialData.asignatura_grado_id || '')
            setDocenteId(initialData.docente_id || '')
            setAulaId(initialData.aula_id || '')
            setCustomTitle(initialData.titulo_personalizado || '')
            setStartTime(initialData.hora_inicio_real || '')
            setEndTime(initialData.hora_fin_real || '')
            setEndTime(initialData.hora_fin_real || '')
            // If editing, select the day of the class
            setSelectedDias([dia || initialData.dia_semana || 1])
        } else {
            setIsCustomActivity(false)
            setEsSimultanea(false)
            setGrupoId(defaultGroupId || '') // Initialize with default group
            setAsignaturaId('')
            setDocenteId('')
            setAulaId('')
            setCustomTitle('')
            setStartTime(initialData?.hora_inicio_real || '')
            setEndTime(initialData?.hora_fin_real || '')
            setAsignaturas([])
            // If prop `dia` is provided, pre-select it. Otherwise default to Lunes.
            setSelectedDias(dia ? [dia] : [1])
        }
    }

    const loadOptions = async () => {
        setLoading(true)
        try {
            const [grps, docs, slas] = await Promise.all([
                ScheduleService.getGrupos(periodoId),
                ScheduleService.getDocentes(),
                ScheduleService.getAulas({ activa: true })
            ])
            setGrupos(grps)
            setDocentes(docs)
            setAulas(slas)
        } catch (error) {
            console.error(error)
            toast.error('Error cargando opciones')
        } finally {
            setLoading(false)
        }
    }

    // Load assignments when group changes
    useEffect(() => {
        if (grupoId && !isCustomActivity) {
            const grupo = grupos.find(g => g.id === grupoId)
            // Fix: Check for grado_id first (common convention in this app) then config_grado_id
            const gradoId = grupo?.grado_id || grupo?.config_grado_id
            
            if (gradoId) {
                loadAsignaturas(gradoId)
            }
            loadDocenteAssignments(Number(grupoId))
        } else {
            setAsignaturas([])
            setDocenteAssignments([])
        }
    }, [grupoId, isCustomActivity, grupos])

    const loadDocenteAssignments = async (gid: number) => {
        try {
            const data = await ScheduleService.getGroupAssignments(gid)
            setDocenteAssignments(data)
        } catch (error) {
            console.error(error)
        }
    }

    // Auto-select docente when asignatura changes
    useEffect(() => {
        if (asignaturaId && !isCustomActivity) {
            const assignment = docenteAssignments.find(a => a.asignatura_grado_id === asignaturaId)
            if (assignment && assignment.docente_id) {
                setDocenteId(assignment.docente_id)
            } else {
                setDocenteId('') 
            }
        }
    }, [asignaturaId, docenteAssignments, isCustomActivity])

    const loadAsignaturas = async (gradoId: number) => {
        try {
            const asm = await ScheduleService.getAsignaturas(periodoId, gradoId)
            setAsignaturas(asm)
        } catch (error) {
            console.error(error)
            toast.error('Error cargando asignaturas')
        }
    }
    
    // ...

    const handleSubmit = async () => {
        // Enforce Grupo ID always, as backend requires it
        if (!grupoId) {
            return toast.warning('Debe seleccionar un grupo')
        }

        if (isCustomActivity) {
             if (!customTitle) {
                return toast.warning('Debe ingresar un título para la actividad personalizada')
             }
             // Allow custom activities without teacher (e.g. Recess)
             /* 
             if (!docenteId) {
                return toast.warning('Debe seleccionar un docente')
             } 
             */
        } else {
            if (!asignaturaId && !customTitle) {
                return toast.warning('Debe seleccionar una asignatura o escribir un título')
            }
        }

    // Si NO hay bloque ID (Flexible), Start y End son requeridos
        // Always required now since blockId doesn't exist
        if (!startTime || !endTime) {
            return toast.warning('Debe indicar Hora Inicio y Fin')
        }

        if (selectedDias.length === 0) {
            return toast.warning('Debe seleccionar al menos un día')
        }

        // We handle the save loop below, so we construct the Base Data here
        // But we actually do it inside the try/catch block now.


        setSaving(true)
        try {
            // Iterate over all selected days and save each one
            // We use Promise.all to run them concurrently (or sequentially if preferred)
            // Note: If initialData exists (Edit Mode), we have to be careful.
            // If user selects multiple days during edit, strictly speaking we are cloning/moving.
            // BUT initialData has an ID. We can only update ONE record with that ID.
            // Strategy:
            // 1. If editing (initialData.id exists):
            //    - Find the day that matches initialData.dia_semana. update that record.
            //    - For other days, CREATE new records.
            //    - If original day is NOT selected, we effectively "move" it? 
            //      (Actually we update the original record to one of the new days, and create others?)
            //      Let's keep it simple: If editing, we treat it as create new for extra days.
            //      If original day is unchecked, we should probably update the ID to the new day (Move).
            
            const originalDay = initialData?.dia_semana
            const originalId = initialData?.id

            const promises = selectedDias.map(d => {
                let idToUse = null
                
                // If this is the original day, use the original ID (Update)
                if (originalId && d === originalDay) {
                    idToUse = originalId
                }
                // If original day was unchecked, and this is the FIRST of the selected days, maybe we use the ID? 
                // (Move logic). But keeping it simple: Update if match, Create if new.
                
                 const payload = {
                    id: idToUse, // Include ID if updating
                    periodo_lectivo_id: periodoId,
                    dia_semana: d,
                    bloque_horario_id: null,
                    grupo_id: grupoId || null,
                    asignatura_grado_id: isCustomActivity ? null : (asignaturaId || null),
                    docente_id: docenteId || null,
                    aula_id: aulaId || null,
                    titulo_personalizado: customTitle || null,
                    hora_inicio_real: startTime ? startTime.slice(0, 5) : null,
                    hora_fin_real: endTime ? endTime.slice(0, 5) : null,
                    is_fijo: true, 
                    es_simultanea: esSimultanea
                }
                return onSave(payload)
            })

            await Promise.all(promises)
            
            onClose()
        } catch (error: any) {
            console.error(error)
            // Robust error message extraction
            const body = error.data || error.response?.data || {}
            const errors = body.errors || error.validationErrors
            let msg = body.message || error.message || 'Error al guardar'
            
            if (errors) {
                if (Array.isArray(errors)) msg = errors.join(' | ')
                else if (typeof errors === 'object') msg = Object.values(errors).flat().join(' | ')
            }
            toast.error(msg)
        } finally {
            setSaving(false)
        }
    }

    const diasSemana = [
        { id: 1, nombre: 'Lunes' },
        { id: 2, nombre: 'Martes' },
        { id: 3, nombre: 'Miércoles' },
        { id: 4, nombre: 'Jueves' },
        { id: 5, nombre: 'Viernes' },
        { id: 6, nombre: 'Sábado' },
        { id: 7, nombre: 'Domingo' }
    ];

    const showDaySelector = true; 

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Agregar Clase Manual</DialogTitle>
            <DialogContent dividers>
                {loading ? <CircularProgress /> : (
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        
                        {/* Day Selector */}

                        {showDaySelector && (
                             <Grid item xs={12}>
                                <InputLabel shrink>Días de la Semana</InputLabel>
                                <FormGroup row>
                                    {diasSemana.map(d => (
                                        <FormControlLabel
                                            key={d.id}
                                            control={
                                                <Checkbox
                                                    checked={selectedDias.includes(d.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked
                                                        setSelectedDias(prev => {
                                                            if (checked) return [...prev, d.id]
                                                            return prev.filter(id => id !== d.id)
                                                        })
                                                    }}
                                                    size="small"
                                                />
                                            }
                                            label={d.nombre}
                                        />
                                    ))}
                                </FormGroup>
                             </Grid>
                        )}

                        <Grid item xs={12}>
                             <FormControlLabel
                                control={
                                    <Switch 
                                        checked={isCustomActivity}
                                        onChange={e => setIsCustomActivity(e.target.checked)}
                                    />
                                }
                                label="Actividad Personalizada (Sin Asignatura)"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                             <FormControlLabel
                                control={
                                    <Switch 
                                        checked={esSimultanea}
                                        onChange={e => setEsSimultanea(e.target.checked)}
                                        color="warning"
                                    />
                                }
                                label="Permitir Simultaneidad (Ignorar conflictos de grupo)"
                            />
                             <FormHelperText>Active esto para agregar más de una clase a este mismo grupo en el mismo horario.</FormHelperText>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Grupo (Requerido)</InputLabel>
                                <Select 
                                    value={grupoId} 
                                    label="Grupo (Requerido)"
                                    onChange={e => setGrupoId(Number(e.target.value))}
                                >
                                    {grupos.map(g => (
                                        <MenuItem key={g.id} value={g.id}>
                                            {g.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {!isCustomActivity && (
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Asignatura</InputLabel>
                                    <Select 
                                        value={asignaturaId} 
                                        label="Asignatura" 
                                        onChange={e => setAsignaturaId(Number(e.target.value))}
                                        disabled={!grupoId}
                                    >
                                        {asignaturas.map(a => (
                                            <MenuItem key={a.id} value={a.id}>
                                                {a.materia?.nombre || 'Sin Nombre'}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {!grupoId && <FormHelperText>Seleccione primero un grupo</FormHelperText>}
                                </FormControl>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                             <TextField
                                fullWidth
                                size="small"
                                label={isCustomActivity ? "Título (Requerido)" : "Título Personalizado (Opcional)"}
                                value={customTitle}
                                onChange={e => setCustomTitle(e.target.value)}
                                helperText={isCustomActivity ? "Ej: Reunión, Almuerzo" : "Ej: Cuido de Receso. Útil para bloques de recreo."}
                                required={isCustomActivity}
                             />
                        </Grid>

                        <Grid item xs={6}>
                             <TextField
                                fullWidth
                                size="small"
                                type="time"
                                label="Hora Inicio (Requerido)"
                                InputLabelProps={{ shrink: true }}
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                required
                                error={!startTime}
                             />
                        </Grid>
                        <Grid item xs={6}>
                             <TextField
                                fullWidth
                                size="small"
                                type="time"
                                label="Hora Fin (Requerido)"
                                InputLabelProps={{ shrink: true }}
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                required
                                error={!endTime}
                             />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Docente</InputLabel>
                                <Select 
                                    value={docenteId} 
                                    label="Docente" 
                                    onChange={e => setDocenteId(Number(e.target.value))}
                                    // Disable auto-lock if custom activity
                                    disabled={!isCustomActivity && docenteAssignments.some(a => a.asignatura_grado_id === asignaturaId)}
                                >
                                    <MenuItem value=""><em>Ninguno</em></MenuItem>
                                    {docentes.map(d => (
                                        <MenuItem key={d.id} value={d.id}>
                                            {d.name} {d.last_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Aula</InputLabel>
                                <Select 
                                    value={aulaId} 
                                    label="Aula" 
                                    onChange={e => setAulaId(Number(e.target.value))}
                                >
                                    <MenuItem value=""><em>Ninguna</em></MenuItem>
                                    {aulas.map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.nombre} (Cap: {a.capacidad})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading || saving}>
                    {saving ? 'Guardando...' : 'Guardar Asignación'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ManualEntryDialog
