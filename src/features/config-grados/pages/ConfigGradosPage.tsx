'use client'

import { useState, useEffect } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Add, Search } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import { useInitialLoad } from '@/hooks/useInitialLoad'
import ConfigGradoForm from '../components/ConfigGradoForm'
import ConfigGradoTable from '../components/ConfigGradoTable'
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import { configGradoService } from '../services/configGradoService'
import type { ConfigGrado, ConfigGradoResponse, ConfigGradoFilters, ConfigGradoFormData } from '../types'
import { openDialogAccessibly } from '@/utils/dialogUtils'

export default function ConfigGradosPage() {
  const { hasPermission } = usePermissions()
  const { executeOnce } = useInitialLoad()
  const [data, setData] = useState<ConfigGradoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingGrado, setEditingGrado] = useState<ConfigGrado | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ConfigGradoFilters>({
    search: ''
  })
  
  // Estados para el modal de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [gradoToDelete, setGradoToDelete] = useState<ConfigGrado | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<{ model: string; id: number } | null>(null)

  // Función para cargar datos
  const loadData = async () => {
    try {
      setLoading(true)
      const response = await configGradoService.getAll(currentPage, filters)
      setData(response)
    } catch (error) {
      console.error('Error al cargar grados:', error)
      toast.error('Error al cargar los grados')
    } finally {
      setLoading(false)
    }
  }

  // Carga inicial usando el hook personalizado
  useEffect(() => {
    executeOnce(loadData)
  }, [executeOnce])

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    if (currentPage > 1 || filters.search) {
      loadData()
    }
  }, [currentPage, filters])

  // Debounce para la búsqueda
  useEffect(() => {
    if (filters.search !== '') {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1)
        loadData()
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [filters.search])

  const handleSearch = () => {
    // Función removida - la búsqueda es automática
  }

  const handleCreate = () => {
    setEditingGrado(null)
    setFormOpen(true)
  }

  const handleEdit = (grado: ConfigGrado) => {
    setEditingGrado(grado)
    setFormOpen(true)
  }

  const handleDelete = (grado: ConfigGrado) => {
    if (!hasPermission('config_grado.delete')) {
      toast.error('No tienes permisos para eliminar grados')
      return
    }

    setGradoToDelete(grado)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!gradoToDelete) return

    setDeleteLoading(true)
    try {
      await configGradoService.delete(gradoToDelete.id)
      toast.success('Grado eliminado exitosamente')
      loadData()
      setDeleteDialogOpen(false)
      setGradoToDelete(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar el grado')
    } finally {
      setDeleteLoading(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setGradoToDelete(null)
  }

  const handleFormSubmit = async (formData: ConfigGradoFormData) => {
    setFormLoading(true)
    try {
      if (editingGrado) {
        await configGradoService.update(editingGrado.id, formData)
      } else {
        await configGradoService.create(formData)
      }
      loadData()
      setFormOpen(false)
    } catch (error) {
      // Re-lanzar el error para que el formulario lo maneje
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadData()
  }

  const handleFilterChange = (field: keyof ConfigGradoFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  // Función para abrir el modal de cambios
  const handleViewChanges = (grado: ConfigGrado) => {
    openDialogAccessibly(() => {
      setAuditTarget({ model: 'config_grado', id: grado.id })
      setAuditOpen(true)
    })
  }

  // Función para cerrar el modal de cambios
  const handleCloseChangesModal = () => {
    setAuditOpen(false)
    setAuditTarget(null)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1">
              Gestión de Grados
            </Typography>
            {hasPermission('config_grado.create') && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreate}
                size="small"
              >
                Nuevo Grado
              </Button>
            )}
          </Box>

          {/* Filtros */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <TextField
                label="Buscar por nombre"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <Search />
                  )
                }}
              />
            </Grid>
          </Grid>

          {/* Tabla */}
          <ConfigGradoTable
            data={data}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewChanges={handleViewChanges}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Formulario */}
      <ConfigGradoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingGrado}
        loading={formLoading}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar el grado "${gradoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        loading={deleteLoading}
      />

      {/* Modal de auditoría global */}
      <AuditoriaModal open={auditOpen} model={auditTarget?.model || ''} id={auditTarget?.id || 0} onClose={handleCloseChangesModal} />
    </Box>
  )
}
