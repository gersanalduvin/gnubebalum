'use client'

import { CheckCircle as IconCheck, Cancel as IconPending } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { getAvisoStatistics, type AvisoStats } from '../services/avisoService'

interface AvisoStatsDialogProps {
  open: boolean
  onClose: () => void
  avisoId: number | null
  titulo: string
}

export default function AvisoStatsDialog({ open, onClose, avisoId, titulo }: AvisoStatsDialogProps) {
  const [stats, setStats] = useState<AvisoStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && avisoId) {
      const fetchStats = async () => {
        setLoading(true)
        try {
          const data = await getAvisoStatistics(avisoId)
          setStats(data)
        } catch (error) {
          console.error('Error fetching stats:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchStats()
    }
  }, [open, avisoId])

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Estadísticas de Lectura: {titulo}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Box>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant='h4' color='primary'>
                    {stats.total_destinatarios}
                  </Typography>
                  <Typography variant='body2'>Destinatarios</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant='h4' color='success.main'>
                    {stats.total_lecturas}
                  </Typography>
                  <Typography variant='body2'>Leídos</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='body2'>Progreso de lectura</Typography>
                    <Typography variant='body2' fontWeight='bold'>
                      {stats.porcentaje_lectura}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant='determinate'
                    value={stats.porcentaje_lectura}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>
            </Grid>

            <Typography variant='subtitle2' gutterBottom>
              Detalle por Estudiante / Familia
            </Typography>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              Detalle por Estudiante / Familia
            </Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Usuario</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.detalles?.map((det, index) => (
                    <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{det.usuario?.[0] || 'U'}</Avatar>
                          {det.usuario}
                        </Box>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {det.leido ? (
                          <Chip size='small' icon={<IconCheck />} label='Leído' color='success' variant='outlined' />
                        ) : (
                          <Chip size='small' icon={<IconPending />} label='Pendiente' variant='outlined' />
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'text.secondary' }}>
                        {det.leido
                          ? new Date(det.fecha_lectura).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {(!stats.detalles || stats.detalles.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'text.secondary' }}>
                        No hay información de destinatarios individuales
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>
          </Box>
        ) : (
          <Typography>No se pudieron cargar las estadísticas</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
