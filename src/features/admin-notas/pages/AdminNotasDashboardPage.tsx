'use client'

import type { AdminAsignacion, AdminFiltersParams } from '../services/adminNotasService'
import { getAllAssignments, getAdminFiltros } from '../services/adminNotasService'
import {
  AdminPanelSettings as AdminIcon,
  Book as BookIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Tooltip,
  Typography
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AssignmentFilterBar from '../components/AssignmentFilterBar'
import type { AdminFiltros } from '../services/adminNotasService'

const AdminNotasDashboardPage = () => {
  const router = useRouter()
  const [assignments, setAssignments] = useState<AdminAsignacion[]>([])
  const [filtros, setFiltros] = useState<AdminFiltros>({ periodos: [], grupos: [], docentes: [] })
  const [filters, setFilters] = useState<AdminFiltersParams>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar filtros al montar
  useEffect(() => {
    const loadFiltros = async () => {
      try {
        const data = await getAdminFiltros()
        setFiltros(data)

        // Preseleccionar el primer periodo (el más reciente)
        if (data.periodos?.length > 0) {
          setFilters(prev => ({ ...prev, periodo_lectivo_id: data.periodos[0].id }))
        }
      } catch {
        // Silenciar — los filtros no son críticos
      }
    }
    loadFiltros()
  }, [])

  // Cargar asignaciones cada vez que cambien los filtros API
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllAssignments(filters)
        setAssignments(data)
      } catch (err: any) {
        setError(err?.data?.message || 'No se pudieron cargar las asignaciones.')
      } finally {
        setLoading(false)
      }
    }
    loadAssignments()
  }, [filters])

  // Recargar filtros de grupos/docentes cuando cambia el periodo
  useEffect(() => {
    if (filters.periodo_lectivo_id) {
      getAdminFiltros(filters.periodo_lectivo_id)
        .then(data => setFiltros(data))
        .catch(() => {})
    }
  }, [filters.periodo_lectivo_id])

  const handleFilterChange = useCallback((key: keyof AdminFiltersParams, value: number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleClearAll = useCallback(() => {
    setFilters({})
    setSearchTerm('')
  }, [])

  // Filtrado local por texto (materia, docente, grupo)
  const filteredAssignments = useMemo(() => {
    if (!searchTerm) return assignments
    const term = searchTerm.toLowerCase()
    return assignments.filter(a =>
      a.materia_nombre?.toLowerCase().includes(term) ||
      a.docente_nombre?.toLowerCase().includes(term) ||
      a.grupo_nombre?.toLowerCase().includes(term) ||
      a.grado_nombre?.toLowerCase().includes(term)
    )
  }, [assignments, searchTerm])

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display='flex' alignItems='center' gap={1.5} mb={0.5}>
          <AdminIcon sx={{ color: 'warning.main', fontSize: 32 }} />
          <Typography variant='h4' fontWeight='bold'>
            Gestión de Notas
          </Typography>
          <Chip
            label='Panel Administrativo'
            color='warning'
            size='small'
            sx={{ fontWeight: 'bold', ml: 0.5 }}
          />
        </Box>
        <Typography variant='body2' color='text.secondary'>
          Acceso completo para visualizar y modificar notas de cualquier asignatura del sistema.
        </Typography>
      </Box>

      {/* Filtros */}
      <AssignmentFilterBar
        filtros={filtros}
        filters={filters}
        searchTerm={searchTerm}
        onFilterChange={handleFilterChange}
        onSearchChange={setSearchTerm}
        onClearAll={handleClearAll}
        totalCount={assignments.length}
        filteredCount={filteredAssignments.length}
      />

      {/* Error */}
      {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}

      {/* Loading */}
      {loading && (
        <Box display='flex' justifyContent='center' py={8}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty */}
      {!loading && !error && filteredAssignments.length === 0 && (
        <Alert severity='info'>
          {Object.values(filters).some(Boolean) || searchTerm
            ? 'No se encontraron asignaciones con los filtros aplicados.'
            : 'No hay asignaciones registradas en el sistema.'}
        </Alert>
      )}

      {/* Grid de asignaciones */}
      {!loading && (
        <Grid container spacing={3}>
          {filteredAssignments.map(assign => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={assign.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 6,
                    borderColor: 'primary.main',
                  }
                }}
              >
                <CardActionArea
                  sx={{ height: '100%' }}
                  onClick={() => router.push(`/admin/notas/asignatura/${assign.id}`)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Badge administrativo */}
                    <Box display='flex' justifyContent='flex-end' mb={1}>
                      <Chip
                        label='ADMIN'
                        size='small'
                        color='warning'
                        variant='outlined'
                        sx={{ fontSize: '0.6rem', height: 18, fontWeight: 'bold' }}
                      />
                    </Box>

                    {/* Ícono materia */}
                    <Box display='flex' alignItems='center' gap={1.5} mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 44,
                          height: 44,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                      >
                        <BookIcon />
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography variant='subtitle1' fontWeight='bold' noWrap title={assign.materia_nombre}>
                          {assign.materia_nombre}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' noWrap>
                          {assign.grupo_nombre}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Info docente */}
                    <Box display='flex' alignItems='center' gap={0.75} mb={1}>
                      <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant='caption' color='text.secondary' noWrap>
                        {assign.docente_nombre}
                      </Typography>
                    </Box>

                    {/* Info grupo */}
                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                      <Box display='flex' alignItems='center' gap={0.75}>
                        <SchoolIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant='caption' color='text.secondary'>
                          {assign.grado_nombre} - {assign.seccion_nombre}
                        </Typography>
                      </Box>
                      <Tooltip title='Estudiantes en el grupo'>
                        <Box display='flex' alignItems='center' gap={0.5}>
                          <GroupIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          <Typography variant='caption' color='primary.main' fontWeight='bold'>
                            {assign.estudiantes_count}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default AdminNotasDashboardPage
