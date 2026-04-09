'use client'

import { getAssignmentMetadata } from '@/features/docente-dashboard/services/gradesService'
import { ArrowBack, HelpOutline } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
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
import DailyEvidencesTab from '../components/DailyEvidencesTab'
import GradesTab from '../components/GradesTab'
import HelpModal from '../components/HelpModal'
import ResourcesTab from '../components/ResourcesTab'

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

const GradesEntryPage = () => {
  const params = useParams()
  const router = useRouter()
  const assignmentId = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState<any | null>(null)
  const [cortes, setCortes] = useState<any[]>([])
  const [selectedCorte, setSelectedCorte] = useState<number | ''>('')
  const [tabValue, setTabValue] = useState(0)
  const [showHelpModal, setShowHelpModal] = useState(false)
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
            turno: { nombre: meta.turno }
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const currentCorte = cortes.find(c => c.id === selectedCorte)
  const isLocked = !!currentCorte?.is_locked

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
          <Box mb={3}>
            <IconButton color='primary' onClick={() => router.back()} sx={{ mb: 2 }} size='small'>
              <ArrowBack />
            </IconButton>
            <Typography variant='h4' color='error' gutterBottom sx={{ fontWeight: 'bold' }}>
              {errorStatus === 403 ? 'Acceso Denegado' : 'Error'}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {errorMessage || 'No se pudo cargar la información de la asignatura seleccionada.'}
            </Typography>
          </Box>
          <Button variant='contained' onClick={() => router.push('/docente/dashboard')}>
            Volver a mis materias
          </Button>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 2, pb: 10 }}>
      <Box mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} sx={{ mb: 1 }} size='small'>
          Volver
        </Button>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant='h6' fontWeight='bold' color='primary.main'>
                    {assignment?.materia?.nombre || 'Materia'}
                  </Typography>
                  <Tooltip title='Guía de colores y atajos'>
                    <IconButton size='small' onClick={() => setShowHelpModal(true)} color='primary'>
                      <HelpOutline fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant='body2'>
                  {assignment?.grupo?.nombre} - {assignment?.turno?.nombre}
                </Typography>
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
                  >
                    {cortes.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label='docente tabs'>
          <Tab label='Calificaciones' />
          {isInitiative && <Tab label='Evidencias Diarias' />}
          <Tab label='Materiales de Clase' />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <GradesTab assignmentId={assignmentId} selectedCorte={selectedCorte} isLocked={isLocked} />
      </CustomTabPanel>

      {isInitiative ? (
        <>
          <CustomTabPanel value={tabValue} index={1}>
            <DailyEvidencesTab assignmentId={assignmentId} selectedCorte={selectedCorte} isLocked={isLocked} />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={2}>
            <ResourcesTab
              assignmentId={assignmentId}
              selectedCorte={selectedCorte}
              cortes={cortes}
              isLocked={isLocked}
            />
          </CustomTabPanel>
        </>
      ) : (
        <CustomTabPanel value={tabValue} index={1}>
          <ResourcesTab assignmentId={assignmentId} selectedCorte={selectedCorte} cortes={cortes} isLocked={isLocked} />
        </CustomTabPanel>
      )}

      <HelpModal open={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </Container>
  )
}

export default GradesEntryPage
