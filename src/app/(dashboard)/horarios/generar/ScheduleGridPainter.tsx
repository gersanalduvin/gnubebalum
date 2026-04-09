import { DocenteDisponibilidad, HorarioClase } from '@/services/scheduleService'
import { DragDropContext, Draggable, DropResult, Droppable } from '@hello-pangea/dnd'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import RoomIcon from '@mui/icons-material/Room'
import { Box, IconButton, Paper, Stack, Typography, alpha, useTheme } from '@mui/material'
import React from 'react'

interface ScheduleGridPainterProps {
    scheduleData: HorarioClase[]
    activeSubjectId: number | null
    onCellClick: (dia: number, currentClasses: HorarioClase[]) => void
    onDelete?: (id: number) => void
    onDragEnd: (result: DropResult) => void
    activeTeacherId?: number | null
    allScheduleData?: HorarioClase[]
    teacherAvailability?: DocenteDisponibilidad[]
    teacherOccupation?: HorarioClase[]
    showContinuityGaps?: boolean
}

const DIAS = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
]

const ScheduleGridPainter: React.FC<ScheduleGridPainterProps> = ({
    scheduleData,
    activeSubjectId,
    onCellClick,
    onDelete,
    onDragEnd,
    activeTeacherId,
    allScheduleData = [],
    teacherAvailability = [],
    teacherOccupation = [],
    showContinuityGaps = false
}) => {
    const theme = useTheme()

    const getDayContent = (dia: number) => {
        const clases = scheduleData
            .filter(c => c.dia_semana === dia)
            .sort((a, b) => {
                const timeA = a.hora_inicio_real || '00:00'
                const timeB = b.hora_inicio_real || '00:00'
                return timeA.localeCompare(timeB)
            })

        const occupation = teacherOccupation
             .filter(c => c.dia_semana === dia && !clases.some(existing => existing.id === c.id))
             
        return (
            <Droppable droppableId={dia.toString()}>
                {(provided, snapshot) => (
                    <Stack 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        spacing={1} 
                        sx={{ 
                            p: 1, 
                            height: '100%', 
                            overflowY: 'auto',
                            bgcolor: snapshot.isDraggingOver ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                            transition: 'background-color 0.2s'
                        }}
                    >
                         {/* Teacher Conflicts Overlay (Static) */}
                         {occupation.map(occ => (
                               <Paper
                                   key={`occ-${occ.id}`}
                                   elevation={0}
                                   sx={{
                                       p: 1,
                                       mb: 1,
                                       bgcolor: alpha(theme.palette.error.main, 0.08),
                                       border: '1px dashed',
                                       borderColor: theme.palette.error.main,
                                       opacity: 0.7,
                                       cursor: 'not-allowed'
                                   }}
                               >
                                   <Typography variant="caption" color="error" fontWeight="bold" sx={{ display: 'block', lineHeight: 1.2 }}>
                                       {occ.titulo_personalizado || occ.asignatura_grado?.materia?.nombre || 'Ocupado'}
                                   </Typography>
                                   <Typography variant="caption" color="error" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>
                                       Grupo: {occ.grupo?.nombre || 'Otro'}
                                   </Typography>
                                   <Typography variant="caption" display="block" color="text.secondary">
                                       {occ.hora_inicio_real?.slice(0, 5)} - {occ.hora_fin_real?.slice(0, 5)}
                                   </Typography>
                               </Paper>
                         ))}

                        {clases.map((c, index) => {
                            const subject = c.titulo_personalizado || c.asignatura_grado?.materia?.nombre || 'Sin Nombre'
                            const tFirstName = c.docente?.name?.split(' ')[0] || ''
                            const tLastName = c.docente?.last_name?.split(' ')[0] || ''
                            const teacherName = (tFirstName || tLastName) ? `${tFirstName} ${tLastName}`.trim() : null
                            const isHighlighted = activeSubjectId && c.asignatura_grado_id === activeSubjectId;

                            // Verificar continuidad con el bloque anterior
                            let hasGap = false;
                            if (showContinuityGaps && index > 0) {
                                const prevBlock = clases[index - 1];
                                const currentStart = c.hora_inicio_real?.slice(0, 5);
                                const prevEnd = prevBlock.hora_fin_real?.slice(0, 5);
                                if (currentStart !== prevEnd) {
                                    hasGap = true;
                                }
                            }

                           return (
                               <Draggable key={c.id!.toString()} draggableId={c.id!.toString()} index={index}>
                                   {(provided, snapshot) => (
                                       <Paper
                                           ref={provided.innerRef}
                                           {...provided.draggableProps}
                                           {...provided.dragHandleProps}
                                           elevation={snapshot.isDragging ? 6 : (isHighlighted ? 4 : 1)}
                                            sx={{
                                                p: 1.5,
                                                bgcolor: snapshot.isDragging ? 'white' : alpha(theme.palette.primary.main, 0.12),
                                                color: 'primary.main',
                                                border: hasGap ? '2px solid' : (isHighlighted ? '2px solid' : '1px solid'),
                                                borderColor: hasGap ? theme.palette.error.main : (snapshot.isDragging ? 'primary.main' : (isHighlighted ? 'error.main' : alpha(theme.palette.primary.main, 0.3))),
                                                position: 'relative',
                                                transition: 'all 0.2s',
                                                cursor: 'grab',
                                                boxShadow: hasGap ? `0 0 10px ${alpha(theme.palette.error.main, 0.4)}` : (isHighlighted ? `0 0 12px ${alpha(theme.palette.error.main, 0.5)}` : undefined),
                                                transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                                                zIndex: (isHighlighted || hasGap) ? 10 : 1,
                                                '&:active': { cursor: 'grabbing' },
                                                animation: hasGap ? 'pulse-red 2s infinite' : 'none',
                                                '@keyframes pulse-red': {
                                                    '0%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}` },
                                                    '70%': { boxShadow: `0 0 0 6px ${alpha(theme.palette.error.main, 0)}` },
                                                    '100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` }
                                                }
                                            }}
                                           onClick={(e) => {
                                               // Ensure click only triggers if not dragging
                                               if (!snapshot.isDragging) onCellClick(dia, [c])
                                           }}
                                       >
                                           <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                               {subject}
                                           </Typography>
                                           
                                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.9 }}>
                                                <AccessTimeIcon sx={{ fontSize: '0.8rem', color: hasGap ? 'error.main' : 'inherit' }} />
                                                <Typography variant="caption" fontWeight="medium" sx={{ color: hasGap ? 'error.main' : 'inherit' }}>
                                                    {c.hora_inicio_real?.slice(0, 5)} - {c.hora_fin_real?.slice(0, 5)}
                                                </Typography>
                                                {hasGap && (
                                                    <Typography variant="caption" color="error" sx={{ fontWeight: 'bold', ml: 0.5 }}>
                                                        [SALTO]
                                                    </Typography>
                                                )}
                                            </Stack>

                                           {c.aula && (
                                               <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.8, mt: 0.3 }}>
                                                   <RoomIcon sx={{ fontSize: '0.8rem' }} />
                                                   <Typography variant="caption">{c.aula.nombre}</Typography>
                                               </Stack>
                                           )}

                                            {teacherName && (
                                               <Stack direction="row" alignItems="center" spacing={0.5} sx={{ opacity: 0.8, mt: 0.3 }}>
                                                   <PersonIcon sx={{ fontSize: '0.8rem' }} />
                                                   <Typography variant="caption">{teacherName}</Typography>
                                               </Stack>
                                           )}

                                           {onDelete && (
                                               <IconButton
                                                   size="small"
                                                   onClick={(e) => {
                                                       e.stopPropagation()
                                                       onDelete(c.id!)
                                                   }}
                                                   sx={{
                                                       position: 'absolute',
                                                       top: 2,
                                                       right: 2,
                                                       color: alpha(theme.palette.text.primary, 0.4),
                                                       p: 0.5,
                                                       '&:hover': { color: 'error.main' }
                                                   }}
                                               >
                                                   <DeleteIcon fontSize="small" />
                                               </IconButton>
                                           )}
                                       </Paper>
                                   )}
                               </Draggable>
                           )
                        })}
                        {provided.placeholder}
                        
                        <Box 
                            onClick={() => onCellClick(dia, [])}
                            sx={{ 
                                border: '2px dashed', 
                                borderColor: 'divider', 
                                borderRadius: 1, 
                                p: 2, 
                                textAlign: 'center', 
                                cursor: 'pointer',
                                opacity: 0.5,
                                '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.primary.main, 0.05) }
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">+ Agregar</Typography>
                        </Box>
                    </Stack>
                )}
            </Droppable>
        )
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header Row */}
                <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                    {DIAS.map(d => (
                        <Box key={d.id} sx={{ flex: 1, p: 1.5, textAlign: 'center', bgcolor: 'background.default', borderRight: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight="bold">{d.nombre}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Content Columns */}
                <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                    {DIAS.map(d => (
                        <Box key={d.id} sx={{ flex: 1, height: '100%', borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                            {getDayContent(d.id)}
                        </Box>
                    ))}
                </Box>
            </Box>
        </DragDropContext>
    )
}

export default ScheduleGridPainter
