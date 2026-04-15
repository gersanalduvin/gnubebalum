'use client'

import type { AdminFiltros, AdminFiltersParams } from '../services/adminNotasService'
import { Clear as ClearIcon, FilterList as FilterIcon, Search as SearchIcon } from '@mui/icons-material'
import {
  Box,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

interface AssignmentFilterBarProps {
  filtros: AdminFiltros
  filters: AdminFiltersParams
  searchTerm: string
  onFilterChange: (key: keyof AdminFiltersParams, value: number | undefined) => void
  onSearchChange: (value: string) => void
  onClearAll: () => void
  totalCount: number
  filteredCount: number
}

const AssignmentFilterBar = ({
  filtros,
  filters,
  searchTerm,
  onFilterChange,
  onSearchChange,
  onClearAll,
  totalCount,
  filteredCount
}: AssignmentFilterBarProps) => {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0)

  // Filtra grupos por el periodo seleccionado
  const gruposFiltrados = filters.periodo_lectivo_id
    ? filtros.grupos.filter(g => g.periodo_lectivo_id === filters.periodo_lectivo_id)
    : filtros.grupos

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 3,
        background: theme =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.05) 100%)',
        border: theme =>
          `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}`,
      }}
    >
      {/* Header */}
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
        <Box display='flex' alignItems='center' gap={1}>
          <FilterIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant='subtitle2' fontWeight='bold' color='primary.main'>
            Filtros de búsqueda
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} activo${activeFiltersCount > 1 ? 's' : ''}`}
              size='small'
              color='primary'
              variant='filled'
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Box display='flex' alignItems='center' gap={1}>
          <Typography variant='caption' color='text.secondary'>
            Mostrando <strong>{filteredCount}</strong> de <strong>{totalCount}</strong> asignaciones
          </Typography>
          {activeFiltersCount > 0 && (
            <Tooltip title='Limpiar filtros'>
              <IconButton size='small' onClick={onClearAll} color='default'>
                <ClearIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Grid container spacing={2}>
        {/* Búsqueda por texto */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size='small'
            label='Buscar materia, docente o grupo...'
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => onSearchChange('')}>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
        </Grid>

        {/* Periodo */}
        <Grid item xs={12} sm={6} md={2.5}>
          <FormControl fullWidth size='small'>
            <InputLabel>Periodo Lectivo</InputLabel>
            <Select
              value={filters.periodo_lectivo_id ?? ''}
              label='Periodo Lectivo'
              onChange={e => {
                const val = e.target.value ? Number(e.target.value) : undefined
                // Limpiar grupo si cambia el periodo
                onFilterChange('grupo_id', undefined)
                onFilterChange('periodo_lectivo_id', val)
              }}
            >
              <MenuItem value=''>Todos los periodos</MenuItem>
              {filtros.periodos.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Grupo */}
        <Grid item xs={12} sm={6} md={2.5}>
          <FormControl fullWidth size='small'>
            <InputLabel>Grupo</InputLabel>
            <Select
              value={filters.grupo_id ?? ''}
              label='Grupo'
              onChange={e => onFilterChange('grupo_id', e.target.value ? Number(e.target.value) : undefined)}
              disabled={gruposFiltrados.length === 0}
            >
              <MenuItem value=''>Todos los grupos</MenuItem>
              {gruposFiltrados.map(g => (
                <MenuItem key={g.id} value={g.id}>
                  {g.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Docente */}
        <Grid item xs={12} sm={6} md={2.5}>
          <FormControl fullWidth size='small'>
            <InputLabel>Docente</InputLabel>
            <Select
              value={filters.docente_id ?? ''}
              label='Docente'
              onChange={e => onFilterChange('docente_id', e.target.value ? Number(e.target.value) : undefined)}
            >
              <MenuItem value=''>Todos los docentes</MenuItem>
              {filtros.docentes.map(d => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AssignmentFilterBar
