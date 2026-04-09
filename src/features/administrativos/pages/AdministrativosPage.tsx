'use client'

import { useState, useEffect, useRef } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
 
import { Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon, Edit as EditIcon } from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import type { Administrativo, AdministrativosFilters } from '../types'
import { AdministrativosService } from '../services/administrativosService'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function AdministrativosPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()

  const canView = hasPermission('usuarios.administrativos.ver')
  const canCreate = hasPermission('usuarios.administrativos.crear')
  const canEdit = hasPermission('usuarios.administrativos.editar')

  const [items, setItems] = useState<Administrativo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const isInitialLoad = useRef(true)
  const loadingRef = useRef(false)

  const loadData = async () => {
    if (!canView) {
      setLoading(false)
      return
    }
    if (loadingRef.current) return
    try {
      loadingRef.current = true
      setLoading(true)
      const filters: AdministrativosFilters = { search: searchTerm, per_page: 10, page: 1 }
      const resp = await AdministrativosService.getAdministrativos(filters)
      const data = Array.isArray(resp.data) ? resp.data : resp.data ? [resp.data] : []
      setItems(data)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar administrativos')
      setItems([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
    }
    loadData()
  }, [canView])

  useEffect(() => {
    // Evitar disparar búsqueda cuando está vacío y en carga inicial
    if (isInitialLoad.current) return
    if (!searchTerm.trim()) return
    const timeout = setTimeout(() => {
      loadData()
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const handleCreate = () => {
    router.push('/usuarios/administrativos/create')
  }

  const handleEdit = (id: number) => {
    router.push(`/usuarios/administrativos/edit/${id}`)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Administrativos</h1>
          <p className="text-gray-600">Administra la información de usuarios administrativos</p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="usuarios.administrativos.crear">
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Nuevo Administrativo
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <TextField
              placeholder="Buscar administrativos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon className="text-gray-400 mr-2" /> }}
              size="small"
              className="flex-1"
            />
            <IconButton onClick={loadData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </div>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Foto</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(items) && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No se encontraron administrativos
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(items) && items.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Avatar src={item.foto_url ?? undefined} alt={item.email} />
                      </TableCell>
                      <TableCell>
                        {`${item.primer_nombre} ${item.segundo_nombre || ''} ${item.primer_apellido} ${item.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()}
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <PermissionGuard permission="usuarios.administrativos.editar">
                          <IconButton onClick={() => handleEdit(item.id)}>
                            <EditIcon />
                          </IconButton>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  )
}
