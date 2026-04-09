'use client'

import * as assistanceService from '@/features/asistencias/services/teacherAsistenciasService'
import { useAuth } from '@/hooks/useAuth'
import { Search as SearchIcon } from '@mui/icons-material'
import { Alert, Box, CircularProgress, Container, Grid, InputAdornment, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import SubjectCard from '../components/SubjectCard'
import { getMyAssignments } from '../services/dashboardService'

const DashboardPage = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [guideGroups, setGuideGroups] = useState<any[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsData, guideGroupsData] = await Promise.all([
          getMyAssignments(),
          assistanceService.getMyActiveGroups()
        ])
        setAssignments(assignmentsData)
        setFilteredAssignments(assignmentsData)
        setGuideGroups(guideGroupsData || [])
      } catch (err) {
        console.error(err)
        setError('No se pudieron cargar los datos del panel.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const results = assignments.filter(assign => {
      const subjectName =
        assign.asignatura_grado?.materia?.nombre ||
        assign.asignaturaGrado?.materia?.nombre ||
        assign.materia?.nombre ||
        ''
      const groupName = assign.grupo?.nombre || ''
      const gradoName = assign.grupo?.grado?.nombre || ''

      const searchLower = searchTerm.toLowerCase()

      return (
        subjectName.toLowerCase().includes(searchLower) ||
        groupName.toLowerCase().includes(searchLower) ||
        gradoName.toLowerCase().includes(searchLower)
      )
    })
    setFilteredAssignments(results)
  }, [searchTerm, assignments])

  if (loading)
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='60vh'>
        <CircularProgress />
      </Box>
    )

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      <Box
        mb={4}
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
      >
        <Box>
          <Typography variant='h4' fontWeight='bold' gutterBottom>
            Hola, {(user as any)?.primer_nombre}
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            Bienvenido a tu panel docente. Tienes {assignments.length} asignaturas activas.
          </Typography>
        </Box>
        <TextField
          label='Buscar asignatura, grupo o grado...'
          variant='outlined'
          size='small'
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300, bgcolor: 'background.paper' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && filteredAssignments.length === 0 && (
        <Alert severity='info'>
          {searchTerm
            ? 'No se encontraron asignaturas con ese criterio.'
            : 'No tienes asignaturas asignadas para este periodo lectivo.'}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Asignaturas regulares */}
        {filteredAssignments.map(assign => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={assign.id}>
            <SubjectCard
              id={assign.id_asignacion ?? assign.id}
              subjectName={
                assign.asignatura_grado?.materia?.nombre ||
                assign.asignaturaGrado?.materia?.nombre ||
                assign.materia?.nombre ||
                'Materia Desconocida'
              }
              groupName={assign.grupo?.nombre || 'Grupo Desconocido'}
              periodName={assign.grupo?.turno?.nombre || 'Turno'}
              active={assign.activo ?? true}
              // Removing consult schedule as requested
              scheduleInfo=''
              studentCount={assign.grupo?.usuarios_count ?? 0}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default DashboardPage
