'use client'

import { ArrowBack, Refresh, Save } from '@mui/icons-material'
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    alpha,
    useTheme
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import SelectorCorte from '@/features/asistencias/components/SelectorCorte'
import SelectorGrupo from '@/features/asistencias/components/SelectorGrupo'
import type { Corte } from '@/features/asistencias/types'
import StudentProfileModal from '@/features/docente-dashboard/components/StudentProfileModal'
import { studentObservationService } from '@/services/studentObservationService'

const StudentObservationPage = ({ isAdmin = false }: { isAdmin?: boolean }) => {
    const router = useRouter()
    const theme = useTheme()

    const [periodoId, setPeriodoId] = useState<number | null>(null)
    const [grupoId, setGrupoId] = useState<number | null>(null)
    const [corte, setCorte] = useState<Corte | ''>('')
    
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [alumnos, setAlumnos] = useState<any[]>([])
    const [initialAlumnos, setInitialAlumnos] = useState<any[]>([])
    
    const [profileStudent, setProfileStudent] = useState<any | null>(null)
    const [profileOpen, setProfileOpen] = useState(false)

    // Cargar datos cuando cambian los filtros
    useEffect(() => {
        if (grupoId && periodoId && corte) {
            fetchObservations()
        } else {
            setAlumnos([])
            setInitialAlumnos([])
        }
    }, [grupoId, periodoId, corte])

    const fetchObservations = async () => {
        if (!grupoId || !periodoId || !corte) return

        try {
            setLoading(true)
            const parcialId = Number(corte.replace('corte_', ''))
            const resp = await studentObservationService.getObservations({
                grupo_id: grupoId,
                periodo_lectivo_id: periodoId,
                parcial_id: parcialId
            }, isAdmin)
            
            setAlumnos(resp.alumnos)
            setInitialAlumnos(JSON.parse(JSON.stringify(resp.alumnos)))
        } catch (error) {
            console.error(error)
            toast.error('Error al cargar observaciones')
        } finally {
            setLoading(false)
        }
    }

    const handleObservationChange = (userId: number, value: string) => {
        setAlumnos(prev => prev.map(a => a.id === userId ? { ...a, observacion: value } : a))
    }

    const hasChanges = useMemo(() => {
        return JSON.stringify(alumnos) !== JSON.stringify(initialAlumnos)
    }, [alumnos, initialAlumnos])

    const handleSave = async () => {
        if (!grupoId || !periodoId || !corte) return

        try {
            setSaving(true)
            
            // Solo enviar los que cambiaron para mayor eficiencia si se desea, 
            // pero el batchStore actual acepta todos. Enviamos todos los que tengan texto.
            const observations = alumnos.map(a => ({
                user_id: a.id,
                observacion: a.observacion
            }))

            const parcialId = Number(corte.replace('corte_', ''))
            await studentObservationService.saveBatch({
                grupo_id: grupoId,
                periodo_lectivo_id: periodoId,
                parcial_id: parcialId,
                observations
            }, isAdmin)

            setInitialAlumnos(JSON.parse(JSON.stringify(alumnos)))
            toast.success('Observaciones guardadas correctamente')
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar observaciones')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => router.back()} 
                        sx={{ mb: 1 }}
                        size="small"
                    >
                        Volver
                    </Button>
                    <Typography variant="h4" fontWeight="bold">
                        Observaciones de Alumnos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isAdmin ? 'Panel Administrativo' : 'Panel de Docente Guía'}
                    </Typography>
                </Box>
                
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchObservations}
                        disabled={loading || !grupoId || !corte}
                    >
                        Recargar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        onClick={handleSave}
                        disabled={saving || loading || !hasChanges}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Box>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <SelectorGrupo
                                periodoId={periodoId}
                                grupoId={grupoId}
                                onPeriodoChange={setPeriodoId}
                                onGrupoChange={setGrupoId}
                                isTeacherView={!isAdmin}
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <SelectorCorte 
                                value={corte} 
                                onChange={(val: Corte) => setCorte(val)} 
                                required 
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                            <TableCell sx={{ width: '30%', fontWeight: 'bold' }}>Alumno</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Observaciones Cualitativas</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                    <Typography variant="body2" sx={{ mt: 1 }}>Cargando alumnos...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : alumnos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} align="center" sx={{ py: 5 }}>
                                    <Typography color="text.secondary">
                                        {!corte || !grupoId ? 'Seleccione un grupo y corte para ver los alumnos' : 'No hay alumnos en este grupo'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            alumnos.map((alumno) => (
                                <TableRow key={alumno.id} hover>
                                    <TableCell>
                                        <Typography 
                                            variant="subtitle2" 
                                            fontWeight="medium"
                                            sx={{ 
                                                cursor: 'pointer', 
                                                textDecoration: 'underline',
                                                color: 'primary.main',
                                                '&:hover': { color: 'primary.dark' }
                                            }}
                                            onClick={() => {
                                                setProfileStudent(alumno)
                                                setProfileOpen(true)
                                            }}
                                        >
                                            {alumno.nombre_completo}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={2}
                                            variant="outlined"
                                            size="small"
                                            placeholder="Escriba aquí la observación..."
                                            value={alumno.observacion || ''}
                                            onChange={(e) => handleObservationChange(alumno.id, e.target.value)}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                                                    },
                                                    '&.Mui-focused': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                                                    }
                                                }
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <StudentProfileModal 
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                student={profileStudent}
            />
        </Container>
    )
}

export default StudentObservationPage
