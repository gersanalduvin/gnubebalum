import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
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

import parentService, { type Attendance } from '../services/parentService'

interface Props {
  studentId: number
}

const AttendanceView = ({ studentId }: Props) => {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await parentService.getChildAttendance(studentId)
        setAttendance(data)
      } catch (err) {
        console.error(err)
        setError('Error al cargar la asistencia.')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
        fetchAttendance()
    }
  }, [studentId])

  if (loading) return <CircularProgress />
  if (error) return <Alert severity='error'>{error}</Alert>
  if (attendance.length === 0) return <Alert severity='info'>No hay registros de asistencia.</Alert>

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'presente': return 'success';
      case 'ausente': return 'error';
      case 'tardanza': return 'warning';
      case 'justificado': return 'info';
      default: return 'default';
    }
  }

  return (
    <Box>
        <Typography variant='h6' className='mb-4'>
            Asistencia
        </Typography>
        <TableContainer component={Paper}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Observación</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {attendance.map((record, index) => (
                <TableRow key={index}>
                <TableCell>{record.fecha}</TableCell>
                <TableCell>
                    <Chip
                        label={record.estado.toUpperCase()}
                        color={getStatusColor(record.estado) as any}
                        size='small'
                    />
                </TableCell>
                <TableCell>{record.observacion || '-'}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
    </Box>
  )
}

export default AttendanceView
