import { Box, Card, CardActionArea, CardContent, LinearProgress, Switch, Typography, useTheme } from '@mui/material'
import React, { useMemo } from 'react'

interface SubjectAssignment {
    asignatura_grado_id: number
    materia_nombre: string
    materia_abreviatura?: string
    horas_semanales: number
    docente_id: number
    docente: {
        id: number
        primer_nombre: string
        primer_apellido: string
    } | null
}

interface SubjectPaletteProps {
    assignments: SubjectAssignment[]
    scheduleData: any[]
    activeSubjectId: number | null
    onSelectSubject: (id: number | null) => void
}

const SubjectPalette: React.FC<SubjectPaletteProps> = ({ 
    assignments, 
    scheduleData, 
    activeSubjectId, 
    onSelectSubject 
}) => {
    const theme = useTheme()

    const [hideCompleted, setHideCompleted] = React.useState(false)

    // Calculate progress for each subject
    const progressData = useMemo(() => {
        const stats: Record<number, number> = {}
        scheduleData.forEach(item => {
            if (item.asignatura_grado_id) {
                stats[item.asignatura_grado_id] = (stats[item.asignatura_grado_id] || 0) + 1
            }
        })
        return stats
    }, [scheduleData])

    const sortedAssignments = useMemo(() => {
        return [...assignments].sort((a, b) => {
             // Sort by name
             return a.materia_nombre.localeCompare(b.materia_nombre)
        })
    }, [assignments])

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, px: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 1 }}>
                    Materias ({assignments.length})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <Typography variant="caption" sx={{ mr: 1 }}>Ocultar completadas</Typography>
                     <Switch 
                        size="small" 
                        checked={hideCompleted} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHideCompleted(e.target.checked)} 
                    />
                </Box>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {sortedAssignments.map(asig => {
                    const assigned = progressData[asig.asignatura_grado_id] || 0
                    const total = asig.horas_semanales || 0 
                    const progress = total > 0 ? Math.min((assigned / total) * 100, 100) : 0
                    const isComplete = total > 0 && assigned >= total
                    const isActive = activeSubjectId === asig.asignatura_grado_id
                    
                    if (hideCompleted && isComplete) return null

                    return (
                        <Card 
                            key={asig.asignatura_grado_id}
                            variant={isActive ? "outlined" : "elevation"}
                            sx={{ 
                                border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                                bgcolor: isActive ? 'action.selected' : (isComplete ? '#e8f5e9' : 'background.paper'), // Light green if complete
                                transition: 'all 0.2s',
                                opacity: isComplete && !isActive ? 0.8 : 1
                            }}
                        >
                            <CardActionArea onClick={() => onSelectSubject(isActive ? null : asig.asignatura_grado_id)}>
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                            {asig.materia_abreviatura || asig.materia_nombre}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: isComplete ? 'success.main' : 'text.secondary' }}>
                                            {assigned}/{total}h
                                        </Typography>
                                    </Box>
                                    
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={progress} 
                                        color={isComplete ? "success" : "primary"}
                                        sx={{ height: 6, borderRadius: 3, mb: 1 }}
                                    />

                                    <Typography variant="caption" display="block" color="text.secondary" noWrap>
                                        {asig.docente ? `${asig.docente.primer_nombre} ${asig.docente.primer_apellido}` : 'Sin Docente'}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    )
                })}
            </Box>
        </Box>
    )
}

export default SubjectPalette
