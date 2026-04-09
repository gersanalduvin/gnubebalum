import { Close as CloseIcon } from '@mui/icons-material'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { format } from 'date-fns'
import { ReporteActividadesData } from '../services/reporteActividadesService'

interface ActividadesModalProps {
  open: boolean
  onClose: () => void
  actividades: ReporteActividadesData['lineas'][number]['actividades_por_semana'][string] | null
  semanaRango: string
  asignatura: string
}

export const ActividadSemanaModal = ({
  open,
  onClose,
  actividades,
  semanaRango,
  asignatura
}: ActividadesModalProps) => {
  const columns: GridColDef[] = [
    {
      field: 'actividad',
      headerName: 'ACTIVIDAD',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'fecha_creacion',
      headerName: 'FECHA CREACIÓN',
      width: 180,
      renderCell: params => {
        try {
          return format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss')
        } catch {
          return params.value
        }
      }
    },
    {
      field: 'tipo',
      headerName: 'TIPO',
      width: 150
    }
  ]

  const rows = (actividades || []).map((act, index) => ({
    id: index,
    ...act
  }))

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h6'>Lista de actividades</Typography>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Typography variant='body2' color='text.secondary'>
          <strong>Asignatura:</strong> {asignatura}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          <strong>Semana:</strong> {semanaRango}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            hideFooterPagination={rows.length <= 100}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}
