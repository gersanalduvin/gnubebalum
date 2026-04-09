'use client'

import { Add as AddIcon, Edit as EditIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material'
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { FamiliasService } from '../services/familiasService'
import type { Familia, FamiliasFilters } from '../types'

export default function FamiliasPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()

  const canView = hasPermission('usuarios.familias.ver')
  const canCreate = hasPermission('usuarios.familias.crear')
  const canEdit = hasPermission('usuarios.familias.editar')

  const [items, setItems] = useState<Familia[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

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
      const filters: FamiliasFilters = {
        search: searchTerm,
        per_page: rowsPerPage,
        page: page + 1 // El backend usa 1-index para páginas, MUI usa 0-index
      }
      const resp = await FamiliasService.getFamilias(filters)

      // La respuesta estándar de Laravel paginate() viene con data, total, etc.
      // Si la API lo envuelve en { success, data: { data, total }, message }, o lo devuelve directo
      // Aquí manejamos ambas posibilidades basado en la estructura que tenga real

      let familiesData: Familia[] = []
      let count = 0

      // Cast a any para evitar errores de TS
      const responseData = resp.data as any

      // Si resp tiene structure paginada de Laravel
      if (responseData && typeof responseData === 'object' && Array.isArray(responseData.data)) {
        // Estructura: { success: true, data: { current_page, data: [...], total } }
        familiesData = responseData.data
        count = responseData.total || 0
      } else if (Array.isArray(responseData)) {
        // Estructura antigua o simplificada
        familiesData = responseData
        count = (resp as any).total || responseData.length
      } else if (responseData) {
        // Estructura objeto único
        familiesData = [responseData]
        count = 1
      }

      setItems(familiesData)
      setTotalRows(count)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar familias')
      setItems([])
      setTotalRows(0)
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
  }, [canView, page, rowsPerPage]) // Recargar cuando cambie la página o cantidad por página

  useEffect(() => {
    if (isInitialLoad.current) return
    const timeout = setTimeout(() => {
      setPage(0) // Reiniciar a la primera página al buscar
      loadData()
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const handleCreate = () => {
    router.push('/usuarios/familias/create')
  }

  const handleEdit = (id: number) => {
    router.push(`/usuarios/familias/edit/${id}`)
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Gestión de Familias</h1>
          <p className='text-gray-600'>Administra la información de usuarios familias</p>
        </div>
        <div className='flex gap-2'>
          <PermissionGuard permission='usuarios.familias.crear'>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleCreate}>
              Nueva Familia
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className='flex gap-4 mb-4'>
            <TextField
              placeholder='Buscar familias...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon className='text-gray-400 mr-2' /> }}
              size='small'
              className='flex-1'
            />
            <IconButton onClick={() => loadData()} disabled={loading}>
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
                    <TableCell colSpan={4} align='center'>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(items) && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      No se encontraron familias
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(items) &&
                  items.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Avatar src={item.foto_url ?? undefined} alt={item.email} />
                      </TableCell>
                      <TableCell>
                        {item.primer_nombre} {item.segundo_nombre} {item.primer_apellido} {item.segundo_apellido}
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <PermissionGuard permission='usuarios.familias.editar'>
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
            <TablePagination
              component='div'
              count={totalRows}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage='Filas por página:'
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  )
}
