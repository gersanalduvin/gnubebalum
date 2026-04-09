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

import parentService, { type AccountStatus } from '../services/parentService'

interface Props {
  studentId: number
}

const AccountView = ({ studentId }: Props) => {
  const [account, setAccount] = useState<AccountStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const data = await parentService.getChildAccountStatus(studentId)
        setAccount(data)
      } catch (err) {
        console.error(err)
        setError('Error al cargar el estado de cuenta.')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
        fetchAccount()
    }
  }, [studentId])

  if (loading) return <CircularProgress />
  if (error) return <Alert severity='error'>{error}</Alert>
  if (account.length === 0) return <Alert severity='info'>No hay registros de cuenta.</Alert>

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'success';
      case 'pendiente': return 'error';
      case 'parcial': return 'warning';
      default: return 'default';
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount)
  }

  return (
    <Box>
        <Typography variant='h6' className='mb-4'>
            Estado de Cuenta
        </Typography>
        <TableContainer component={Paper}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell>Concepto</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell align='right'>Monto</TableCell>
                <TableCell align='right'>Saldo</TableCell>
                <TableCell>Estado</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {account.map((item, index) => (
                <TableRow key={index}>
                <TableCell>{item.concepto}</TableCell>
                <TableCell>{item.fecha_vencimiento}</TableCell>
                <TableCell align='right'>{formatCurrency(item.monto)}</TableCell>
                <TableCell align='right'>{formatCurrency(item.saldo)}</TableCell>
                <TableCell>
                    <Chip
                        label={item.estado.toUpperCase()}
                        color={getStatusColor(item.estado) as any}
                        size='small'
                    />
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
    </Box>
  )
}

export default AccountView
