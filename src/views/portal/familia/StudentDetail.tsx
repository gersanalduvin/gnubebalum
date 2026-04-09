'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// Config Imports
import { i18n } from '@/configs/i18n'

// Component Imports
import AttendanceTab from './tabs/AttendanceTab'
import BillingTab from './tabs/BillingTab'
import GradesTab from './tabs/GradesTab'
import ResourcesTab from './tabs/ResourcesTab'
import ScheduleTab from './tabs/ScheduleTab'

// Service Imports
import { ChildData, ParentAccessService } from '@/services/parentAccessService'

const StudentDetail = ({ studentId }: { studentId: number }) => {
  const theme = useTheme()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = (params?.lang as string) || i18n.defaultLocale
  const lang = i18n.locales.includes(locale as any) ? locale : i18n.defaultLocale

  const activeTab = searchParams.get('tab') || 'grades'

  const [student, setStudent] = useState<ChildData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    router.push(`/${lang}/portal/familia/hijo/${studentId}?tab=${newValue}`)
  }

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const children = await ParentAccessService.getChildren()
        const found = children.find(c => c.id === studentId)
        if (found) setStudent(found)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [studentId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!student) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <i className='ri-user-unfollow-line' style={{ fontSize: 64, opacity: 0.3 }} />
        <Typography variant='h5' sx={{ mt: 2 }}>
          Estudiante no encontrado
        </Typography>
        <Button component={Link} href={`/${lang}/portal/familia`} variant='contained' sx={{ mt: 3 }}>
          Volver al listado
        </Button>
      </Box>
    )
  }

  const tabs = [
    { label: 'Calificaciones', value: 'grades', icon: 'ri-article-line' },
    { label: 'Asistencia', value: 'attendance', icon: 'ri-calendar-check-line' },
    { label: 'Horario', value: 'schedule', icon: 'ri-calendar-event-line' },
    { label: 'Recursos', value: 'resources', icon: 'ri-folder-open-line' },
    { label: 'Pagos', value: 'billing', icon: 'ri-money-dollar-circle-line' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Student Profile Header */}
      <Grid item xs={12}>
        <Card
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
            color: 'text.primary',
            overflow: 'visible',
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: theme.shadows[3]
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 4, py: 5 }}>
            <Avatar
              src={student.foto_url}
              alt={student.nombre_completo}
              sx={{
                width: 90,
                height: 90,
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: theme.shadows[3],
                fontSize: '2rem',
                bgcolor: 'action.selected',
                color: 'primary.main'
              }}
            >
              {student.nombre_completo?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='h4'
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                {student.nombre_completo}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
                <Chip
                  icon={<i className='ri-graduation-cap-line' />}
                  label={`${student.grado} ${student.seccion}`}
                  size='small'
                  variant='tonal'
                  color='secondary'
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<i className='ri-time-line' />}
                  label={student.turno}
                  size='small'
                  variant='tonal'
                  color='info'
                  sx={{ fontWeight: 600 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                  <i className='ri-presentation-line' style={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                  <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Guía:{' '}
                    <Box component='span' sx={{ color: 'text.primary', fontWeight: 700 }}>
                      {student.docente_guia_nombre || 'Sin asignar'}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Button
                variant='outlined'
                component={Link}
                href={`/${lang}/portal/familia`}
                startIcon={<i className='ri-arrow-left-line' />}
                sx={{
                  color: 'text.primary',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' }
                }}
              >
                Volver
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Tabs Section */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TabContext value={activeTab}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Vertical Tabs Navigation */}
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  borderRight: { md: '1px solid' },
                  borderBottom: { xs: '1px solid', md: 'none' },
                  borderColor: 'divider',
                  minWidth: { md: 210 },
                  py: 1
                }}
              >
                <TabList
                  onChange={handleChange}
                  aria-label='student tabs'
                  orientation='vertical'
                  variant='scrollable'
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 52,
                      justifyContent: 'flex-start',
                      px: 4,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        color: 'primary.main',
                        fontWeight: 600,
                        bgcolor: 'background.paper'
                      },
                      '&:hover': {
                        bgcolor: 'background.paper',
                        color: 'primary.main'
                      }
                    },
                    '& .MuiTabs-indicator': {
                      left: 0,
                      right: 'auto',
                      width: 3,
                      borderRadius: '0 4px 4px 0'
                    }
                  }}
                >
                  {tabs.map(tab => (
                    <Tab
                      key={tab.value}
                      label={tab.label}
                      value={tab.value}
                      icon={<i className={tab.icon} />}
                      iconPosition='start'
                    />
                  ))}
                </TabList>
              </Box>

              {/* Tab Content Panels */}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <TabPanel value='grades' sx={{ p: { xs: 3, md: 5 } }}>
                  <GradesTab studentId={studentId} />
                </TabPanel>
                <TabPanel value='attendance' sx={{ p: { xs: 3, md: 5 } }}>
                  <AttendanceTab studentId={studentId} />
                </TabPanel>
                <TabPanel value='schedule' sx={{ p: 0 }}>
                  <ScheduleTab studentId={studentId} />
                </TabPanel>

                <TabPanel value='resources' sx={{ p: 0 }}>
                  <ResourcesTab studentId={studentId} />
                </TabPanel>

                <TabPanel value='billing' sx={{ p: 0 }}>
                  <BillingTab studentId={studentId} />
                </TabPanel>
              </Box>
            </Box>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default StudentDetail
