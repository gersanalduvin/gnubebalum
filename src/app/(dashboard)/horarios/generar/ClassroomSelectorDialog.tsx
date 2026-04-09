
import ScheduleService, { ConfigAula, HorarioClase } from '@/services/scheduleService'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
    Box,
    Button,
    Card,
    CardActionArea,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'

interface ClassroomSelectorDialogProps {
    open: boolean
    onClose: () => void
    onSelect: (aulaId: number, startTime?: string, endTime?: string) => void
    currentDay: number
    currentBlockId: number
    initialStartTime?: string
    initialEndTime?: string
    scheduleData: HorarioClase[]
    title?: string
}

const ClassroomSelectorDialog: React.FC<ClassroomSelectorDialogProps> = ({
    open,
    onClose,
    onSelect,
    currentDay,
    currentBlockId,
    initialStartTime,
    initialEndTime,
    scheduleData,
    title = 'Seleccionar Aula'
}) => {
    const [aulas, setAulas] = useState<ConfigAula[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    useEffect(() => {
        if (open) {
            loadAulas()
            setSelectedId(null)
            setStartTime(initialStartTime || '')
            setEndTime(initialEndTime || '')
        }
    }, [open, initialStartTime, initialEndTime])

    const loadAulas = async () => {
        setLoading(true)
        try {
            const data = await ScheduleService.getAulas({ activa: true })
            setAulas(data)
        } catch (error) {
            console.error('Error loading classrooms', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper to check availability
    const checkAvailability = (aulaId: number) => {
        const finalStart = startTime || initialStartTime || '00:00'
        const finalEnd = endTime || initialEndTime || '23:59'

        // Check against all classes in scheduleData
        const conflict = scheduleData.find(c => {
            if (c.dia_semana !== currentDay || c.aula_id !== aulaId) return false

            // Get times for the existing class in schedule (fallback to empty string if missing)
            const cStart = c.hora_inicio_real || ''
            const cEnd = c.hora_fin_real || ''

            if (!cStart || !cEnd) return false

            // Standard overlap logic: (S1 < E2) && (E1 > S2)
            return (finalStart < cEnd) && (finalEnd > cStart)
        })
        return conflict
    }

    const handleConfirm = () => {
        if (selectedId) {
            onSelect(selectedId, startTime || undefined, endTime || undefined)
            onClose()
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{title}</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                         <TextField
                            size="small"
                            type="time"
                            label="Inicio (Opc)"
                            InputLabelProps={{ shrink: true }}
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            sx={{ width: 130 }}
                         />
                         <TextField
                            size="small"
                            type="time"
                            label="Fin (Opc)"
                            InputLabelProps={{ shrink: true }}
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                            sx={{ width: 130 }}
                         />
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {aulas.map(aula => {
                            const conflict = checkAvailability(aula.id)
                            const isOccupied = !!conflict
                            // const isSelected = selectedId === aula.id

                            return (
                                <Grid item xs={12} sm={6} md={4} key={aula.id}>
                                    <Card 
                                        variant={selectedId === aula.id ? 'outlined' : 'elevation'}
                                        sx={{ 
                                            border: selectedId === aula.id ? '2px solid #1976d2' : '1px solid transparent',
                                            bgcolor: selectedId === aula.id ? 'action.selected' : 'background.paper',
                                            opacity: isOccupied ? 0.6 : 1
                                        }}
                                    >
                                        <CardActionArea 
                                            onClick={() => !isOccupied && setSelectedId(aula.id)}
                                            disabled={isOccupied}
                                            sx={{ height: '100%' }}
                                        >
                                            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {aula.nombre}
                                                    </Typography>
                                                    {isOccupied ? (
                                                        <Chip 
                                                            icon={<CancelIcon />} 
                                                            label="Ocupada" 
                                                            color="error" 
                                                            size="small" 
                                                        />
                                                    ) : (
                                                        <Chip 
                                                            icon={<CheckCircleIcon />} 
                                                            label="Libre" 
                                                            color="success" 
                                                            size="small" 
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>

                                                <Typography variant="caption" color="text.secondary">
                                                    Tipo: {aula.tipo} | Cap: {aula.capacidad}
                                                </Typography>

                                                {isOccupied && conflict?.grupo && (
                                                    <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                        Ocupada por: {conflict.grupo.nombre}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={handleConfirm} 
                    variant="contained" 
                    disabled={!selectedId}
                >
                    Asignar
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ClassroomSelectorDialog
