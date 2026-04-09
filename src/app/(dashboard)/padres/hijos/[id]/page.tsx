'use client'

import { useParams, useRouter } from 'next/navigation'
import { SyntheticEvent, useEffect, useState } from 'react'

// MUI Imports
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'

// Component Imports
import AccountView from '@/features/padres/components/AccountView'
import AttendanceView from '@/features/padres/components/AttendanceView'
import GradesView from '@/features/padres/components/GradesView'
import ScheduleView from '@/features/padres/components/ScheduleView'

// Service Imports
import parentService, { type Student } from '@/features/padres/services/parentService'

const ChildDetail = () => {
  const params = useParams()
  const router = useRouter()
  const studentId = Number(params.id)

  const [value, setValue] = useState('grades')
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
        if (!studentId) return;

        try {
            // Reusing getMyChildren to find the specific student info for the header
            // Optimally, we would have a specific endpoint, but this works for now
            const children = await parentService.getMyChildren()
            const found = children.find(c => c.id === studentId)
            if (found) {
                setStudent(found)
            } else {
                // If not found in my children, redirect or show error
                router.push('/padres')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    fetchStudent()
  }, [studentId, router])

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  if (loading) return <CircularProgress />

  if (!student) return null

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <div className='flex justify-between items-center mb-4'>
            <Button onClick={() => router.push('/padres')} startIcon={<i className='ri-arrow-left-line' />}>
                Volver
            </Button>
        </div>

        <Card className='mb-6'>
            <CardContent className='flex items-center gap-4'>
                <Avatar
                    src={student.foto_url}
                    alt={student.nombre_completo}
                    sx={{ width: 60, height: 60 }}
                >
                    {student.nombre_completo.charAt(0)}
                </Avatar>
                <Box>
                    <Typography variant='h5'>{student.nombre_completo}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                        {student.grado} - {student.seccion} | {student.codigo_unico}
                    </Typography>
                </Box>
            </CardContent>
        </Card>

        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label='student tabs'>
              <Tab label='Calificaciones' value='grades' icon={<i className='ri-file-list-3-line' />} iconPosition='start' />
              <Tab label='Asistencia' value='attendance' icon={<i className='ri-calendar-check-line' />} iconPosition='start' />
              <Tab label='Horario' value='schedule' icon={<i className='ri-time-line' />} iconPosition='start' />
              <Tab label='Estado de Cuenta' value='account' icon={<i className='ri-money-dollar-circle-line' />} iconPosition='start' />
            </TabList>
          </Box>
          <TabPanel value='grades'>
            <GradesView studentId={studentId} />
          </TabPanel>
          <TabPanel value='attendance'>
            <AttendanceView studentId={studentId} />
          </TabPanel>
          <TabPanel value='schedule'>
            <ScheduleView studentId={studentId} />
          </TabPanel>
          <TabPanel value='account'>
            <AccountView studentId={studentId} />
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  )
}

export default ChildDetail
