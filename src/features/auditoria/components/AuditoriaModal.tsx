'use client'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { auditoriaService } from '../services/auditoriaService'

type Props = {
  open: boolean
  model: string
  id: number
  onClose: () => void
}

const formatISO = (iso: string) => {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  } catch {
    return iso
  }
}

export default function AuditoriaModal({ open, model, id, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const summary = await auditoriaService.getSummary(model, id)
        setData(summary?.data || summary)
      } catch (e: any) {
        const msg = e?.data?.message || e?.message || 'Error al cargar la auditoría'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    if (open && model && id) fetchData()
  }, [open, model, id])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Historial de Cambios</DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        )}
        {error && (
          <Alert severity="error">{error}</Alert>
        )}
        {!loading && !error && data && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="subtitle1">Creado por: {data?.creado_por?.nombre ?? 'N/D'}</Typography>
              <Typography variant="body2" color="text.secondary">Fecha: {formatISO(data?.creado_por?.created_at)}</Typography>
            </Box>
            {(Array.isArray(data?.historial) && data.historial.length > 0) ? (
              data.historial.map((item: any, idx: number) => (
                <Accordion key={idx} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle2">
                        {String(item.event)} • {formatISO(item.fecha)}{item?.usuario?.nombre ? ` • ${String(item.usuario.nombre)}` : ''}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Campo</TableCell>
                            <TableCell>Antes</TableCell>
                            <TableCell>Después</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(item.cambios || []).map((c: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{String(c.campo)}</TableCell>
                              <TableCell>{String(c.de)}</TableCell>
                              <TableCell>{String(c.a)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Alert severity="info">Sin cambios registrados</Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
