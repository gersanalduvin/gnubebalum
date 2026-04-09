import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    Chip,
    Stack
} from '@mui/material'
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'

interface Task {
  id: number
  nombre: string
  descripcion: string
  puntaje_maximo: number
  type: 'task' | 'evidence' | 'evidence_slot'
  fecha: string | null
}

interface StudentGrade {
  [taskId: number]: {
      value: number | string | null
      display: string
  }
}

interface Student {
  id: number
  codigo: string
  nombre_completo: string
  foto_url: string | null
  grades: StudentGrade
  total: number | string
  acumulado?: number | string
  examen?: number | string
  nota_final: number | string
  escala?: string
}

interface Props {
  tasks: Task[]
  students: Student[]
  metadata: any
}

const ReporteNotasTable = ({ tasks, students, metadata }: Props) => {
  if (!students.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No hay datos para mostrar con los filtros seleccionados.
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell 
              sx={{ 
                minWidth: 50, 
                fontWeight: 'bold', 
                bgcolor: 'background.paper',
                position: 'sticky',
                left: 0,
                zIndex: 2
              }}
            >
              No.
            </TableCell>
            <TableCell 
              sx={{ 
                minWidth: 250, 
                fontWeight: 'bold', 
                bgcolor: 'background.paper',
                position: 'sticky',
                left: 50,
                zIndex: 2,
                borderRight: 1,
                borderColor: 'divider'
              }}
            >
              Estudiante
            </TableCell>

            {tasks.map((task) => (
              <TableCell 
                key={task.id} 
                align="center"
                sx={{ 
                  minWidth: metadata.es_iniciativa && task.type === 'evidence_slot' ? 250 : 100, 
                  bgcolor: 'background.paper' 
                }}
              >
                <Tooltip title={(typeof task.descripcion === 'string' ? task.descripcion : JSON.stringify(task.descripcion)) || task.nombre}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 120 }}>
                      {typeof task.nombre === 'string' ? task.nombre : JSON.stringify(task.nombre)}
                    </Typography>
                    {task.type === 'task' && (
                       <Typography variant="caption" color="textSecondary">
                          Max: {task.puntaje_maximo}
                       </Typography>
                    )}
                  </Box>
                </Tooltip>
              </TableCell>
            ))}

            {!metadata.es_iniciativa && (
              <>
                <TableCell 
                  align="center" 
                  sx={{ 
                    minWidth: 80, 
                    fontWeight: 'bold', 
                    bgcolor: 'background.paper',
                    borderLeft: 1,
                    borderColor: 'divider'
                  }}
                >
                  Acum.
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    minWidth: 80, 
                    fontWeight: 'bold', 
                    bgcolor: 'background.paper'
                  }}
                >
                  Exam.
                </TableCell>

                <TableCell 
                  align="center" 
                  sx={{ 
                    minWidth: 80, 
                    fontWeight: 'bold', 
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.selected' : 'primary.50',
                    color: 'primary.main',
                    borderLeft: 1,
                    borderColor: 'divider'
                  }}
                >
                  Nota Final
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    minWidth: 80, 
                    fontWeight: 'bold', 
                    bgcolor: 'background.paper',
                    borderLeft: 1,
                    borderColor: 'divider'
                  }}
                >
                  Escala
                </TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student, index) => (
            <TableRow key={student.id} hover>
              <TableCell 
                 sx={{ 
                   position: 'sticky', 
                   left: 0, 
                   bgcolor: 'background.paper',
                   zIndex: 1
                 }}
              >
                {index + 1}
              </TableCell>
              <TableCell 
                 sx={{ 
                   position: 'sticky', 
                   left: 50, 
                   bgcolor: 'background.paper',
                   zIndex: 1,
                   borderRight: 1,
                   borderColor: 'divider',
                   width: 250,
                   maxWidth: 250,
                   overflow: 'hidden',
                   whiteSpace: 'nowrap',
                   textOverflow: 'ellipsis'
                 }}
              >
                <Tooltip title={student.nombre_completo}>
                    <Typography variant="body2" fontWeight="500" noWrap>
                    {student.nombre_completo}
                    </Typography>
                </Tooltip>
              </TableCell>

              {tasks.map((task) => {
                const grade = student.grades[task.id] as any
                
                if (metadata.es_iniciativa && grade && (task.type === 'evidence_slot' || (grade as any).indicador_config)) {
                    const config = grade.indicador_config
                    const checks = grade.indicadores_check || {}
                    const evidenceName = grade.evidence_name || task.nombre
                    
                    // Extract criteria list correctly
                    let criteria: string[] = []
                    if (config?.criterios && Array.isArray(config.criterios)) criteria = config.criterios
                    else if (config?.criterio) {
                        criteria = typeof config.criterio === 'object' ? Object.values(config.criterio) : [config.criterio]
                    }

                    return (
                        <TableCell key={task.id} align="left" sx={{ verticalAlign: 'top', minWidth: 250 }}>
                            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', lineHeight: 1.1, flex: 1, mr: 1 }}>
                                    {evidenceName}
                                </Typography>
                                {config?.type !== 'select' && (
                                    <Chip 
                                        label={grade.display} 
                                        size="small" 
                                        color={grade.display === '-' ? 'default' : 'primary'}
                                        variant={grade.display === '-' ? 'outlined' : 'filled'}
                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold', minWidth: 32 }}
                                    />
                                )}
                            </Box>
                            {criteria.length > 0 && (
                                <Stack spacing={0.5}>
                                    {criteria.map((crit: string, i: number) => {
                                        const isSelect = config?.type === 'select'
                                        const isChecked = isSelect 
                                            ? checks.respuesta === crit 
                                            : (!!checks[crit] || !!checks[i] || !!checks[i+1])
                                        
                                        return (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {isChecked ? (
                                                    <CheckCircle sx={{ fontSize: 12, color: 'success.main' }} />
                                                ) : (
                                                    <RadioButtonUnchecked sx={{ fontSize: 12, color: 'text.disabled' }} />
                                                )}
                                                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: isChecked ? 'text.primary' : 'text.secondary' }}>
                                                    {crit}
                                                </Typography>
                                            </Box>
                                        )
                                    })}
                                </Stack>
                            )}
                            {!criteria.length && grade.display === '-' && (
                                <Typography variant="caption" color="text.disabled italic">Sin evaluar</Typography>
                            )}
                        </TableCell>
                    )
                }

                return (
                  <TableCell key={task.id} align="center">
                    {grade ? (
                       grade.display === '-' ? (
                          <Typography color="text.disabled">-</Typography>
                       ) : (
                          <Typography variant="body2" fontWeight={metadata.es_iniciativa ? 'normal' : '500'}>
                             {typeof grade.display === 'string' ? grade.display : JSON.stringify(grade.display)}
                          </Typography>
                       )
                    ) : (
                       <Typography color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                )
              })}

              {!metadata.es_iniciativa && (
                <>
                  <TableCell align="center" sx={{ borderLeft: 1, borderColor: 'divider', fontWeight: 'bold' }}>
                      {student.acumulado || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {student.examen || '-'}
                  </TableCell>

                  <TableCell 
                    align="center"
                    sx={{ 
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.selected' : 'primary.50',
                      color: (theme) => theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark',
                      fontWeight: 'bold',
                      borderLeft: 1,
                      borderColor: 'divider'
                    }}
                  >
                    {student.nota_final}
                  </TableCell>
                  <TableCell align="center" sx={{ borderLeft: 1, borderColor: 'divider' }}>
                      {student.escala || '-'}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}


export default ReporteNotasTable
