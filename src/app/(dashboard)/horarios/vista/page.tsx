'use client'

import ScheduleService from '@/services/scheduleService'
import PrintIcon from '@mui/icons-material/Print'
import {
    Alert,
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
    Select
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const ScheduleViewPage = () => {
    // Data States
    const [periodos, setPeriodos] = useState<any[]>([])
    const [turnos, setTurnos] = useState<any[]>([])
    const [grupos, setGrupos] = useState<any[]>([])
    const [docentes, setDocentes] = useState<any[]>([])
    const [aulas, setAulas] = useState<any[]>([])

    // Selection States
    const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
    const [selectedTurno, setSelectedTurno] = useState<number | ''>('')
    const [reportType, setReportType] = useState<string>('grupo')
    const [selectedValue, setSelectedValue] = useState<number | ''>('')
    
    // UI States
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            const [pers, turns, docs, cls] = await Promise.all([
                ScheduleService.getPeriodos(),
                ScheduleService.getTurnos(),
                ScheduleService.getDocentes(),
                ScheduleService.getAulas({ activa: true })
            ])
            setPeriodos(pers)
            setTurnos(turns)
            setDocentes(docs)
            setAulas(cls)
            
            if (pers.length > 0) setSelectedPeriodo(pers[0].id)
            if (turns.length > 0) setSelectedTurno(turns[0].id)
        } catch (error) {
            console.error(error)
            toast.error('Error cargando filtros')
        } finally {
            setLoading(false)
        }
    }

    // Load Groups when Periodo or Turno changes
    useEffect(() => {
        if (selectedPeriodo) { // Turno might be optional initially, but user wants filtering.
            ScheduleService.getGrupos(Number(selectedPeriodo), selectedTurno ? Number(selectedTurno) : undefined)
                .then(setGrupos)
                .catch(console.error)
        } else {
            setGrupos([])
        }
    }, [selectedPeriodo, selectedTurno])

    const handleDownload = async () => {
        if (!selectedPeriodo || !selectedTurno) {
            toast.warning('Seleccione Periodo y Turno')
            return
        }

        if (['grupo', 'docente', 'aula'].includes(reportType) && !selectedValue) {
            toast.warning('Seleccione el valor específico para el reporte')
            return
        }

        setGenerating(true)
        try {
            const params: any = {
                periodo_lectivo_id: selectedPeriodo,
                type: reportType,
                turno_id: selectedTurno 
            }

            if (['grupo', 'docente', 'aula'].includes(reportType)) {
                params.id = selectedValue
            }

            await ScheduleService.generatePdf(params)
            toast.success('PDF generado correctamente')
        } catch (error) {
            console.error(error)
            toast.error('Error al generar el PDF')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Card>
            <CardHeader 
                title="Generador de Horarios" 
                subheader="Seleccione los filtros para generar y descargar el horario en PDF"
            />
            
            <CardContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Grid container spacing={2}>
                            {/* Filtros Principales */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Periodo Lectivo</InputLabel>
                                    <Select 
                                        value={selectedPeriodo} 
                                        label="Periodo Lectivo" 
                                        onChange={e => setSelectedPeriodo(Number(e.target.value))}
                                    >
                                        {periodos.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Turno</InputLabel>
                                    <Select 
                                        value={selectedTurno} 
                                        label="Turno" 
                                        onChange={e => setSelectedTurno(Number(e.target.value))}
                                    >
                                        {turnos.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Tipo de Reporte */}
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de Reporte</InputLabel>
                                    <Select 
                                        value={reportType} 
                                        label="Tipo de Reporte" 
                                        onChange={(e) => {
                                            setReportType(e.target.value)
                                            setSelectedValue('')
                                        }}
                                    >
                                        <MenuItem value="grupo">Un Grupo Específico</MenuItem>
                                        <MenuItem value="todos_grupos">Todos los Grupos del Turno (PDF Combinado)</MenuItem>
                                        <MenuItem value="docente">Un Docente Específico</MenuItem>
                                        <MenuItem value="todos_docentes">Todos los Docentes (PDF Combinado)</MenuItem>
                                        <MenuItem value="aula">Por Aula</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Selector Contextual */}
                            {reportType === 'grupo' && (
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Seleccione Grupo</InputLabel>
                                        <Select 
                                            value={selectedValue} 
                                            label="Seleccione Grupo" 
                                            onChange={e => setSelectedValue(Number(e.target.value))}
                                        >
                                            {grupos.map(g => (
                                                <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            {reportType === 'todos_grupos' && (
                                <Grid item xs={12}>
                                    <Alert severity="info">
                                        Se generará un reporte con los horarios de <strong>TODOS</strong> los grupos pertenecientes al turno seleccionado.
                                    </Alert>
                                </Grid>
                            )}

                            {reportType === 'docente' && (
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Seleccione Docente</InputLabel>
                                        <Select 
                                            value={selectedValue} 
                                            label="Seleccione Docente" 
                                            onChange={e => setSelectedValue(Number(e.target.value))}
                                        >
                                            {docentes.map(d => (
                                                <MenuItem key={d.id} value={d.id}>{d.name} {d.last_name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            {reportType === 'todos_docentes' && (
                                <Grid item xs={12}>
                                    <Alert severity="info">
                                        Se generará un reporte con los horarios de <strong>TODOS</strong> los docentes activos.
                                    </Alert>
                                </Grid>
                            )}

                            {reportType === 'aula' && (
                                <Grid item xs={12}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Seleccione Aula</InputLabel>
                                        <Select 
                                            value={selectedValue} 
                                            label="Seleccione Aula" 
                                            onChange={e => setSelectedValue(Number(e.target.value))}
                                        >
                                            {aulas.map(a => (
                                                <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                        </Grid>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button 
                                variant="contained" 
                                size="large"
                                onClick={handleDownload} 
                                disabled={generating || !selectedPeriodo || !selectedTurno || (['grupo', 'docente', 'aula'].includes(reportType) && !selectedValue)}
                                startIcon={generating ? <CircularProgress size={20} color="inherit"/> : <PrintIcon />}
                            >
                                {generating ? 'Generando PDF...' : 'Imprimir / Descargar PDF'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}

export default ScheduleViewPage
