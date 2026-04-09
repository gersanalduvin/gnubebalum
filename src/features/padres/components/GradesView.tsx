import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import {
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import { SyntheticEvent, useEffect, useState } from 'react'
import parentService, { type Corte, type Task } from '../services/parentService'

interface Props {
  studentId: number
}

const PRIMARY_COLOR = '#5C61F2'
const SECONDARY_COLOR = '#EAEAFF'
const SUBJECT_BADGE_BG = '#F0F0FF'
const POINTS_BADGE_BG = '#F8F8F8'

const GradesView = ({ studentId }: Props) => {
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tieneDeuda, setTieneDeuda] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState('tareas')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedCorteTab, setSelectedCorteTab] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedCorte, setSelectedCorte] = useState<Corte | null>(null)
  const [isCorteModalOpen, setIsCorteModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const handleTabChange = (event: SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  const handleCorteClick = (corte: Corte) => {
    setSelectedCorte(corte)
    setIsCorteModalOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const isPublicado = (corte: Corte) => {
    if (!corte?.publicacion_inicio || !corte?.publicacion_fin) return false
    const now = new Date()
    try {
      // Usar midnight para inicio y 23:59:59 para fin
      const start = new Date(`${corte.publicacion_inicio}T00:00:00`)
      const end = new Date(`${corte.publicacion_fin}T23:59:59`)
      return now >= start && now <= end
    } catch (e) {
      return false
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Sin fecha'
    try {
      if (dateStr.includes('T')) {
        const date = new Date(dateStr)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
      const parts = dateStr.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return dateStr
    } catch (e) {
      return dateStr
    }
  }

  const filteredGrades = grades
    .map(grade => {
      if (selectedSubject && grade.asignatura !== selectedSubject) {
        return { ...grade, todas_tareas: [] }
      }

      const filteredTasks = grade.todas_tareas.filter((task: Task) => {
        const matchesSearch = task.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCorte = !selectedCorteTab || task.corte_nombre === selectedCorteTab

        return matchesSearch && matchesCorte
      })

      return { ...grade, todas_tareas: filteredTasks }
    })
    .filter(grade => grade.todas_tareas.length > 0 || (selectedSubject && grade.asignatura === selectedSubject))

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data: any = await parentService.getChildGrades(studentId)
        if (data && data.boleta) {
          setGrades(data.boleta)
          setTieneDeuda(data.tiene_deuda)
        } else {
          setGrades(data)
        }
      } catch (err) {
        console.error(err)
        setError('Error al cargar las calificaciones.')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchGrades()
    }
  }, [studentId])

  if (loading)
    return (
      <Box className='flex justify-center p-8'>
        <CircularProgress />
      </Box>
    )
  if (error) return <Alert severity='error'>{error}</Alert>
  if (grades.length === 0) return <Alert severity='info'>No hay calificaciones registradas.</Alert>

  const allTasks = filteredGrades
    .flatMap(g => g.todas_tareas)
    .sort((a, b) => {
      const dateA = new Date(a.fecha_entrega || a.fecha || 0).getTime()
      const dateB = new Date(b.fecha_entrega || b.fecha || 0).getTime()
      return dateB - dateA
    })
  const tasksByCorte = allTasks.reduce(
    (acc, task) => {
      const corte = task.corte_nombre || 'Otros'
      if (!acc[corte]) acc[corte] = []
      acc[corte].push(task)
      return acc
    },
    {} as Record<string, Task[]>
  )

  const sortedCortes = Object.keys(tasksByCorte).sort((a, b) => {
    // Custom sort to prioritize Corte names descending
    if (a.startsWith('Corte') && b.startsWith('Corte')) {
      return b.localeCompare(a)
    }
    return b.localeCompare(a)
  })
  const allAvailableCortes = Array.from(
    new Set(grades.flatMap((g: any) => g.todas_tareas.map((t: Task) => t.corte_nombre || 'Otros')))
  ).sort((a, b) => b.localeCompare(a))

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh' }}>
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <TabList
            onChange={handleTabChange}
            variant='fullWidth'
            textColor='primary'
            indicatorColor='primary'
            sx={{
              '& .MuiTab-root': { fontWeight: '600', textTransform: 'none', fontSize: '1rem', color: '#888' },
              '& .Mui-selected': { color: `${PRIMARY_COLOR} !important` }
            }}
          >
            <Tab label='Tareas' value='tareas' />
            <Tab label='Boletín' value='boletin' />
          </TabList>
        </Box>

        <TabPanel value='tareas' sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder='Buscar tarea...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-search-line' style={{ color: '#aaa', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: '#F8F9FA',
                    '& fieldset': { border: '1px solid #E2E8F0' },
                    '&:hover fieldset': { borderColor: PRIMARY_COLOR },
                    height: '45px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size='small'>
                <InputLabel id='subject-select-label' sx={{ color: '#666' }}>
                  Materia
                </InputLabel>
                <Select
                  labelId='subject-select-label'
                  value={selectedSubject || ''}
                  label='Materia'
                  onChange={(e: SelectChangeEvent) => setSelectedSubject(e.target.value === '' ? null : e.target.value)}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY_COLOR },
                    height: '45px'
                  }}
                >
                  <MenuItem value=''>Todas las Materias</MenuItem>
                  {grades.map((g, idx) => (
                    <MenuItem key={idx} value={g.asignatura}>
                      {g.asignatura}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size='small'>
                <InputLabel id='corte-select-label' sx={{ color: '#666' }}>
                  Corte Académico
                </InputLabel>
                <Select
                  labelId='corte-select-label'
                  value={selectedCorteTab || ''}
                  label='Corte Académico'
                  onChange={(e: SelectChangeEvent) =>
                    setSelectedCorteTab(e.target.value === '' ? null : e.target.value)
                  }
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY_COLOR },
                    height: '45px'
                  }}
                >
                  <MenuItem value=''>Todos los Cortes</MenuItem>
                  {allAvailableCortes.map((c, idx) => (
                    <MenuItem key={idx} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {sortedCortes.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, opacity: 0.3 }}>
              <i className='ri-file-info-line' style={{ fontSize: '3.5rem', marginBottom: '1rem' }} />
              <Typography variant='body1' sx={{ fontWeight: '500' }}>
                No se encontraron tareas.
              </Typography>
            </Box>
          ) : (
            sortedCortes.map((corteName, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: '800',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    color: '#333',
                    fontSize: '1.25rem'
                  }}
                >
                  <Box sx={{ width: 4, height: 26, bgcolor: PRIMARY_COLOR, borderRadius: 1 }} />
                  {corteName}
                </Typography>

                <Box>
                  {tasksByCorte[corteName].map((task: Task, tIndex: number) => (
                    <Box key={tIndex} sx={{ display: 'flex', mb: 2 }}>
                      {/* Timeline Dot & Line */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2.5 }}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: PRIMARY_COLOR,
                            border: '3px solid white',
                            boxShadow: '0 2px 5px rgba(92, 97, 242, 0.3)',
                            zIndex: 1,
                            mt: 2
                          }}
                        />
                        <Box sx={{ flexGrow: 1, width: 2, bgcolor: '#F0F0F0', minHeight: 40 }} />
                      </Box>

                      {/* Task Card */}
                      <Card
                        elevation={0}
                        sx={{
                          flexGrow: 1,
                          borderRadius: '18px',
                          border: '1px solid #F0F0F0',
                          bgcolor: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            borderColor: PRIMARY_COLOR,
                            bgcolor: '#FAFAFF',
                            transform: 'translateX(5px)'
                          }
                        }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                            <Box
                              sx={{
                                bgcolor: SUBJECT_BADGE_BG,
                                color: PRIMARY_COLOR,
                                fontWeight: '700',
                                fontSize: '0.75rem',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '6px'
                              }}
                            >
                              {task.asignatura_nombre}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {task.is_daily ? (
                                <Box
                                  sx={{
                                    bgcolor: '#E6FFFA',
                                    color: '#2C7A7B',
                                    px: 2,
                                    py: 0.8,
                                    borderRadius: '10px',
                                    border: '1px solid #B2F5EA'
                                  }}
                                >
                                  <Typography variant='caption' sx={{ fontWeight: '800', fontSize: '0.85rem' }}>
                                    Nota Diaria: {task.nota_cualitativa || '-'}
                                  </Typography>
                                </Box>
                              ) : (
                                <>
                                  {tieneDeuda ? (
                                    <Box
                                      sx={{
                                        bgcolor: '#FFF5F5',
                                        p: 1,
                                        borderRadius: '8px',
                                        border: '1px solid #FED7D7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                      }}
                                    >
                                      <i className='ri-lock-2-fill' style={{ color: '#E53E3E', fontSize: '1rem' }} />
                                      <Typography variant='caption' sx={{ color: '#E53E3E', fontWeight: '800' }}>
                                        BLOQUEADO
                                      </Typography>
                                    </Box>
                                  ) : task.nota_estudiante !== null ? (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        mr: 1
                                      }}
                                    >
                                      <Typography
                                        variant='h5'
                                        sx={{
                                          fontWeight: '900',
                                          color: PRIMARY_COLOR,
                                          lineHeight: 1,
                                          fontSize: '1.4rem'
                                        }}
                                      >
                                        {task.nota_estudiante}
                                        <span style={{ fontSize: '0.9rem', color: '#999', fontWeight: '700' }}>
                                          /{task.puntaje_maximo}
                                        </span>
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Box
                                      sx={{
                                        bgcolor: POINTS_BADGE_BG,
                                        px: 2,
                                        py: 0.8,
                                        borderRadius: '10px',
                                        border: '1px solid #F0F0F0'
                                      }}
                                    >
                                      <Typography
                                        variant='caption'
                                        sx={{ fontWeight: '700', color: '#444', fontSize: '0.85rem' }}
                                      >
                                        {task.puntaje_maximo} pts
                                      </Typography>
                                    </Box>
                                  )}
                                </>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant='h6'
                                sx={{
                                  fontWeight: '700',
                                  color: '#2C3E50',
                                  mb: 1,
                                  fontSize: '1.05rem',
                                  lineHeight: 1.3
                                }}
                              >
                                {task.nombre}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <i className='ri-calendar-line' style={{ fontSize: '1rem', color: '#999' }} />
                                <Typography
                                  variant='caption'
                                  sx={{ color: '#999', fontSize: '0.85rem', fontWeight: '500' }}
                                >
                                  {formatDate(task.fecha_entrega || task.fecha)}
                                </Typography>
                              </Box>
                              {task.realizada_en && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                                  <i
                                    className='ri-checkbox-circle-line'
                                    style={{ fontSize: '1rem', color: '#4CAF50' }}
                                  />
                                  <Typography
                                    variant='caption'
                                    sx={{ color: '#4CAF50', fontSize: '0.85rem', fontWeight: '600' }}
                                  >
                                    Realizada en: {task.realizada_en}
                                  </Typography>
                                </Box>
                              )}
                              {(task.observacion || task.retroalimentacion) && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    p: 1.5,
                                    bgcolor: task.retroalimentacion ? '#F0FFF4' : '#F8F9FA',
                                    borderRadius: '10px',
                                    border: task.retroalimentacion ? '1px solid #C6F6D5' : '1px dashed #E0E0E0',
                                    maxWidth: '90%'
                                  }}
                                >
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      color: task.retroalimentacion ? '#2F855A' : '#7F8C8D',
                                      fontWeight: '700',
                                      display: 'block',
                                      textTransform: 'uppercase',
                                      fontSize: '0.65rem',
                                      mb: 0.5
                                    }}
                                  >
                                    {task.retroalimentacion ? 'Retroalimentación' : 'Observación'}
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      color: '#2C3E50',
                                      fontSize: '0.85rem',
                                      fontStyle: 'italic',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {task.retroalimentacion || task.observacion}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <i
                              className='ri-arrow-right-s-line'
                              style={{ fontSize: '1.8rem', color: '#DDD', marginLeft: '8px' }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))
          )}
        </TabPanel>

        <TabPanel value='boletin' sx={{ p: { xs: 2, sm: 3 } }}>
          {grades.map((grade, index) => {
            const isInicial = grade.es_inicial

            return (
              <Card
                key={index}
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: '20px',
                  border: '1px solid #F0F0F0',
                  bgcolor: 'white',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}
              >
                <Box sx={{ p: 2.5, bgcolor: '#FDFFFF', borderBottom: '1px solid #F8F9FA' }}>
                  <Typography variant='h6' sx={{ fontWeight: '700', color: '#2C3E50', fontSize: '1.15rem' }}>
                    {grade.asignatura}
                  </Typography>
                </Box>

                <TableContainer sx={{ px: 1, pb: 1 }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        {isInicial ? (
                          <>
                            <TableCell
                              sx={{ border: 'none', fontWeight: '700', color: '#9DA4B0', py: 2, fontSize: '0.85rem' }}
                            >
                              ASIGNATURA
                            </TableCell>
                            <TableCell
                              align='center'
                              sx={{ border: 'none', fontWeight: '700', color: '#9DA4B0', py: 2, fontSize: '0.85rem' }}
                            >
                              ESCALA
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell
                              align='center'
                              sx={{
                                border: 'none',
                                fontWeight: '700',
                                color: '#9DA4B0',
                                py: 2.5,
                                fontSize: '0.85rem',
                                width: '18%'
                              }}
                            >
                              IC
                            </TableCell>
                            <TableCell
                              align='center'
                              sx={{
                                border: 'none',
                                fontWeight: '700',
                                color: '#9DA4B0',
                                py: 2.5,
                                fontSize: '0.85rem',
                                width: '18%'
                              }}
                            >
                              IIC
                            </TableCell>
                            <TableCell
                              align='center'
                              sx={{
                                border: 'none',
                                fontWeight: '700',
                                color: '#9DA4B0',
                                py: 2.5,
                                fontSize: '0.85rem',
                                width: '18%'
                              }}
                            >
                              IIIC
                            </TableCell>
                            <TableCell
                              align='center'
                              sx={{
                                border: 'none',
                                fontWeight: '700',
                                color: '#9DA4B0',
                                py: 2.5,
                                fontSize: '0.85rem',
                                width: '18%'
                              }}
                            >
                              IVC
                            </TableCell>
                            <TableCell
                              align='center'
                              sx={{
                                border: 'none',
                                fontWeight: '700',
                                color: '#9DA4B0',
                                py: 2.5,
                                fontSize: '0.85rem',
                                width: '28%'
                              }}
                            >
                              PROM.
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {isInicial ? (
                          <>
                            <TableCell sx={{ border: 'none', py: 3, fontWeight: '600', color: '#333' }}>
                              {grade.asignatura}
                            </TableCell>
                            <TableCell align='center' sx={{ border: 'none', py: 3 }}>
                              <Chip
                                label={grade.cortes[0]?.escala || '-'}
                                size='small'
                                sx={{
                                  fontWeight: '800',
                                  bgcolor: PRIMARY_COLOR,
                                  color: 'white',
                                  borderRadius: '8px',
                                  px: 1
                                }}
                              />
                            </TableCell>
                          </>
                        ) : (
                          <>
                            {[0, 1, 2, 3].map(i => {
                              const corte = grade.cortes[i]
                              const publicado = corte ? isPublicado(corte) : false
                              const hasData =
                                corte && publicado && (corte.total > 0 || corte.tareas.length > 0 || corte.observacion)

                              return (
                                <TableCell
                                  key={i}
                                  align='center'
                                  sx={{
                                    border: 'none',
                                    py: 3.5,
                                    cursor: hasData ? 'pointer' : 'default',
                                    color: publicado ? PRIMARY_COLOR : '#9DA4B0',
                                    fontWeight: '800',
                                    fontSize: '1.2rem',
                                    borderRadius: '12px',
                                    '&:hover': hasData ? { bgcolor: '#F5F6FF' } : {}
                                  }}
                                  onClick={() => hasData && handleCorteClick(corte)}
                                >
                                  {publicado ? (
                                    corte.total % 1 === 0 ? (
                                      tieneDeuda ? (
                                        <i className='ri-lock-2-fill' style={{ color: '#E53E3E', fontSize: '1rem' }} />
                                      ) : (
                                        corte.total
                                      )
                                    ) : (
                                      corte.total.toFixed(0)
                                    )
                                  ) : (
                                    <i className='ri-lock-2-line' style={{ fontSize: '1.2rem', color: '#ecc94b' }} />
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell align='center' sx={{ border: 'none', py: 3.5 }}>
                              {(() => {
                                const corteIV =
                                  grade.cortes.find((c: Corte) => c.orden === 4) ||
                                  grade.cortes[3] ||
                                  grade.cortes[grade.cortes.length - 1]
                                const promPublicado = corteIV ? isPublicado(corteIV) : false

                                return (
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      width: 54,
                                      height: 52,
                                      bgcolor: promPublicado ? SECONDARY_COLOR : '#f4f4f4',
                                      color: promPublicado ? PRIMARY_COLOR : '#999',
                                      borderRadius: '14px',
                                      fontWeight: '900',
                                      fontSize: '1.2rem',
                                      boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    {promPublicado ? (
                                      grade.promedio_final % 1 === 0 ? (
                                        tieneDeuda ? (
                                          <i className='ri-lock-2-fill' style={{ color: '#E53E3E' }} />
                                        ) : (
                                          grade.promedio_final
                                        )
                                      ) : (
                                        grade.promedio_final.toFixed(0)
                                      )
                                    ) : (
                                      <i className='ri-lock-2-line' style={{ fontSize: '1rem' }} />
                                    )}
                                  </Box>
                                )
                              })()}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )
          })}
        </TabPanel>
      </TabContext>

      {/* Styled Modals for Premium Experience */}
      <Dialog
        open={isCorteModalOpen}
        onClose={() => setIsCorteModalOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: { borderRadius: '28px', p: 1.5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: 2.5 }}>
          <Typography variant='h6' sx={{ fontWeight: '800', color: '#2C3E50' }}>
            Detalle de Periodo
          </Typography>
          <IconButton onClick={() => setIsCorteModalOpen(false)} sx={{ bgcolor: '#F8F9FA', color: '#333' }}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5 }}>
          {selectedCorte?.observacion && (
            <Box
              sx={{
                mb: 4,
                mt: 1,
                p: 3,
                bgcolor: '#F5F6FF',
                borderRadius: '22px',
                borderLeft: `6px solid ${PRIMARY_COLOR}`
              }}
            >
              <Typography
                variant='caption'
                sx={{
                  fontWeight: '800',
                  color: PRIMARY_COLOR,
                  display: 'block',
                  mb: 1,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              >
                Nota del Periodo
              </Typography>
              <Typography
                variant='body2'
                sx={{ fontStyle: 'italic', color: '#34495E', lineHeight: 1.7, fontSize: '0.95rem' }}
              >
                "{selectedCorte.observacion}"
              </Typography>
            </Box>
          )}

          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: '800',
              mb: 2,
              color: '#9DA4B0',
              px: 1,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: 0.5
            }}
          >
            Tareas Realizadas
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {selectedCorte?.tareas.length === 0 ? (
              <Typography variant='body2' sx={{ textAlign: 'center', py: 4, color: '#CCC' }}>
                No hay tareas para este periodo.
              </Typography>
            ) : (
              selectedCorte?.tareas.map((task, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2.5,
                    borderRadius: '20px',
                    bgcolor: '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: '#F0F2FF', transform: 'translateY(-2px)' },
                    border: '1px solid #F0F0F0'
                  }}
                  onClick={() => handleTaskClick(task)}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='subtitle1' sx={{ fontWeight: '700', color: '#2C3E50', mb: 0.5 }}>
                      {task.nombre}
                    </Typography>
                    <Typography variant='caption' sx={{ color: '#7F8C8D', fontWeight: '500' }}>
                      {task.puntaje_maximo} puntos posibles
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant='h6' sx={{ fontWeight: '900', color: PRIMARY_COLOR, lineHeight: 1 }}>
                      {task.nota_estudiante || 0}
                    </Typography>
                    <Typography variant='caption' sx={{ fontWeight: '700', color: '#BDBDBD', fontSize: '0.65rem' }}>
                      NOTA
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: { borderRadius: '28px', p: 1.5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5 }}>
          <Typography variant='h6' sx={{ fontWeight: '800', color: '#2C3E50', fontSize: '1.2rem', lineHeight: 1.2 }}>
            {selectedTask?.nombre}
          </Typography>
          <IconButton onClick={() => setIsTaskModalOpen(false)} sx={{ bgcolor: '#F8F9FA' }}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={selectedTask?.asignatura_nombre}
                size='small'
                sx={{ bgcolor: SECONDARY_COLOR, color: PRIMARY_COLOR, fontWeight: '800', borderRadius: '8px' }}
              />
              {selectedTask?.realizada_en && (
                <Chip
                  label={`En: ${selectedTask.realizada_en}`}
                  size='small'
                  variant='outlined'
                  sx={{ color: '#7F8C8D', fontWeight: '700', borderRadius: '8px', border: '1px solid #E0E0E0' }}
                />
              )}
            </Box>
            <Typography variant='subtitle2' sx={{ fontWeight: '800', color: '#7F8C8D' }}>
              {selectedTask?.is_daily
                ? `Nota Diaria: ${selectedTask?.nota_cualitativa || '-'}`
                : `Peso: ${selectedTask?.puntaje_maximo} pts`}
            </Typography>
          </Box>

          {!selectedTask?.is_daily && selectedTask?.nota_estudiante !== null && (
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: '24px',
                background: tieneDeuda
                  ? 'linear-gradient(135deg, #FF7675 0%, #D63031 100%)'
                  : `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
                Calificación Obtenida
              </Typography>
              {tieneDeuda ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <i className='ri-lock-2-fill' style={{ color: 'white', fontSize: '2.5rem' }} />
                  <Typography variant='h4' sx={{ color: 'white', fontWeight: '900' }}>
                    BLOQUEADO
                  </Typography>
                </Box>
              ) : (
                <Typography variant='h3' sx={{ color: 'white', fontWeight: '900' }}>
                  {selectedTask?.nota_estudiante}{' '}
                  <small style={{ fontSize: '1.2rem', opacity: 0.8 }}>/ {selectedTask?.puntaje_maximo}</small>
                </Typography>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          <Typography
            variant='subtitle2'
            sx={{ fontWeight: '800', mb: 1, color: '#2C3E50', textTransform: 'uppercase', fontSize: '0.75rem' }}
          >
            {selectedTask?.is_daily ? 'Detalle de la Evidencia' : 'Instrucciones'}
          </Typography>
          <Typography variant='body1' sx={{ mb: 4, color: '#34495E', lineHeight: 1.8, fontSize: '1rem' }}>
            {selectedTask?.descripcion ||
              (selectedTask?.is_daily
                ? 'Evidencia diaria de clase.'
                : 'No se proporcionaron instrucciones adicionales.')}
          </Typography>

          {selectedTask?.is_daily && selectedTask.indicadores_logrados && (
            <Box sx={{ mb: 4 }}>
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: '800', mb: 2, color: '#2C3E50', textTransform: 'uppercase', fontSize: '0.75rem' }}
              >
                Indicadores de Logro
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(selectedTask.indicadores_logrados).map(([crit, achieved], idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <i
                      className={achieved ? 'ri-checkbox-fill' : 'ri-checkbox-blank-line'}
                      style={{ color: achieved ? '#38B2AC' : '#CBD5E0', fontSize: '1.2rem' }}
                    />
                    <Typography
                      variant='body2'
                      sx={{
                        color: achieved ? '#2C3E50' : '#A0AEC0',
                        textDecoration: achieved ? 'none' : 'line-through'
                      }}
                    >
                      {crit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {(selectedTask?.observacion || selectedTask?.retroalimentacion) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedTask?.observacion && (
                <Box sx={{ p: 2.5, bgcolor: '#F8F9FA', borderRadius: '20px', border: '1px dashed #E0E0E0' }}>
                  <Typography
                    variant='subtitle2'
                    sx={{ fontWeight: '800', color: PRIMARY_COLOR, mb: 1, fontSize: '0.8rem' }}
                  >
                    OBSERVACIÓN DEL DOCENTE
                  </Typography>
                  <Typography variant='body2' sx={{ fontStyle: 'italic', color: '#2C3E50' }}>
                    {selectedTask.observacion}
                  </Typography>
                </Box>
              )}

              {selectedTask?.retroalimentacion && (
                <Box sx={{ p: 2.5, bgcolor: '#F0FFF4', borderRadius: '20px', border: '1px solid #C6F6D5' }}>
                  <Typography
                    variant='subtitle2'
                    sx={{ fontWeight: '800', color: '#2F855A', mb: 1, fontSize: '0.8rem' }}
                  >
                    RETROALIMENTACIÓN
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#276749', fontWeight: '500' }}>
                    {selectedTask.retroalimentacion}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {selectedTask?.links && selectedTask.links.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: '800', mb: 2, color: '#2C3E50', textTransform: 'uppercase', fontSize: '0.75rem' }}
              >
                Enlaces de Interés
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTask.links.map((link, idx) => {
                  const url = typeof link === 'string' ? link : link.url || link.link || '#'
                  return (
                    <Chip
                      key={idx}
                      label={url}
                      onClick={() => window.open(url, '_blank')}
                      icon={<i className='ri-external-link-line' />}
                      sx={{
                        bgcolor: '#F0F4FF',
                        color: PRIMARY_COLOR,
                        fontWeight: '600',
                        borderRadius: '10px',
                        '&:hover': { bgcolor: '#E0E7FF' }
                      }}
                    />
                  )
                })}
              </Box>
            </Box>
          )}

          {selectedTask?.archivos && selectedTask.archivos.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography
                variant='subtitle2'
                sx={{ fontWeight: '800', mb: 2, color: '#2C3E50', textTransform: 'uppercase', fontSize: '0.75rem' }}
              >
                Recursos adjuntos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedTask.archivos.map((file, idx) => {
                  const name = file.name || file.nombre || 'Archivo adjunto'
                  const url = file.url || '#'
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: '#F8F9FA',
                        borderRadius: '15px',
                        border: '1px solid #F0F0F0',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#F2F4FF', borderColor: PRIMARY_COLOR }
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          bgcolor: 'white',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mr: 2,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}
                      >
                        <i
                          className={url.includes('http') ? 'ri-links-line' : 'ri-file-3-line'}
                          style={{ color: PRIMARY_COLOR, fontSize: '1.2rem' }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='body2' sx={{ fontWeight: '700', color: '#2C3E50' }}>
                          {name}
                        </Typography>
                      </Box>
                      <IconButton
                        component='a'
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{ color: PRIMARY_COLOR }}
                      >
                        <i className='ri-download-cloud-2-line' />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default GradesView
