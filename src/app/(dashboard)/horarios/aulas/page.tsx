'use client'

import ScheduleService, { ConfigAula } from '@/services/scheduleService'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    IconButton
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'; // Suponiendo react-toastify por package.json

// Icons
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import HistoryIcon from '@mui/icons-material/History'

// Components
import ConfirmDialog from '@/components/ConfirmDialog'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import AulaDialog from './AulaDialog'

const ConfigAulasPage = () => {
  const [aulas, setAulas] = useState<ConfigAula[]>([])
  const [loading, setLoading] = useState(false)
  
  // Dialog State
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedAula, setSelectedAula] = useState<ConfigAula | undefined>(undefined)

  // Audit State
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditId, setAuditId] = useState<number | null>(null)

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [aulaToDelete, setAulaToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAulas = async () => {
    setLoading(true)
    try {
      const data = await ScheduleService.getAulas()
      setAulas(data)
    } catch (error) {
      console.error(error)
      toast.error('Error cargando aulas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAulas()
  }, [])

  const handleDeleteClick = (id: number) => {
    setAulaToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!aulaToDelete) return

    setDeleting(true)
    try {
      await ScheduleService.deleteAula(aulaToDelete)
      toast.success('Aula eliminada')
      setDeleteConfirmOpen(false)
      fetchAulas()
    } catch (error) {
      console.error(error)
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setAulaToDelete(null)
    }
  }

  const handleEdit = (aula: ConfigAula) => {
    setSelectedAula(aula)
    setOpenDialog(true)
  }

  const handleCreate = () => {
    setSelectedAula(undefined)
    setOpenDialog(true)
  }

  const handleSave = async () => {
    setOpenDialog(false)
    fetchAulas()
  }

  const handleShowAudit = (id: number) => {
    setAuditId(id)
    setAuditOpen(true)
  }

  const columns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'tipo', headerName: 'Tipo', width: 150, renderCell: (params) => (
       <Chip label={params.value} color="primary" variant="outlined" size="small" />
    )},
    { field: 'capacidad', headerName: 'Capacidad', width: 120 },
    { field: 'activa', headerName: 'Estado', width: 120, renderCell: (params) => (
        <Chip 
          label={params.value ? 'Activa' : 'Inactiva'} 
          color={params.value ? 'success' : 'default'} 
          size="small" 
        />
    )},
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row as ConfigAula)} color="primary" size="small" title="Editar">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleShowAudit(params.row.id)} color="info" size="small" title="Ver Cambios">
            <HistoryIcon />
          </IconButton>
          <IconButton onClick={() => handleDeleteClick(params.row.id)} color="error" size="small" title="Eliminar">
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <Card>
      <CardHeader 
        title="Gestión de Aulas" 
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nueva Aula
          </Button>
        }
      />
      <CardContent>
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={aulas}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
            }}
          />
        </Box>

        {openDialog && (
            <AulaDialog 
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onSave={handleSave}
                aula={selectedAula}
            />
        )}

        {auditOpen && auditId && (
          <AuditoriaModal
            open={auditOpen}
            model="config_aulas"
            id={auditId}
            onClose={() => setAuditOpen(false)}
          />
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Eliminar Aula"
          message="¿Estás seguro de que deseas eliminar esta aula? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          color="error"
          loading={deleting}
          onClose={() => !deleting && setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </CardContent>
    </Card>
  )
}

export default ConfigAulasPage
