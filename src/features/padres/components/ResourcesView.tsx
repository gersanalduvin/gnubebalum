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
  TextField,
  Typography
} from '@mui/material'
import Box from '@mui/material/Box'
import { useEffect, useState } from 'react'
import parentService, { type MaterialResource } from '../services/parentService'

interface Props {
  studentId: number
}

const PRIMARY_COLOR = '#5C61F2'
const SUBJECT_BADGE_BG = '#F0F0FF'

const ResourcesView = ({ studentId }: Props) => {
  const [resources, setResources] = useState<MaterialResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedCorte, setSelectedCorte] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResource, setSelectedResource] = useState<MaterialResource | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleResourceClick = (resource: MaterialResource) => {
    setSelectedResource(resource)
    setIsModalOpen(true)
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Sin fecha'
    try {
      const date = new Date(dateStr)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (e) {
      return dateStr
    }
  }

  const filteredResources = resources.filter(res => {
    const matchesSearch =
      res.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = !selectedSubject || res.asignatura_nombre === selectedSubject
    const matchesCorte = !selectedCorte || res.corte_nombre === selectedCorte
    return matchesSearch && matchesSubject && matchesCorte
  })

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await parentService.getChildResources(studentId)
        setResources(data)
      } catch (err) {
        console.error(err)
        setError('Error al cargar los recursos.')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchResources()
    }
  }, [studentId])

  if (loading)
    return (
      <Box className='flex justify-center p-8'>
        <CircularProgress />
      </Box>
    )
  if (error) return <Alert severity='error'>{error}</Alert>
  if (resources.length === 0) return <Alert severity='info'>No hay recursos publicados para este estudiante.</Alert>

  const allSubjects = Array.from(new Set(resources.map(r => r.asignatura_nombre))).sort()
  const allCortes = Array.from(new Set(resources.map(r => r.corte_nombre))).sort()

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder='Buscar material...'
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
              {allSubjects.map((s, idx) => (
                <MenuItem key={idx} value={s}>
                  {s}
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
              value={selectedCorte || ''}
              label='Corte Académico'
              onChange={(e: SelectChangeEvent) => setSelectedCorte(e.target.value === '' ? null : e.target.value)}
              sx={{
                borderRadius: 3,
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY_COLOR },
                height: '45px'
              }}
            >
              <MenuItem value=''>Todos los Cortes</MenuItem>
              {allCortes.map((c, idx) => (
                <MenuItem key={idx} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {filteredResources.map((res, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              onClick={() => handleResourceClick(res)}
              sx={{
                height: '100%',
                borderRadius: '20px',
                cursor: 'pointer',
                border: '1px solid #F0F0F0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(92, 97, 242, 0.08)',
                  borderColor: PRIMARY_COLOR
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={res.asignatura_nombre}
                    size='small'
                    sx={{
                      bgcolor: SUBJECT_BADGE_BG,
                      color: PRIMARY_COLOR,
                      fontWeight: '700',
                      borderRadius: '8px',
                      maxWidth: '75%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }
                    }}
                  />
                  <Typography variant='caption' sx={{ color: '#999', fontWeight: '500', flexShrink: 0 }}>
                    {formatDate(res.fecha)}
                  </Typography>
                </Box>

                <Typography variant='h6' sx={{ fontWeight: '700', color: '#2C3E50', mb: 1, lineHeight: 1.3 }}>
                  {res.titulo}
                </Typography>

                <Typography
                  variant='body2'
                  sx={{
                    color: '#7F8C8D',
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '40px'
                  }}
                >
                  {res.descripcion || 'Sin descripción'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className={res.tipo === 'archivo' ? 'ri-file-line' : 'ri-link'} style={{ color: PRIMARY_COLOR }} />
                  <Typography variant='caption' sx={{ fontWeight: '600', color: PRIMARY_COLOR }}>
                    {res.tipo === 'archivo' ? `${res.archivos.length} archivo(s)` : 'Enlace externo'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredResources.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, opacity: 0.3 }}>
          <i className='ri-file-info-line' style={{ fontSize: '3.5rem', marginBottom: '1rem' }} />
          <Typography variant='body1' sx={{ fontWeight: '500' }}>
            No se encontraron recursos.
          </Typography>
        </Box>
      )}

      {/* Modal Detalle */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        {selectedResource && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3 }}>
              <Typography variant='h5' sx={{ fontWeight: '800', color: '#2C3E50' }}>
                {selectedResource.titulo}
              </Typography>
              <IconButton onClick={() => setIsModalOpen(false)}>
                <i className='ri-close-line' />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={selectedResource.asignatura_nombre}
                    size='small'
                    sx={{ bgcolor: SUBJECT_BADGE_BG, color: PRIMARY_COLOR, fontWeight: '700' }}
                  />
                  <Chip label={selectedResource.corte_nombre} size='small' sx={{ fontWeight: '600' }} />
                </Box>
                <Typography variant='body1' sx={{ color: '#4A5568', lineHeight: 1.6 }}>
                  {selectedResource.descripcion || 'Sin descripción adicional.'}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant='subtitle1'
                sx={{ fontWeight: '700', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <i className='ri-attachment-2' style={{ color: PRIMARY_COLOR }} /> Materiales
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedResource.tipo === 'enlace' ? (
                  <Card
                    component='a'
                    href={selectedResource.contenido}
                    target='_blank'
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      textDecoration: 'none',
                      border: '1px solid #E2E8F0',
                      '&:hover': { bgcolor: '#F7FAFC' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <i className='ri-external-link-line' style={{ fontSize: '1.5rem', color: PRIMARY_COLOR }} />
                      <Box>
                        <Typography variant='subtitle2' sx={{ color: '#2D3748', fontWeight: '600' }}>
                          Abrir enlace
                        </Typography>
                        <Typography variant='caption' sx={{ color: '#718096' }}>
                          {selectedResource.contenido}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                ) : (
                  selectedResource.archivos.map((file, idx) => (
                    <Card
                      key={idx}
                      component='a'
                      href={file.url}
                      target='_blank'
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        textDecoration: 'none',
                        border: '1px solid #E2E8F0',
                        '&:hover': { bgcolor: '#F7FAFC' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <i className='ri-file-download-line' style={{ fontSize: '1.5rem', color: PRIMARY_COLOR }} />
                        <Box>
                          <Typography variant='subtitle2' sx={{ color: '#2D3748', fontWeight: '600' }}>
                            {file.nombre}
                          </Typography>
                          <Typography variant='caption' sx={{ color: '#718096' }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default ResourcesView
