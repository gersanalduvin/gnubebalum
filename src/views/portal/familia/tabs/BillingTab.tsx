'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { ParentAccessService } from '@/services/parentAccessService'

const BillingTab = ({ studentId }: { studentId: number }) => {
  const [recibos, setRecibos] = useState<any[]>([])
  const [totalRecibos, setTotalRecibos] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [aranceles, setAranceles] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingRecibos, setLoadingRecibos] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState<number>(0)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const [billingRes, feesRes] = await Promise.all([
          ParentAccessService.getBilling(studentId, { page: 1, per_page: rowsPerPage }),
          ParentAccessService.getFees(studentId)
        ])

        const paginator = billingRes.data || billingRes
        setRecibos(Array.isArray(paginator.data) ? paginator.data : Array.isArray(paginator) ? paginator : [])
        setTotalRecibos(paginator.total || (Array.isArray(paginator) ? paginator.length : 0))

        const feesData = feesRes
        setAranceles(Array.isArray(feesData) ? feesData : [])
      } catch (err: any) {
        console.error(err)
        setError('Error al cargar la información financiera.')
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetchInitialData()
  }, [studentId])

  const fetchRecibos = async (newPage: number, newRowsPerPage: number) => {
    try {
      setLoadingRecibos(true)
      const billingRes = await ParentAccessService.getBilling(studentId, {
        page: newPage + 1,
        per_page: newRowsPerPage
      })
      const paginator = billingRes.data || billingRes
      setRecibos(Array.isArray(paginator.data) ? paginator.data : Array.isArray(paginator) ? paginator : [])
      setTotalRecibos(paginator.total || (Array.isArray(paginator) ? paginator.length : 0))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingRecibos(false)
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
    fetchRecibos(newPage, rowsPerPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    setRowsPerPage(newRowsPerPage)
    setPage(0)
    fetchRecibos(0, newRowsPerPage)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const pendientes = aranceles.filter(a => a.estado === 'pendiente')
  const pagados = aranceles.filter(a => a.estado === 'pagado')

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) return <Alert severity='error'>{error}</Alert>

  // Summary cards
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isOverdue = (dateStr: any) => {
    if (!dateStr) return false
    return dayjs(dateStr).startOf('day').isBefore(dayjs().startOf('day'))
  }

  const totalPendiente = pendientes.reduce((sum, f) => sum + parseFloat(f.saldo_actual || 0), 0)
  const totalVencido = pendientes
    .filter(f => isOverdue(f.fecha_vencimiento))
    .reduce((sum, f) => sum + parseFloat(f.saldo_actual || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
      .format(amount)
      .replace('$', 'C$ ')
  }

  const renderFeesTable = (fees: any[], isPaid: boolean = false) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 600 }}>Rubro</TableCell>
            <TableCell align='right' sx={{ fontWeight: 600 }}>
              {isPaid ? 'Monto Pagado' : 'Saldo'}
            </TableCell>
            <TableCell align='center' sx={{ fontWeight: 600 }}>
              Estado
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fees.length > 0 ? (
            fees.map((fee: any) => (
              <TableRow
                key={fee.id}
                sx={{
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:last-child td': { borderBottom: 0 }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {fee.rubro?.nombre || fee.rubro?.concepto || 'Cuota'}
                    </Typography>
                    {fee.estado === 'pendiente' && isOverdue(fee.fecha_vencimiento) && (
                      <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        VENCIDO
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {formatCurrency(parseFloat(isPaid ? fee.saldo_pagado || fee.importe_total : fee.saldo_actual))}
                  </Typography>
                </TableCell>
                <TableCell align='center'>
                  <Chip
                    label={fee.estado.toUpperCase()}
                    color={fee.estado === 'pagado' ? 'success' : 'warning'}
                    size='small'
                    variant='tonal'
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} align='center' sx={{ py: 6 }}>
                <i
                  className='ri-file-list-3-line'
                  style={{ fontSize: 36, opacity: 0.3, display: 'block', margin: '0 auto 8px' }}
                />
                <Typography variant='body2' color='text.secondary'>
                  No se encontraron registros
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Card
          variant='outlined'
          sx={{
            flex: '1 1 200px',
            borderColor: pendientes.length > 0 ? 'warning.main' : 'divider'
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'warning.lighter',
                color: 'warning.main',
                flexShrink: 0
              }}
            >
              <i className='ri-time-line' style={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Saldo Pendiente
              </Typography>
              <Typography variant='h5' sx={{ fontWeight: 700, color: 'warning.main' }}>
                {formatCurrency(totalPendiente)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card variant='outlined' sx={{ flex: '1 1 200px' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'error.lighter',
                color: 'error.main',
                flexShrink: 0
              }}
            >
              <i className='ri-error-warning-line' style={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Total Vencido
              </Typography>
              <Typography variant='h5' sx={{ fontWeight: 700, color: 'error.main' }}>
                {formatCurrency(totalVencido)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label='billing tabs'
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48
              }
            }}
          >
            <Tab
              label={`Pendientes (${pendientes.length})`}
              icon={<i className='ri-time-line' />}
              iconPosition='start'
            />
            <Tab label='Pagados' icon={<i className='ri-checkbox-circle-line' />} iconPosition='start' />
            <Tab label='Historial de Recibos' icon={<i className='ri-file-list-line' />} iconPosition='start' />
          </Tabs>
        </Box>

        <Box>
          {tabValue === 0 && renderFeesTable(pendientes, false)}
          {tabValue === 1 && renderFeesTable(pagados, true)}
          {tabValue === 2 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>N° Recibo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Concepto</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>
                      Monto
                    </TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>
                      Estado
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recibos.length > 0 ? (
                    recibos.map((recibo: any) => (
                      <TableRow
                        key={recibo.id}
                        sx={{
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'action.hover' },
                          '&:last-child td': { borderBottom: 0 }
                        }}
                      >
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {recibo.numero_recibo}
                          </Typography>
                        </TableCell>
                        <TableCell>{new Date(recibo.fecha).toLocaleDateString()}</TableCell>
                        <TableCell>{recibo.concepto || 'Pago de servicios educativos'}</TableCell>
                        <TableCell align='right'>
                          <Typography sx={{ fontWeight: 600 }}>{formatCurrency(parseFloat(recibo.total))}</Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={recibo.recibo_estado || 'Pagado'}
                            color={recibo.recibo_estado === 'anulado' ? 'error' : 'success'}
                            size='small'
                            variant='tonal'
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align='center' sx={{ py: 6 }}>
                        <i
                          className='ri-file-list-3-line'
                          style={{ fontSize: 36, opacity: 0.3, display: 'block', margin: '0 auto 8px' }}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          No hay historial de recibos
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                count={totalRecibos}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage='Filas por página'
              />
            </TableContainer>
          )}
        </Box>
      </Card>
    </Box>
  )
}

export default BillingTab
