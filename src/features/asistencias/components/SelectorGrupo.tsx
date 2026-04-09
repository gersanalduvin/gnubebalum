'use client'
import { useEffect, useState } from 'react'

import { CircularProgress, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material'

import { usePermissions } from '@/hooks/usePermissions'
import * as adminService from '../services/asistenciasService'
import * as teacherService from '../services/teacherAsistenciasService'
import type { GrupoResumenPorTurno, PeriodoLectivo } from '../types'

interface Props {
  periodoId: number | null
  grupoId: number | null
  onPeriodoChange: (id: number) => void
  onGrupoChange: (id: number) => void
  hideGrupo?: boolean
  isTeacherView?: boolean
}

export default function SelectorGrupo({
  periodoId,
  grupoId,
  onPeriodoChange,
  onGrupoChange,
  hideGrupo,
  isTeacherView = false
}: Props) {
  const [periodos, setPeriodos] = useState<PeriodoLectivo[]>([])
  const [gruposPorTurno, setGruposPorTurno] = useState<GrupoResumenPorTurno>({})
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [rawTeacherGroups, setRawTeacherGroups] = useState<any[]>([])
  const { hasPermission, isLoading } = usePermissions()
  const service = isTeacherView ? teacherService : adminService

  useEffect(() => {
    if (isLoading) return
    ;(async () => {
      // Si es vista docente, no cargamos periodos, cargamos sus grupos de una vez
      if (isTeacherView) {
        try {
            setLoadingGrupos(true)
            const groups = await teacherService.getMyActiveGroups()
            setRawTeacherGroups(groups)
            // Convertir a formato agrupado por turno
            const grouped: GrupoResumenPorTurno = {}
            for (const g of groups) {
                const turno = g.turno || 'Sin Turno'
                if (!grouped[turno]) grouped[turno] = []
                grouped[turno].push({ id: g.id, nombre: `${g.grado} ${g.seccion}` })
            }
            setGruposPorTurno(grouped)
        } catch (error) {
            console.error('Error fetching teacher groups', error)
        } finally {
            setLoadingGrupos(false)
        }
      } else {
          // Admin logic
          try {
            const data = await service.getPeriodosLectivos()
            setPeriodos(data)
          } catch (error) {
            console.error('Error fetching periodos:', error)
          }
      }
    })()
  }, [service, hasPermission, isLoading])

  useEffect(() => {
    if (isTeacherView) return // Docentes ya cargan al inicio
    if (!periodoId || hideGrupo) return
    setLoadingGrupos(true)
    ;(async () => {
      try {
        const data = await service.getGruposPorTurno(periodoId)
        setGruposPorTurno(data)
      } catch (error) {
        console.error('Error fetching grupos:', error)
        setGruposPorTurno({})
      } finally {
        setLoadingGrupos(false)
      }
    })()
  }, [periodoId, hideGrupo, service, hasPermission])

  return (
    <Grid container spacing={2} alignItems='center'>
      <Grid item xs={12} md={hideGrupo ? 12 : 6} sx={{ display: isTeacherView ? 'none' : 'block' }}>
        <FormControl fullWidth size='small'>
          <InputLabel id='periodo-label'>Periodo Lectivo</InputLabel>
          <Select
            labelId='periodo-label'
            label='Periodo Lectivo'
            value={periodoId ?? ''}
            onChange={e => onPeriodoChange(Number(e.target.value))}
          >
            {periodos.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {!hideGrupo && (
        <Grid item xs={12} md={isTeacherView ? 12 : 6}>
          <FormControl fullWidth size='small' disabled={(!periodoId && !isTeacherView) || loadingGrupos}>
            <InputLabel id='grupo-label'>Grupo</InputLabel>
            <Select
              labelId='grupo-label'
              label='Grupo'
              value={grupoId ?? ''}
              onChange={e => {
                const v = Number(e.target.value)
                if (!Number.isNaN(v)) {
                  onGrupoChange(v)
                  
                  // Si es docente, asignamos el periodo automáticamente
                  if (isTeacherView) {
                    const selectedG = rawTeacherGroups.find(g => g.id === v)
                    if (selectedG) {
                      onPeriodoChange(selectedG.periodo_lectivo_id)
                    }
                  }
                }
              }}
            >
              {loadingGrupos && (
                <MenuItem value=''>
                  <CircularProgress size={20} />
                </MenuItem>
              )}
              {!loadingGrupos &&
                Object.entries(gruposPorTurno).flatMap(([turno, grupos]) => [
                  <MenuItem key={`${turno}-header`} value={-1} disabled sx={{ fontSize: 12, opacity: 0.7 }}>
                    {turno}
                  </MenuItem>,
                  ...grupos.map(g => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.nombre}
                    </MenuItem>
                  ))
                ])}
            </Select>
          </FormControl>
        </Grid>
      )}
    </Grid>
  )
}
