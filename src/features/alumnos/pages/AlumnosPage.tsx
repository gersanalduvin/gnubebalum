'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
    Add as AddIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    Restore as RestoreIcon,
    Search as SearchIcon
} from '@mui/icons-material'
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
    TextField,
    Tooltip
} from '@mui/material'

import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { AlumnosService } from '../services/alumnosService'
import type { Alumno, AlumnoFilters } from '../types'

export default function AlumnosPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()

  // Verificaciones de permisos
  const canView = hasPermission('usuarios.alumnos.ver')
  const canCreate = hasPermission('usuarios.alumnos.crear')
  const canEdit = hasPermission('usuarios.alumnos.editar')
  const canDelete = hasPermission('usuarios.alumnos.eliminar')

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortModel, setSortModel] = useState<any[]>([])

  // Usar useRef para controlar las cargas
  const isInitialLoad = useRef(true)
  const loadingRef = useRef(false)

  // Cargar datos de alumnos
  const loadAlumnos = async () => {
    // Evitar cargas simultáneas
    if (loadingRef.current) return

    try {
      loadingRef.current = true
      setLoading(true)

      const filters: AlumnoFilters = {
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
        search: searchTerm || undefined,
        sort_by: sortModel[0]?.field || undefined,
        sort_order: sortModel[0]?.sort || undefined,
      }

      const response = await AlumnosService.getAlumnos(filters)

      // Validar que response.data sea un array
      const alumnosData = Array.isArray(response.data) ? response.data : []

      setAlumnos(alumnosData)
      setTotalCount(response.total || 0)
    } catch (error: any) {
      console.error('❌ Error loading alumnos:', error)
      toast.error(error.message || 'Error al cargar los alumnos')
      setAlumnos([])
      setTotalCount(0)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  // Efecto para carga inicial
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      loadAlumnos()
    }
  }, [])

  // Efecto para cambios en paginación y ordenamiento
  useEffect(() => {
    if (!isInitialLoad.current) {
      loadAlumnos()
    }
  }, [paginationModel, sortModel])

  // Búsqueda con debounce optimizado - reducido de 300ms a 500ms para menos peticiones
  useEffect(() => {
    if (isInitialLoad.current || !searchTerm.trim()) return

    const timeoutId = setTimeout(() => {
      if (paginationModel.page === 0) {
        loadAlumnos()
      } else {
        setPaginationModel(prev => ({ ...prev, page: 0 }))
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Handlers
  const handleCreate = () => {
    router.push('/usuarios/alumnos/create')
  }

  const handleEdit = (id: number) => {
    router.push(`/usuarios/alumnos/edit/${id}`)
  }

  const handleRestore = async (id: number) => {
    try {
      await AlumnosService.restoreAlumno(id)
      toast.success('Alumno restaurado exitosamente')
      loadAlumnos()
    } catch (error: any) {
      toast.error(error.message || 'Error al restaurar el alumno')
    }
  }




  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Alumnos</h1>
          <p className="text-gray-600">Administra la información de los estudiantes</p>
        </div>

        <div className="flex gap-2">
          <PermissionGuard permission="usuarios.alumnos.crear">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Nuevo Alumno
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          {/* Barra de búsqueda y filtros */}
          <div className="flex gap-4 mb-4">
            <TextField
              placeholder="Buscar alumnos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
              }}
              size="small"
              className="flex-1"
            />
            <IconButton onClick={loadAlumnos} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </div>

          {/* Tabla de datos */}
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
                ) : Array.isArray(alumnos) && alumnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No se encontraron alumnos
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(alumnos) ? alumnos.map((alumno) => {
                    const nombreCompleto = [
                      alumno.primer_nombre,
                      alumno.segundo_nombre,
                      alumno.primer_apellido,
                      alumno.segundo_apellido
                    ].filter(Boolean).join(' ') || 'Sin nombre';

                    const iniciales = `${alumno.primer_nombre?.[0] || ''}${alumno.primer_apellido?.[0] || ''}`.toUpperCase();

                    return (
                      <TableRow key={alumno.id}>
                        <TableCell>
                          <Avatar
                            src={alumno.foto_url || undefined}
                            alt={nombreCompleto}
                            sx={{ width: 40, height: 40 }}
                          >
                            {iniciales}
                          </Avatar>
                        </TableCell>
                        <TableCell>{nombreCompleto}</TableCell>
                        <TableCell>{alumno.email || 'Sin correo'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <PermissionGuard permission="usuarios.alumnos.ver">
                              <Tooltip title="Ver Detalles">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(alumno.id)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </PermissionGuard>
                            {alumno.deleted_at && (
                              <PermissionGuard permission="usuarios.alumnos.editar">
                                <Tooltip title="Restaurar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRestore(alumno.id)}
                                  >
                                    <RestoreIcon />
                                  </IconButton>
                                </Tooltip>
                              </PermissionGuard>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Error: Los datos no tienen el formato esperado
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={totalCount}
              page={paginationModel.page}
              onPageChange={(_, newPage) => setPaginationModel(prev => ({ ...prev, page: newPage }))}
              rowsPerPage={paginationModel.pageSize}
              onRowsPerPageChange={(event) => setPaginationModel(prev => ({ ...prev, pageSize: parseInt(event.target.value, 10), page: 0 }))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          </TableContainer>
        </CardContent>
      </Card>

    </div>
  )
}
