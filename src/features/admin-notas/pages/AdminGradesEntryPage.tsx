'use client'

import { getAssignmentMetadata } from '@/features/docente-dashboard/services/gradesService'
import DailyEvidencesTab from '@/features/docente-dashboard/components/DailyEvidencesTab'
import GradesTab from '@/features/docente-dashboard/components/GradesTab'
import ResourcesTab from '@/features/docente-dashboard/components/ResourcesTab'
import {
  AdminPanelSettings as AdminIcon,
  ArrowBack,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

const AdminGradesEntryPage = () => {
  const params = useParams()
  const router = useRouter()
  const assignmentId = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState<any | null>(null)
  const [cortes, setCortes] = useState<any[]>([])
  const [selectedCorte, setSelectedCorte] = useState<number | ''>('')
  const [tabValue, setTabValue] = useState(0)
  const [isInitiative, setIsInitiative] = useState(false)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (!assignmentId) return
    const init = async () => {
      try {
        setLoading(true)
        const meta = await getAssignmentMetadata(assignmentId)
        if (meta) {
          setAssignment({
            materia: { nombre: meta.materia },
            grupo: { nombre: meta.grupo },
            turno: { nombre: meta.turno },
            docente: { nombre: meta.docente_nombre ?? meta.docente ?? '' }
          })
          const cortesList = meta.cortes || []
          setCortes(cortesList)
          if (cortesList.length > 0) {
            setSelectedCorte(Number(cortesList[0].id))
          }
          setIsInitiative(!!meta.es_para_educacion_iniciativa)
        }
      } catch (err: any) {
        console.error(err)
        setErrorStatus(err.status || 500)
        setErrorMessage(err.data?.message || 'Error al cargar información')
        toast.error(err.data?.message || 'Error al cargar información')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [assignmentId])

  const currentCorte = cortes.find(c => c.id === selectedCorte)
  // ⚠️ Administradores ignoran el bloqueo de corte — siempre pueden editar
  const isLocked = false

  if (loading)
    return (
      <Box p={4} display='flex' justifyContent='center'>
        <CircularProgress />
      </Box>
    )

  if (errorStatus) {
    return (
      <Container maxWidth='md' sx={{ py: 8 }}>
        <Card elevation={3} sx={{ textAlign: 'center', p: 4, borderRadius: 4 }}>
          <IconButton color='primary' onClick={() => router.back()} sx={{ mb: 2 }} size='small'>
            <ArrowBack />
          </IconButton>
          <Typography variant='h4' color='error' gutterBottom sx={{ fontWeight: 'bold' }}>
            {errorStatus === 403 ? 'Acceso Denegado' : 'Error'}
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            {errorMessage || 'No se pudo cargar la información de la asignatura seleccionada.'}
          </Typography>
          <Box mt={3}>
            <Button variant='contained' onClick={() => router.push('/admin/notas')}>
              Volver a Gestión de Notas
            </Button>
          </Box>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 2, pb: 10 }}>
      {/* Indicador de modo administrativo */}
      <Alert
        severity='warning'
        icon={<AdminIcon />}
        sx={{
          mb: 2,
          borderRadius: 2,
          fontWeight: 'medium',
          '& .MuiAlert-message': { display: 'flex', alignItems: 'center', gap: 1 }
        }}
      >
        <strong>Modo Administrativo:</strong> Estás editando notas con privilegios de administrador.
        Los cambios quedarán registrados en el sistema.
        <Chip
          icon={<LockOpenIcon sx={{ fontSize: '14px !important' }} />}
          label='Bloqueo ignorado'
          size='small'
          color='warning'
          variant='outlined'
          sx={{ ml: 1, fontSize: '0.7rem' }}
        />
      </Alert>

      <Box mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/admin/notas')} sx={{ mb: 1 }} size='small'>
          Volver a Gestión de Notas
        </Button>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant='h6' fontWeight='bold' color='primary.main'>
                      {assignment?.materia?.nombre || 'Materia'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {assignment?.grupo?.nombre} {assignment?.turno?.nombre ? `— ${assignment.turno.nombre}` : ''}
                    </Typography>
                    {assignment?.docente?.nombre && (
                      <Typography variant='caption' color='text.secondary'>
                        Docente: {assignment.docente.nombre}
                      </Typography>
                    )}
                  </Box>
                  {/* Badge admin siempre visible */}
                  <Chip
                    icon={<AdminIcon sx={{ fontSize: '14px !important' }} />}
                    label='ADMIN'
                    color='warning'
                    size='small'
                    variant='filled'
                    sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Corte Evaluativo</InputLabel>
                  <Select
                    value={selectedCorte || ''}
                    label='Corte Evaluativo'
                    onChange={e => setSelectedCorte(Number(e.target.value))}
                    sx={{ height: 40 }}
                    startAdornment={
                      currentCorte?.is_locked ? (
                        <Tooltip title='Corte cerrado (ignorado por privilegios admin)'>
                          <LockOpenIcon sx={{ ml: 1, fontSize: 16, color: 'warning.main' }} />
                        </Tooltip>
                      ) : null
                    }
                  >
                    {cortes.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                        {c.is_locked && (
                          <Chip
                            label='Cerrado'
                            size='small'
                            color='default'
                            sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} aria-label='admin-notas-tabs'>
          <Tab label='Calificaciones' />
          {isInitiative && <Tab label='Evidencias Diarias' />}
          <Tab label='Materiales de Clase' />
        </Tabs>
      </Box>

      {/* Contenido — Admin siempre con isLocked=false */}
      <CustomTabPanel value={tabValue} index={0}>
        <GradesTab assignmentId={assignmentId} selectedCorte={selectedCorte} isLocked={isLocked} />
      </CustomTabPanel>

      {isInitiative ? (
        <>
          <CustomTabPanel value={tabValue} index={1}>
            <DailyEvidencesTab assignmentId={assignmentId} selectedCorte={selectedCorte} isLocked={isLocked} />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={2}>
            <ResourcesTab assignmentId={assignmentId} selectedCorte={selectedCorte} cortes={cortes} isLocked={isLocked} />
          </CustomTabPanel>
        </>
      ) : (
        <CustomTabPanel value={tabValue} index={1}>
          <ResourcesTab assignmentId={assignmentId} selectedCorte={selectedCorte} cortes={cortes} isLocked={isLocked} />
        </CustomTabPanel>
      )}
    </Container>
  )
}

export default AdminGradesEntryPage
