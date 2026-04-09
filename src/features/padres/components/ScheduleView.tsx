import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import parentService, { type ScheduleItem } from '../services/parentService'

interface Props {
  studentId: number
}

const ScheduleView = ({ studentId }: Props) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await parentService.getChildSchedule(studentId)
        setSchedule(data)
      } catch (err) {
        console.error(err)
        setError('Error al cargar el horario.')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
        fetchSchedule()
    }
  }, [studentId])

  if (loading) return <CircularProgress />
  if (error) return <Alert severity='error'>{error}</Alert>
  if (schedule.length === 0) return <Alert severity='info'>No hay horario asignado.</Alert>

  return (
    <Box>
        <Typography variant='h6' className='mb-4'>
            Horario de Clases
        </Typography>
        <TableContainer component={Paper}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell>Día</TableCell>
                <TableCell>Horario</TableCell>
                <TableCell>Materia</TableCell>
                <TableCell>Aula</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {schedule.map((item, index) => (
                <TableRow key={index}>
                <TableCell>{item.dia}</TableCell>
                <TableCell>{item.hora_inicio} - {item.hora_fin}</TableCell>
                <TableCell>{item.materia}</TableCell>
                <TableCell>{item.aula || '-'}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
    </Box>
  )
}

export default ScheduleView
