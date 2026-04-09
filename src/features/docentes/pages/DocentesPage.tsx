'use client'

import { Add as AddIcon, Edit as EditIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material'
import { Avatar, Button, Card, CardContent, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { DocentesService } from '../services/docentesService'
import type { Docente, DocentesFilters } from '../types'

export default function DocentesPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()

  const canView = hasPermission('usuarios.docentes.ver')
  const canCreate = hasPermission('usuarios.docentes.crear')
  const canEdit = hasPermission('usuarios.docentes.editar')

  const [items, setItems] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const isInitialLoad = useRef(true)
  const loadingRef = useRef(false)

  const loadData = async (currentPage = page, currentPerPage = perPage) => {
    if (!canView) {
      setLoading(false)
      return
    }
    if (loadingRef.current) return
    try {
      loadingRef.current = true
      setLoading(true)
      const filters: DocentesFilters = { 
        search: searchTerm, 
        per_page: currentPerPage, 
        page: currentPage + 1 
      }
      const resp = await DocentesService.getDocentes(filters)
      
      // Handle paginated response
      const data = resp.data || []
      setItems(Array.isArray(data) ? data : [])
      setTotalItems(resp.total || 0)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar docentes')
      setItems([])
      setTotalItems(0)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      loadData(0, perPage)
    } else {
      loadData(page, perPage)
    }
  }, [canView, page, perPage])

  useEffect(() => {
    if (isInitialLoad.current) return
    if (!searchTerm.trim()) return
    const timeout = setTimeout(() => {
      setPage(0)
      loadData(0, perPage)
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const handleCreate = () => {
    router.push('/usuarios/docentes/create')
  }

  const handleEdit = (id: number) => {
    router.push(`/usuarios/docentes/edit/${id}`)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Docentes</h1>
          <p className="text-gray-600">Administra la información de usuarios docentes</p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="usuarios.docentes.crear">
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Nuevo Docente
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <TextField placeholder="Buscar docentes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon className="text-gray-400 mr-2" /> }} size="small" className="flex-1" />
            <IconButton onClick={() => loadData(page, perPage)} disabled={loading}>
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
                      No se encontraron docentes
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
                        <PermissionGuard permission="usuarios.docentes.editar">
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

          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(e) => {
              setPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            labelRowsPerPage="Filas por página"
          />
        </CardContent>
      </Card>
    </div>
  )
}
