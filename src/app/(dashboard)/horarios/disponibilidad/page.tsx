'use client'

import ScheduleService, { DocenteDisponibilidad, HorarioClase } from '@/services/scheduleService'
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import ScheduleGridPainter from '../generar/ScheduleGridPainter'
import AvailabilityDialog from './AvailabilityDialog'

const DisponibilidadDocentePage = () => {
    // Data States
    const [docentes, setDocentes] = useState<any[]>([])
    const [turnos, setTurnos] = useState<any[]>([])
    
    // Selection States
    const [selectedDocente, setSelectedDocente] = useState<number | ''>('')
    const [selectedTurno, setSelectedTurno] = useState<number | ''>('')
    
    // Logic States
    const [disponibilidad, setDisponibilidad] = useState<DocenteDisponibilidad[]>([])
    const [loading, setLoading] = useState(false)
    
    // Dialog States
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Partial<DocenteDisponibilidad> | undefined>(undefined)

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [docs, turns] = await Promise.all([
                    ScheduleService.getDocentes(),
                    ScheduleService.getTurnos()
                ])
                setDocentes(docs)
                setTurnos(turns)
                
                if (window.localStorage.getItem('last_turno_id')) {
                    const savedTurno = Number(window.localStorage.getItem('last_turno_id'))
                    if (turns.find((t: any) => t.id === savedTurno))
                         setSelectedTurno(savedTurno)
                }
            } catch (error) {
                console.error(error)
                toast.error('Error cargando datos iniciales')
            }
        }
        loadInitialData()
    }, [])

    useEffect(() => {
        if (selectedTurno) {
            window.localStorage.setItem('last_turno_id', String(selectedTurno))
        }
    }, [selectedTurno])

    useEffect(() => {
        if (selectedDocente && selectedTurno) {
            fetchDisponibilidad(Number(selectedDocente), Number(selectedTurno))
        } else {
            setDisponibilidad([])
        }
    }, [selectedDocente, selectedTurno])

    const fetchDisponibilidad = async (docenteId: number, turnoId: number) => {
        setLoading(true)
        try {
            const data = await ScheduleService.getDisponibilidad(docenteId, turnoId)
            setDisponibilidad(data)
        } catch (error) {
            console.error(error); toast.error('Error cargando disponibilidad')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (data: Partial<DocenteDisponibilidad> & { selectedDays?: number[] }) => {
        if (!selectedDocente) return

        try {
            const { selectedDays, ...rest } = data
            
            // If we have selected multiple days and it's a new entry (no ID)
            if (selectedDays && selectedDays.length > 0 && !data.id) {
                const savePromises = selectedDays.map(dia => {
                    const payload = { ...rest, dia_semana: dia, docente_id: Number(selectedDocente), turno_id: Number(selectedTurno) }
                    return ScheduleService.saveDisponibilidad(payload)
                })
                
                const savedResults = await Promise.all(savePromises)
                
                setDisponibilidad(prev => [...prev, ...savedResults])
                toast.success(`${savedResults.length} disponibilidades guardadas`)
            } else {
                // Standard case: editing or single day save
                const payload = { ...rest, docente_id: Number(selectedDocente), turno_id: Number(selectedTurno) }
                const saved = await ScheduleService.saveDisponibilidad(payload)
                
                setDisponibilidad(prev => {
                    if (data.id) {
                        return prev.map(p => p.id === data.id ? saved : p)
                    }
                    return [...prev, saved]
                })
                toast.success('Disponibilidad guardada')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar')
        }
    }

    const handleCellClick = (diaId: number, classes: HorarioClase[]) => {
        // If clicking on an existing items
        if (classes && classes.length > 0) {
            // Find the corresponding availability record
            const avail = disponibilidad.find(d => d.id === classes[0].id)
            if (avail) {
                setEditingItem(avail)
                setDialogOpen(true)
            }
        } else {
            // Clicked empty space -> Add new
            setEditingItem({
                dia_semana: diaId,
                hora_inicio: '07:00',
                hora_fin: '12:00',
                disponible: true // Default to Available
            })
            setDialogOpen(true)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await ScheduleService.deleteDisponibilidad(id)
            setDisponibilidad(prev => prev.filter(p => p.id !== id))
            toast.success('Disponibilidad eliminada')
        } catch (error) {
            console.error(error)
            toast.error('Error al eliminar')
        }
    }

    // Map disponibilidad to HorarioClase for the visualizer
    const scheduleData: HorarioClase[] = useMemo(() => {
        return disponibilidad.filter(d => d.disponible).map(d => ({
            id: d.id,
            periodo_lectivo_id: 0, // Dummy
            dia_semana: d.dia_semana,
            grupo_id: 0, 
            is_fijo: true,
            es_simultanea: false,
            hora_inicio_real: d.hora_inicio || '00:00',
            hora_fin_real: d.hora_fin || '00:00',
            titulo_personalizado: d.titulo || d.motivo || 'Disponible',
        }))
    }, [disponibilidad])

    return (
        <Card sx={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <CardHeader 
                title="Configuración de Disponibilidad Docente (Flexible)" 
                action={
                    <Button variant="contained" onClick={() => setDialogOpen(true)} disabled={!selectedDocente}>
                        + Marcar Disponibilidad
                    </Button>
                }
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                size="small"
                                options={docentes}
                                getOptionLabel={(option: any) => {
                                    if (!option) return '';
                                    const first = option.name || option.primer_nombre || '';
                                    const last = option.last_name || option.primer_apellido || '';
                                    return `${first} ${last}`.trim() || 'Sin Nombre';
                                }}
                                value={docentes.find((d: any) => d.id === selectedDocente) || null}
                                onChange={(_, newValue) => setSelectedDocente(newValue ? newValue.id : '')}
                                renderInput={(params) => <TextField {...params} label="Docente" />}
                                noOptionsText="No se encontraron docentes"
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Turno</InputLabel>
                                <Select
                                    value={selectedTurno}
                                    label="Turno"
                                    onChange={(e) => setSelectedTurno(Number(e.target.value))}
                                >
                                    {turnos.map((t: any) => (
                                        <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
                    {!selectedDocente ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Alert severity="info">Seleccione un docente para gestionar su disponibilidad.</Alert>
                        </Box>
                    ) : loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <ScheduleGridPainter
                            scheduleData={scheduleData}
                            activeSubjectId={null} // Not used here
                            activeTeacherId={Number(selectedDocente)}
                            onCellClick={handleCellClick}
                            onDelete={handleDelete}
                            onDragEnd={() => {}}
                            // We can use the generic painter. It uses "scheduleData" properties.
                            // Ensure ScheduleGridPainter handles "null" groups/subjects gracefully.
                        />
                    )}
                </Box>

                <AvailabilityDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    initialData={editingItem}
                />
            </CardContent>
        </Card>
    )
}

export default DisponibilidadDocentePage
