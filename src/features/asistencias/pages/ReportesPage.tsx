'use client'
import { Fragment, useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'
import CorteBadge from '../components/CorteBadge'
import SelectorCorte from '../components/SelectorCorte'
import SelectorGrupo from '../components/SelectorGrupo'
import * as adminService from '../services/asistenciasService'
import * as teacherService from '../services/teacherAsistenciasService'
import type {
  Corte,
  ReporteGlobalRangoRespuesta,
  ReporteInasistenciasGrupoRespuesta,
  ReportePorCorteRespuesta
} from '../types'

type TabType =
  | 'corte'
  | 'general'
  | 'general_grupo'
  | 'general_grado'
  | 'grupo_alumno_semanal'
  | 'grupo_semanal'
  | 'global_rango'
  | 'inasistencias_grupo'

export default function ReportesPage({ isTeacherView = false }: { isTeacherView?: boolean }) {
  const [periodoId, setPeriodoId] = useState<number | null>(null)
  const [grupoId, setGrupoId] = useState<number | null>(null)
  const [tab, setTab] = useState<TabType>('corte')
  const [corte, setCorte] = useState<Corte | ''>('')

  // States para Fechas (usando fecha de hoy por defecto)
  const [fechaInicio, setFechaInicio] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [fechaReporte, setFechaReporte] = useState<string>(() => new Date().toISOString().split('T')[0])
  const { hasPermission, user } = usePermissions()
  const service = isTeacherView ? teacherService : adminService

  const isDocente = user?.tipo_usuario === 'docente'

  const [loading, setLoading] = useState(false)
  const [dataCorte, setDataCorte] = useState<ReportePorCorteRespuesta | null>(null)
  const [dataGeneral, setDataGeneral] = useState<any>(null)
  const [dataGeneralGrupo, setDataGeneralGrupo] = useState<any>(null)
  const [dataGeneralGrado, setDataGeneralGrado] = useState<any>(null)

  // Datos de los Nuevos Reportes
  const [dataGrupoAlumnoSemanal, setDataGrupoAlumnoSemanal] = useState<any>(null)
  const [dataGrupoSemanal, setDataGrupoSemanal] = useState<any>(null)
  const [dataGlobalRango, setDataGlobalRango] = useState<ReporteGlobalRangoRespuesta | null>(null)
  const [dataInasistenciasGrupo, setDataInasistenciasGrupo] = useState<ReporteInasistenciasGrupoRespuesta | null>(null)

  const [exportCortePdfLoading, setExportCortePdfLoading] = useState(false)
  const [exportCorteExcelLoading, setExportCorteExcelLoading] = useState(false)
  const [exportGeneralExcelLoading, setExportGeneralExcelLoading] = useState(false)
  const [exportGeneralPdfLoading, setExportGeneralPdfLoading] = useState(false)
  const [exportGeneralGrupoPdfLoading, setExportGeneralGrupoPdfLoading] = useState(false)
  const [exportGeneralGrupoExcelLoading, setExportGeneralGrupoExcelLoading] = useState(false)
  const [exportGeneralGradoPdfLoading, setExportGeneralGradoPdfLoading] = useState(false)
  const [exportGeneralGradoExcelLoading, setExportGeneralGradoExcelLoading] = useState(false)

  // Loadings Extra Exportacion Nuevos Reportes
  const [exportExtraLoading, setExportExtraLoading] = useState<{ pdf: boolean; xlsx: boolean }>({
    pdf: false,
    xlsx: false
  })
  const corteLabel = useMemo(() => {
    if (!corte) return ''
    return {
      corte_1: 'Corte 1',
      corte_2: 'Corte 2',
      corte_3: 'Corte 3',
      corte_4: 'Corte 4'
    }[corte]
  }, [corte])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (tab === 'corte' && grupoId && corte) {
          const resp = await service.getReportePorCorte(grupoId, corte)
          setDataCorte(resp)
        } else {
          setDataCorte(null)
        }
        if (tab === 'general' && grupoId) {
          const resp = await service.getReporteGeneral(grupoId)
          setDataGeneral(resp)
        } else {
          setDataGeneral(null)
        }
        if (tab === 'general_grupo' && periodoId) {
          const resp = await service.getReporteGeneralPorGrupo(periodoId)
          setDataGeneralGrupo(resp)
        } else {
          setDataGeneralGrupo(null)
        }
        if (tab === 'general_grado' && periodoId) {
          const resp = await service.getReporteGeneralPorGrado(periodoId)
          setDataGeneralGrado(resp)
        } else {
          setDataGeneralGrado(null)
        }
        // Llamadas nuevos endpoints
        if (tab === 'grupo_alumno_semanal' && grupoId && fechaInicio && fechaFin) {
          const resp = await service.getReporteSemanalPorGrupoYAlumno(grupoId, fechaInicio, fechaFin)
          setDataGrupoAlumnoSemanal(resp)
        } else {
          setDataGrupoAlumnoSemanal(null)
        }
        if (tab === 'grupo_semanal' && fechaInicio && fechaFin) {
          const resp = await service.getReporteSemanalPorGrupo(fechaInicio, fechaFin)
          setDataGrupoSemanal(resp)
        } else {
          setDataGrupoSemanal(null)
        }
        if (tab === 'global_rango' && periodoId && fechaInicio && fechaFin) {
          const resp = await service.getReporteGlobalRango(periodoId, fechaInicio, fechaFin)
          setDataGlobalRango(resp)
        } else {
          setDataGlobalRango(null)
        }
        if (
          tab === 'inasistencias_grupo' &&
          grupoId !== null &&
          grupoId !== undefined &&
          fechaInicio &&
          fechaFin &&
          periodoId
        ) {
          const resp = await service.getReporteInasistenciasGrupo(grupoId, fechaInicio, fechaFin, periodoId)
          setDataInasistenciasGrupo(resp)
        } else {
          setDataInasistenciasGrupo(null)
        }
      } catch (error: any) {
        if (error?.status === 401) {
          toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
          window.location.href = '/auth/login'
          return
        }
        const message = error?.data?.message || 'Error al cargar reporte'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [grupoId, corte, tab, periodoId, fechaInicio, fechaFin])

  const chartOptions = useMemo(() => {
    const categories = ['Promedio Asistencia', 'Promedio Llegada Tarde']
    return {
      chart: { toolbar: { show: false } },
      xaxis: { categories },
      dataLabels: { enabled: false },
      colors: ['#3B82F6', '#F59E0B']
    }
  }, [])

  const handleExportCorte = async (format: 'pdf' | 'xlsx') => {
    if (!grupoId || !corte) return
    try {
      if (format === 'pdf') setExportCortePdfLoading(true)
      else setExportCorteExcelLoading(true)
      const blob = await service.exportReportePorCorte(grupoId, corte, { format })
      const url = window.URL.createObjectURL(blob)
      if (format === 'pdf') {
        window.open(url, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `Reporte ${corteLabel}.xlsx`
        a.click()
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar'
      toast.error(message)
    } finally {
      if (format === 'pdf') setExportCortePdfLoading(false)
      else setExportCorteExcelLoading(false)
    }
  }

  const handleExportGeneral = async (format: 'pdf' | 'xlsx') => {
    if (!grupoId) return
    try {
      if (format === 'pdf') setExportGeneralPdfLoading(true)
      else setExportGeneralExcelLoading(true)
      const blob = await service.exportReporteGeneral(grupoId, { format })
      const url = window.URL.createObjectURL(blob)
      if (format === 'pdf') {
        window.open(url, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = 'Reporte General de Asistencias.xlsx'
        a.click()
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar'
      toast.error(message)
    } finally {
      if (format === 'pdf') setExportGeneralPdfLoading(false)
      else setExportGeneralExcelLoading(false)
    }
  }

  const handleExportGeneralGrupo = async (format: 'pdf' | 'xlsx') => {
    if (!periodoId) return
    try {
      if (format === 'pdf') setExportGeneralGrupoPdfLoading(true)
      else setExportGeneralGrupoExcelLoading(true)
      const blob = await service.exportReporteGeneralPorGrupo(periodoId, { format })
      const url = window.URL.createObjectURL(blob)
      if (format === 'pdf') {
        window.open(url, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = 'Reporte General por Grupo.xlsx'
        a.click()
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar'
      toast.error(message)
    } finally {
      if (format === 'pdf') setExportGeneralGrupoPdfLoading(false)
      else setExportGeneralGrupoExcelLoading(false)
    }
  }

  const handleExportGeneralGrado = async (format: 'pdf' | 'xlsx') => {
    if (!periodoId) return
    try {
      if (format === 'pdf') setExportGeneralGradoPdfLoading(true)
      else setExportGeneralGradoExcelLoading(true)
      const blob = await service.exportReporteGeneralPorGrado(periodoId, { format })
      const url = window.URL.createObjectURL(blob)
      if (format === 'pdf') {
        window.open(url, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = 'Reporte General por Grado.xlsx'
        a.click()
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar'
      toast.error(message)
    } finally {
      if (format === 'pdf') setExportGeneralGradoPdfLoading(false)
      else setExportGeneralGradoExcelLoading(false)
    }
  }

  // --- Nuevos handlers de exportación ---
  const handleExportExtra = async (format: 'pdf' | 'xlsx', exportFnName: string, filename: string, args: any[]) => {
    try {
      setExportExtraLoading(prev => ({ ...prev, [format]: true }))
      const exportReq = (service as any)[exportFnName]
      if (!exportReq) throw new Error(`Metodo ${exportFnName} no soportado`)
      const blob = await exportReq(...args, format)
      const url = window.URL.createObjectURL(blob)
      if (format === 'pdf') {
        window.open(url, '_blank')
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      }
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      const message = error?.data?.message || 'Error al exportar reporte'
      toast.error(message)
    } finally {
      setExportExtraLoading(prev => ({ ...prev, [format]: false }))
    }
  }

  const cortesKeys = ['corte_1', 'corte_2', 'corte_3', 'corte_4'] as const
  const corteColors: Record<(typeof cortesKeys)[number], string> = {
    corte_1: 'bg-blue-50',
    corte_2: 'bg-green-50',
    corte_3: 'bg-purple-50',
    corte_4: 'bg-orange-50'
  }
  const corteBg: Record<(typeof cortesKeys)[number], string> = {
    corte_1: '#EFF6FF',
    corte_2: '#F0FDF4',
    corte_3: '#F5F3FF',
    corte_4: '#FFF7ED'
  }
  const alumnos = Array.isArray((dataGeneral as any)?.alumnos)
    ? (dataGeneral as any).alumnos
    : Array.isArray((dataGeneral as any)?.usuarios)
      ? (dataGeneral as any).usuarios
      : []
  const porCorte = (dataGeneral as any)?.por_corte || {}
  const promedioTotalAsistencia = alumnos.length
    ? alumnos.reduce((acc: number, a: any) => acc + (Number(a?.promedio_asistencia) || 0), 0) / alumnos.length
    : 0
  const promedioTotalLlegadaTarde = alumnos.length
    ? alumnos.reduce((acc: number, a: any) => acc + (Number(a?.promedio_llegada_tarde) || 0), 0) / alumnos.length
    : 0

  return (
    <Box className='p-6'>
      <div className='flex items-center justify-between mb-4'>
        <Typography variant='h5' className='font-semibold'>
          Reportes de Asistencias
        </Typography>
        {tab === 'corte' && corte && <CorteBadge corte={corte} />}
      </div>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        className='mb-4'
        variant='scrollable'
        scrollButtons='auto'
        allowScrollButtonsMobile
      >
        <Tab value='corte' label='Por Corte' />
        <Tab value='general' label='General por Corte' />
        {!isDocente && <Tab value='general_grupo' label='General por Grupo' />}
        {!isDocente && <Tab value='general_grado' label='General por Grado' />}
        <Tab value='grupo_alumno_semanal' label='Por Grupo y Alumno Semanal' />
        {!isDocente && <Tab value='grupo_semanal' label='Por Grupo Semanal' />}
        {!isDocente && <Tab value='global_rango' label='Global por Rango' />}
        <Tab value='inasistencias_grupo' label='Inasistencias por Grupo' />
      </Tabs>
      <Grid container spacing={2} className='mb-4'>
        <Grid item xs={12} md={['general_grupo', 'general_grado', 'global_rango'].includes(tab) ? 12 : 6}>
          <SelectorGrupo
            periodoId={periodoId}
            grupoId={grupoId}
            onPeriodoChange={setPeriodoId as any}
            onGrupoChange={setGrupoId as any}
            hideGrupo={['general_grupo', 'general_grado', 'global_rango'].includes(tab)}
            isTeacherView={isTeacherView}
          />
        </Grid>
        {tab === 'corte' && (
          <Grid item xs={12} md={6}>
            <SelectorCorte value={corte} onChange={setCorte as any} required />
          </Grid>
        )}
        {['grupo_alumno_semanal', 'grupo_semanal', 'global_rango', 'inasistencias_grupo'].includes(tab) && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label='Fecha Inicio'
                type='date'
                fullWidth
                size='small'
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label='Fecha Fin'
                type='date'
                fullWidth
                size='small'
                InputLabelProps={{ shrink: true }}
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
              />
            </Grid>
          </>
        )}
      </Grid>
      {tab === 'corte' && (
        <>
          {dataCorte && (
            <div className='flex items-center gap-3 text-sm mb-4'>
              <span className='px-2 py-1 rounded bg-blue-100 text-blue-700'>
                {dataCorte.totales.presentes} presentes
              </span>
              <span className='px-2 py-1 rounded bg-green-100 text-green-700'>
                {dataCorte.totales.ausencias_justificadas} ausencias J
              </span>
              <span className='px-2 py-1 rounded bg-red-100 text-red-700'>
                {dataCorte.totales.ausencias_injustificadas} ausencias I
              </span>
              <span className='px-2 py-1 rounded bg-emerald-100 text-emerald-700'>
                {dataCorte.totales.tardes_justificadas} tardes J
              </span>
              <span className='px-2 py-1 rounded bg-amber-100 text-amber-700'>
                {dataCorte.totales.tardes_injustificadas} tardes I
              </span>
              <span className='px-2 py-1 rounded bg-slate-100 text-slate-700'>
                Promedio {dataCorte.totales.promedio_asistencia}%
              </span>
            </div>
          )}
          <Paper className='mb-4'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Alumno</TableCell>
                    <TableCell>Ausencias J</TableCell>
                    <TableCell>Ausencias I</TableCell>
                    <TableCell>Tardes J</TableCell>
                    <TableCell>Tardes I</TableCell>
                    <TableCell>% Asistencia</TableCell>
                    <TableCell>% Llegada Tarde</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className='flex items-center justify-center p-6'>
                          <CircularProgress size={24} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    dataCorte?.usuarios?.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell>{u.nombre}</TableCell>
                        <TableCell>{u.ausencias_justificadas}</TableCell>
                        <TableCell>{u.ausencias_injustificadas}</TableCell>
                        <TableCell>{u.tardes_justificadas}</TableCell>
                        <TableCell>{u.tardes_injustificadas}</TableCell>
                        <TableCell>{u.porcentaje_asistencia}%</TableCell>
                        <TableCell>{u.porcentaje_llegada_tarde}%</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <AppReactApexCharts
            type='bar'
            height={320}
            series={[
              {
                name: 'Promedios',
                data: dataCorte
                  ? [dataCorte.totales.promedio_asistencia, dataCorte.totales.promedio_llegada_tarde]
                  : [0, 0]
              }
            ]}
            options={chartOptions}
          />
          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() => handleExportCorte('pdf')}
              disabled={!grupoId || !corte || exportCortePdfLoading}
            >
              {exportCortePdfLoading ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() => handleExportCorte('xlsx')}
              disabled={!grupoId || !corte || exportCorteExcelLoading}
            >
              {exportCorteExcelLoading ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'general' && (
        <>
          <Paper className='mb-4'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2}>Alumno</TableCell>
                    {cortesKeys.map((ck, idx) => (
                      <TableCell
                        key={ck}
                        align='center'
                        colSpan={6}
                        className={corteColors[ck]}
                        sx={{ bgcolor: corteBg[ck] }}
                      >{`Corte ${idx + 1}`}</TableCell>
                    ))}
                    <TableCell align='center' colSpan={2}>
                      Prom
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    {cortesKeys.map(ck => (
                      <Fragment key={ck}>
                        <TableCell key={`${ck}-aj`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          AJ
                        </TableCell>
                        <TableCell key={`${ck}-ai`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          AI
                        </TableCell>
                        <TableCell key={`${ck}-llt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          LLT
                        </TableCell>
                        <TableCell key={`${ck}-llti`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          LLTI
                        </TableCell>
                        <TableCell key={`${ck}-pa`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          %A
                        </TableCell>
                        <TableCell key={`${ck}-pllt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          %LLT
                        </TableCell>
                      </Fragment>
                    ))}
                    <TableCell>%A</TableCell>
                    <TableCell>%LLT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={1 + cortesKeys.length * 6 + 2}>
                        <div className='flex items-center justify-center p-6'>
                          <CircularProgress size={24} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    alumnos.map((u: any) => (
                      <TableRow key={u.user_id}>
                        <TableCell>{u.nombre}</TableCell>
                        {cortesKeys.map(ck => {
                          const c = u.cortes?.[ck] || {}
                          return (
                            <Fragment key={ck}>
                              <TableCell
                                key={`${u.user_id}-${ck}-aj`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.ausencias_justificadas ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${u.user_id}-${ck}-ai`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.ausencias_injustificadas ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${u.user_id}-${ck}-llt`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.tardes_justificadas ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${u.user_id}-${ck}-llti`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.tardes_injustificadas ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${u.user_id}-${ck}-pa`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.porcentaje_asistencia ?? 0}%
                              </TableCell>
                              <TableCell
                                key={`${u.user_id}-${ck}-pllt`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.porcentaje_llegada_tarde ?? 0}%
                              </TableCell>
                            </Fragment>
                          )
                        })}
                        <TableCell>{u.promedio_asistencia ?? 0}%</TableCell>
                        <TableCell>{u.promedio_llegada_tarde ?? 0}%</TableCell>
                      </TableRow>
                    ))}
                  <TableRow className='bg-yellow-100'>
                    <TableCell className='font-medium'>PROMEDIO TOTAL</TableCell>
                    {cortesKeys.map(ck => {
                      const t = porCorte?.[ck]?.totales || {}
                      return (
                        <Fragment key={ck}>
                          <TableCell key={`tot-${ck}-aj`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {t.ausencias_justificadas ?? 0}
                          </TableCell>
                          <TableCell key={`tot-${ck}-ai`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {t.ausencias_injustificadas ?? 0}
                          </TableCell>
                          <TableCell key={`tot-${ck}-llt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {t.tardes_justificadas ?? 0}
                          </TableCell>
                          <TableCell key={`tot-${ck}-llti`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {t.tardes_injustificadas ?? 0}
                          </TableCell>
                          <TableCell key={`tot-${ck}-pa`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {t.promedio_asistencia ?? 0}%
                          </TableCell>
                          <TableCell key={`tot-${ck}-pllt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {t.promedio_llegada_tarde ?? 0}%
                          </TableCell>
                        </Fragment>
                      )
                    })}
                    <TableCell>{promedioTotalAsistencia.toFixed(2)}%</TableCell>
                    <TableCell>{promedioTotalLlegadaTarde.toFixed(2)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() => handleExportGeneral('pdf')}
              disabled={!grupoId || exportGeneralPdfLoading}
            >
              {exportGeneralPdfLoading ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() => handleExportGeneral('xlsx')}
              disabled={!grupoId || exportGeneralExcelLoading}
            >
              {exportGeneralExcelLoading ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'general_grupo' && (
        <>
          <Paper className='mb-4'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2}>Grupo</TableCell>
                    <TableCell rowSpan={2}>Turno</TableCell>
                    {cortesKeys.map((ck, idx) => (
                      <TableCell
                        key={ck}
                        align='center'
                        colSpan={6}
                        className={corteColors[ck]}
                        sx={{ bgcolor: corteBg[ck] }}
                      >{`Corte ${idx + 1}`}</TableCell>
                    ))}
                    <TableCell align='center' colSpan={2}>
                      Prom
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    {cortesKeys.map(ck => (
                      <Fragment key={ck}>
                        <TableCell key={`${ck}-aj`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          AJ
                        </TableCell>
                        <TableCell key={`${ck}-ai`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          AI
                        </TableCell>
                        <TableCell key={`${ck}-llt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          LLT
                        </TableCell>
                        <TableCell key={`${ck}-llti`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          LLTI
                        </TableCell>
                        <TableCell key={`${ck}-pa`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          %A
                        </TableCell>
                        <TableCell key={`${ck}-pllt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          %LLT
                        </TableCell>
                      </Fragment>
                    ))}
                    <TableCell>%A</TableCell>
                    <TableCell>%LLT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={2 + cortesKeys.length * 6 + 2}>
                        <div className='flex items-center justify-center p-6'>
                          <CircularProgress size={24} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    (dataGeneralGrupo?.rows || []).map((r: any, idx: number) => (
                      <TableRow key={`${r.grupo}-${idx}`}>
                        <TableCell>{r.grupo}</TableCell>
                        <TableCell>{r.turno}</TableCell>
                        {cortesKeys.map(ck => {
                          const c = r.cortes?.[ck] || {}
                          return (
                            <Fragment key={ck}>
                              <TableCell
                                key={`${idx}-${ck}-aj`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.AJ ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-ai`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.AI ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-llt`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.LLT ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-llti`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.LLTI ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-pa`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c['%A'] ?? 0}%
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-pllt`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c['%LLT'] ?? 0}%
                              </TableCell>
                            </Fragment>
                          )
                        })}
                        <TableCell>{r.promedio_asistencia ?? 0}%</TableCell>
                        <TableCell>{r.promedio_llegada_tarde ?? 0}%</TableCell>
                      </TableRow>
                    ))}
                  <TableRow className='bg-yellow-100'>
                    <TableCell className='font-medium'>PROMEDIO TOTAL</TableCell>
                    <TableCell className='font-medium'></TableCell>
                    {cortesKeys.map(ck => {
                      const p = dataGeneralGrupo?.promedio_total_por_corte?.[ck] || {}
                      return (
                        <Fragment key={ck}>
                          <TableCell
                            key={`tot-${ck}-aj`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell
                            key={`tot-${ck}-ai`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell
                            key={`tot-${ck}-llt`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell
                            key={`tot-${ck}-llti`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell key={`tot-${ck}-pa`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {p['%A'] ?? 0}%
                          </TableCell>
                          <TableCell key={`tot-${ck}-pllt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {p['%LLT'] ?? 0}%
                          </TableCell>
                        </Fragment>
                      )
                    })}
                    <TableCell>{Number(dataGeneralGrupo?.promedio_general_asistencia || 0).toFixed(2)}%</TableCell>
                    <TableCell>{Number(dataGeneralGrupo?.promedio_general_llegada_tarde || 0).toFixed(2)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() => handleExportGeneralGrupo('pdf')}
              disabled={!periodoId || exportGeneralGrupoPdfLoading}
            >
              {exportGeneralGrupoPdfLoading ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() => handleExportGeneralGrupo('xlsx')}
              disabled={!periodoId || exportGeneralGrupoExcelLoading}
            >
              {exportGeneralGrupoExcelLoading ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'general_grado' && (
        <>
          <Paper className='mb-4'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2}>Grado</TableCell>
                    <TableCell rowSpan={2}>Turno</TableCell>
                    {cortesKeys.map((ck, idx) => (
                      <TableCell
                        key={ck}
                        align='center'
                        colSpan={6}
                        className={corteColors[ck]}
                        sx={{ bgcolor: corteBg[ck] }}
                      >{`Corte ${idx + 1}`}</TableCell>
                    ))}
                    <TableCell align='center' colSpan={2}>
                      Prom
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    {cortesKeys.map(ck => (
                      <Fragment key={ck}>
                        <TableCell key={`${ck}-aj`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          AJ
                        </TableCell>
                        <TableCell key={`${ck}-ai`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          AI
                        </TableCell>
                        <TableCell key={`${ck}-llt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          LLT
                        </TableCell>
                        <TableCell key={`${ck}-llti`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          LLTI
                        </TableCell>
                        <TableCell key={`${ck}-pa`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          %A
                        </TableCell>
                        <TableCell key={`${ck}-pllt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                          %LLT
                        </TableCell>
                      </Fragment>
                    ))}
                    <TableCell>%A</TableCell>
                    <TableCell>%LLT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={2 + cortesKeys.length * 6 + 2}>
                        <div className='flex items-center justify-center p-6'>
                          <CircularProgress size={24} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    (dataGeneralGrado?.rows || []).map((r: any, idx: number) => (
                      <TableRow key={`${r.grado}-${r.turno}-${idx}`}>
                        <TableCell>{r.grado}</TableCell>
                        <TableCell>{r.turno}</TableCell>
                        {cortesKeys.map(ck => {
                          const c = r.cortes?.[ck] || {}
                          return (
                            <Fragment key={ck}>
                              <TableCell
                                key={`${idx}-${ck}-aj`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.AJ ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-ai`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.AI ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-llt`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.LLT ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-llti`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c.LLTI ?? 0}
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-pa`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c['%A'] ?? 0}%
                              </TableCell>
                              <TableCell
                                key={`${idx}-${ck}-pllt`}
                                className={corteColors[ck]}
                                sx={{ bgcolor: corteBg[ck] }}
                              >
                                {c['%LLT'] ?? 0}%
                              </TableCell>
                            </Fragment>
                          )
                        })}
                        <TableCell>{r.promedio_asistencia ?? 0}%</TableCell>
                        <TableCell>{r.promedio_llegada_tarde ?? 0}%</TableCell>
                      </TableRow>
                    ))}
                  <TableRow className='bg-yellow-100'>
                    <TableCell className='font-medium'>PROMEDIO TOTAL</TableCell>
                    <TableCell className='font-medium'></TableCell>
                    {cortesKeys.map(ck => {
                      const p = dataGeneralGrado?.promedio_total_por_corte?.[ck] || {}
                      return (
                        <Fragment key={ck}>
                          <TableCell
                            key={`tot-${ck}-aj`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell
                            key={`tot-${ck}-ai`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell
                            key={`tot-${ck}-llt`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell
                            key={`tot-${ck}-llti`}
                            className={corteColors[ck]}
                            sx={{ bgcolor: corteBg[ck] }}
                          ></TableCell>
                          <TableCell key={`tot-${ck}-pa`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {p['%A'] ?? 0}%
                          </TableCell>
                          <TableCell key={`tot-${ck}-pllt`} className={corteColors[ck]} sx={{ bgcolor: corteBg[ck] }}>
                            {p['%LLT'] ?? 0}%
                          </TableCell>
                        </Fragment>
                      )
                    })}
                    <TableCell>{Number(dataGeneralGrado?.promedio_general_asistencia || 0).toFixed(2)}%</TableCell>
                    <TableCell>{Number(dataGeneralGrado?.promedio_general_llegada_tarde || 0).toFixed(2)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() => handleExportGeneralGrado('pdf')}
              disabled={!periodoId || exportGeneralGradoPdfLoading}
            >
              {exportGeneralGradoPdfLoading ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() => handleExportGeneralGrado('xlsx')}
              disabled={!periodoId || exportGeneralGradoExcelLoading}
            >
              {exportGeneralGradoExcelLoading ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'grupo_alumno_semanal' && (
        <>
          <Paper className='mb-4'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2} sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>
                      #
                    </TableCell>
                    <TableCell rowSpan={2} sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>
                      Alumno
                    </TableCell>
                    {(() => {
                      const semanas: any[] = []
                      dataGrupoAlumnoSemanal?.fechas?.forEach((dia: string) => {
                        const date = new Date(dia + 'T12:00:00')
                        const day = date.getDay()
                        const diff = date.getDate() - (day === 0 ? 6 : day - 1)
                        const monday = new Date(date.setDate(diff))
                        const sunday = new Date(date.setDate(diff + 6))

                        const fmt = (d: Date) =>
                          `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
                        const label = `Semana ${fmt(monday)} al ${fmt(sunday)}`
                        const key = `${monday.toISOString().split('T')[0]}`

                        let sem = semanas.find((s: any) => s.key === key)
                        if (!sem) {
                          sem = { key, count: 0, label }
                          semanas.push(sem)
                        }
                        sem.count++
                      })
                      return semanas.map((s: any) => (
                        <TableCell
                          key={s.key}
                          align='center'
                          colSpan={s.count}
                          sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', border: '1px solid #ccc' }}
                        >
                          {s.label}
                        </TableCell>
                      ))
                    })()}
                    <TableCell
                      align='center'
                      rowSpan={2}
                      sx={{ fontWeight: 'bold', border: '1px solid #ccc', bgcolor: '#e2efda', fontSize: '0.75rem' }}
                    >
                      Total Presente por Estudiante
                    </TableCell>
                    <TableCell
                      align='center'
                      rowSpan={2}
                      sx={{ fontWeight: 'bold', border: '1px solid #ccc', bgcolor: '#dae3f3', fontSize: '0.75rem' }}
                    >
                      % de Presencia
                    </TableCell>
                    <TableCell
                      align='center'
                      rowSpan={2}
                      sx={{ fontWeight: 'bold', border: '1px solid #ccc', bgcolor: '#e2efda', fontSize: '0.75rem' }}
                    >
                      Total de Ausencia por estudiante
                    </TableCell>
                    <TableCell
                      align='center'
                      rowSpan={2}
                      sx={{ fontWeight: 'bold', border: '1px solid #ccc', bgcolor: '#dae3f3', fontSize: '0.75rem' }}
                    >
                      % de Ausentes
                    </TableCell>
                    <TableCell
                      align='center'
                      rowSpan={2}
                      sx={{ fontWeight: 'bold', border: '1px solid #ccc', bgcolor: '#e2efda', fontSize: '0.75rem' }}
                    >
                      Total de justificado por estudiante
                    </TableCell>
                    <TableCell
                      align='center'
                      rowSpan={2}
                      sx={{ fontWeight: 'bold', border: '1px solid #ccc', bgcolor: '#dae3f3', fontSize: '0.75rem' }}
                    >
                      % de Justificación
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    {dataGrupoAlumnoSemanal?.fechas?.map((dia: string) => {
                      const parts = dia.split('-')
                      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dia
                      const hasAttendance = dataGrupoAlumnoSemanal.fechas_con_asistencia?.includes(dia)
                      return (
                        <TableCell
                          key={dia}
                          align='center'
                          sx={{ fontWeight: 'bold', fontSize: '0.7rem', border: '1px solid #ccc', p: '2px' }}
                        >
                          {displayDate}
                          {!hasAttendance && (
                            <>
                              <br />
                              <span style={{ color: 'red' }}>x</span>
                            </>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={5 + (dataGrupoAlumnoSemanal?.fechas?.length || 0)}
                        sx={{ border: '1px solid #ccc' }}
                      >
                        <div className='flex items-center justify-center p-6'>
                          <CircularProgress size={24} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    dataGrupoAlumnoSemanal?.alumnos?.map((a: any, idx: number) => (
                      <TableRow key={a.user_id}>
                        <TableCell sx={{ border: '1px solid #ccc' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ border: '1px solid #ccc' }}>{a.nombre}</TableCell>
                        {dataGrupoAlumnoSemanal?.fechas?.map((dia: string) => {
                          const val = a.dias?.[dia] || '-'
                          const isWarning = val !== '' && val.toLowerCase() !== 'p' && val !== '-'
                          return (
                            <TableCell
                              key={dia}
                              align='center'
                              sx={{
                                backgroundColor: isWarning ? '#ffcccc' : 'inherit',
                                border: '1px solid #ccc'
                              }}
                            >
                              {val}
                            </TableCell>
                          )
                        })}
                        <TableCell align='center' sx={{ border: '1px solid #ccc', bgcolor: '#e2efda' }}>
                          {a.totales?.presentes || 0}
                        </TableCell>
                        <TableCell align='center' sx={{ border: '1px solid #ccc', bgcolor: '#dae3f3' }}>
                          {a.porcentajes?.presentes || 0}%
                        </TableCell>
                        <TableCell align='center' sx={{ border: '1px solid #ccc', bgcolor: '#e2efda' }}>
                          {a.totales?.ausentes || 0}
                        </TableCell>
                        <TableCell align='center' sx={{ border: '1px solid #ccc', bgcolor: '#dae3f3' }}>
                          {a.porcentajes?.ausentes || 0}%
                        </TableCell>
                        <TableCell align='center' sx={{ border: '1px solid #ccc', bgcolor: '#e2efda' }}>
                          {a.totales?.justificados || 0}
                        </TableCell>
                        <TableCell align='center' sx={{ border: '1px solid #ccc', bgcolor: '#dae3f3' }}>
                          {a.porcentajes?.justificados || 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && dataGrupoAlumnoSemanal?.alumnos?.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell
                          colSpan={(dataGrupoAlumnoSemanal?.fechas?.length || 0) + 8}
                          sx={{ border: 'none', height: '20px' }}
                        />
                      </TableRow>
                      {[
                        { label: 'Total Presentes', key: 'presentes', color: '#e2efda' },
                        { label: 'Total Ausentes', key: 'ausentes', color: '#e2efda' },
                        { label: 'Total Justificado', key: 'justificados', color: '#e2efda' },
                        { label: '% de Presentes', key: 'porcentaje_presentes', color: '#dae3f3' },
                        { label: '% de Ausentes', key: 'porcentaje_ausentes', color: '#dae3f3' },
                        { label: '% de Justificación', key: 'porcentaje_justificados', color: '#dae3f3' },
                        { label: 'separador', key: 'separador', color: 'transparent' },
                        { label: 'MASCULINOS * DIA PRESENTES', key: 'm_presentes', color: '#e2efda' },
                        { label: 'FEMENINOS * DIA PRESENTES', key: 'f_presentes', color: '#e2efda' },
                        { label: 'MASCULINO * DIA AUSENTES', key: 'm_ausentes', color: '#dae3f3' },
                        { label: 'FEMENINOS * DIA AUSENTES', key: 'f_ausentes', color: '#dae3f3' }
                      ].map((sRow, sIdx) => {
                        if (sRow.key === 'separador') {
                          return (
                            <TableRow key={`sep-${sIdx}`}>
                              <TableCell
                                colSpan={(dataGrupoAlumnoSemanal?.fechas?.length || 0) + 8}
                                sx={{ border: 'none', height: '10px' }}
                              />
                            </TableRow>
                          )
                        }
                        return (
                          <TableRow key={sRow.key} sx={{ bgcolor: sRow.color }}>
                            <TableCell colSpan={2} align='right' sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>
                              {sRow.label}
                            </TableCell>
                            {dataGrupoAlumnoSemanal?.fechas?.map((f: string) => {
                              let val = dataGrupoAlumnoSemanal?.totales_por_dia?.[f]?.[sRow.key] || 0
                              if (sRow.key.includes('porcentaje')) val = `${val}%`
                              return (
                                <TableCell key={f} align='center' sx={{ fontWeight: 'bold', border: '1px solid #ccc' }}>
                                  {val}
                                </TableCell>
                              )
                            })}
                            <TableCell colSpan={6} sx={{ border: '1px solid #ccc' }} />
                          </TableRow>
                        )
                      })}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() =>
                handleExportExtra('pdf', 'exportReporteSemanalPorGrupoYAlumno', 'GrupoAlumnoSemanal.pdf', [
                  grupoId,
                  fechaInicio,
                  fechaFin
                ])
              }
              disabled={!grupoId || !fechaInicio || !fechaFin || exportExtraLoading.pdf}
            >
              {exportExtraLoading.pdf ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() =>
                handleExportExtra('xlsx', 'exportReporteSemanalPorGrupoYAlumno', 'GrupoAlumnoSemanal.xlsx', [
                  grupoId,
                  fechaInicio,
                  fechaFin
                ])
              }
              disabled={!grupoId || !fechaInicio || !fechaFin || exportExtraLoading.xlsx}
            >
              {exportExtraLoading.xlsx ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'grupo_semanal' && (
        <>
          {loading && (
            <Paper className='mb-4 p-6 flex justify-center'>
              <CircularProgress size={24} />
            </Paper>
          )}
          {!loading &&
            dataGrupoSemanal?.semanas?.map((week: any, wIdx: number) => (
              <Paper key={wIdx} className='mb-10 p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                    ASISTENCIA ESCUELA EMPRENDEDORA
                  </Typography>
                  <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                    {week.etiqueta}
                  </Typography>
                </div>
                <TableContainer>
                  <Table size='small' sx={{ '& .MuiTableCell-root': { border: '1px solid #000', padding: '6px' } }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e2efda' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>GRADOS</TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                          TOTAL DE
                        </TableCell>
                        {week.dias.map((dia: string) => (
                          <TableCell key={dia} align='center' sx={{ fontWeight: 'bold' }}>
                            {new Date(dia + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase()}
                          </TableCell>
                        ))}
                        <TableCell align='center' sx={{ fontWeight: 'bold', bgcolor: '#f7cbac' }}>
                          % POR SESIÓN
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {week.detalle_grupos?.map((g: any, gIdx: number) => (
                        <TableRow key={gIdx}>
                          <TableCell sx={{ bgcolor: '#fff2cc', fontWeight: 'bold' }}>{g.grupo}</TableCell>
                          <TableCell align='center' sx={{ bgcolor: '#fff2cc', fontWeight: 'bold' }}>
                            {g.matricula}
                          </TableCell>
                          {week.dias.map((dia: string) => (
                            <TableCell key={dia} align='center'>
                              {g.asistencia_por_dia?.[dia] || 0}
                            </TableCell>
                          ))}
                          <TableCell align='center' sx={{ bgcolor: '#f7cbac', fontWeight: 'bold' }}>
                            {g.porcentaje_sesion}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#548235', '& .MuiTableCell-root': { color: 'white' } }}>
                        <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                          TOTAL X DIAS
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold' }}>
                          {week.matricula_total}
                        </TableCell>
                        {week.dias.map((dia: string) => (
                          <TableCell key={dia} align='center' sx={{ fontWeight: 'bold' }}>
                            {week.totales_x_dias?.[dia] ?? '-'}
                          </TableCell>
                        ))}
                        <TableCell sx={{ bgcolor: '#f7cbac' }} />
                      </TableRow>
                      <TableRow sx={{ bgcolor: '#f7cbac' }}>
                        <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                          % DE LA SEMANA
                        </TableCell>
                        <TableCell sx={{ borderRight: '1px solid #000' }} />
                        {week.dias.map((dia: string) => (
                          <TableCell key={dia} align='center' sx={{ fontWeight: 'bold' }}>
                            {week.porcentaje_de_la_semana?.[dia] ?? '-'}
                          </TableCell>
                        ))}
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={week.dias.length + 1} sx={{ border: 'none !important' }} />
                        <TableCell align='right' sx={{ fontWeight: 'bold', bgcolor: '#fff2cc' }}>
                          % ASIST SEMANAL
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold', bgcolor: '#fff2cc' }}>
                          {week.porcentaje_asist_semanal}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={week.dias.length + 1} sx={{ border: 'none !important' }} />
                        <TableCell
                          align='right'
                          sx={{ fontWeight: 'bold', bgcolor: '#548235', color: 'white !important' }}
                        >
                          MATRICULA
                        </TableCell>
                        <TableCell align='center' sx={{ fontWeight: 'bold', bgcolor: '#fff2cc' }}>
                          {week.matricula_total}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}

          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() =>
                handleExportExtra('pdf', 'exportReporteSemanalPorGrupo', 'GrupoSemanal.pdf', [fechaInicio, fechaFin])
              }
              disabled={!fechaInicio || !fechaFin || exportExtraLoading.pdf}
            >
              {exportExtraLoading.pdf ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() =>
                handleExportExtra('xlsx', 'exportReporteSemanalPorGrupo', 'GrupoSemanal.xlsx', [fechaInicio, fechaFin])
              }
              disabled={!fechaInicio || !fechaFin || exportExtraLoading.xlsx}
            >
              {exportExtraLoading.xlsx ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'global_rango' && (
        <>
          <Paper className='mb-4'>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Semana</TableCell>
                    <TableCell align='center'>Porcentaje de Asistencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <div className='flex items-center justify-center p-6'>
                          <CircularProgress size={24} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    dataGlobalRango?.reporte_semanal?.map((s: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{s.semana_etiqueta}</TableCell>
                        <TableCell align='center'>{s.porcentaje}%</TableCell>
                      </TableRow>
                    ))}
                  {!loading && dataGlobalRango && (
                    <TableRow className='bg-yellow-100'>
                      <TableCell className='font-medium'>PROMEDIO GLOBAL DEL PERÍODO (Estimado)</TableCell>
                      <TableCell align='center' className='font-medium'>
                        {dataGlobalRango.reporte_semanal && dataGlobalRango.reporte_semanal.length > 0
                          ? (
                              dataGlobalRango.reporte_semanal.reduce(
                                (acc: number, cur: any) => acc + (cur.porcentaje || 0),
                                0
                              ) / dataGlobalRango.reporte_semanal.length
                            ).toFixed(2)
                          : '0.00'}
                        %
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() =>
                handleExportExtra('pdf', 'exportReporteGlobalRango', 'GlobalRango.pdf', [
                  periodoId,
                  fechaInicio,
                  fechaFin
                ])
              }
              disabled={!periodoId || !fechaInicio || !fechaFin || exportExtraLoading.pdf}
            >
              {exportExtraLoading.pdf ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() =>
                handleExportExtra('xlsx', 'exportReporteGlobalRango', 'GlobalRango.xlsx', [
                  periodoId,
                  fechaInicio,
                  fechaFin
                ])
              }
              disabled={!periodoId || !fechaInicio || !fechaFin || exportExtraLoading.xlsx}
            >
              {exportExtraLoading.xlsx ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
      {tab === 'inasistencias_grupo' && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading && (
              <div className='flex items-center justify-center p-10'>
                <CircularProgress />
              </div>
            )}
            {!loading &&
              dataInasistenciasGrupo?.semanas?.map((semana, idx) => (
                <Paper key={idx} sx={{ p: 4, overflowX: 'auto' }}>
                  <Typography
                    variant='h6'
                    sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}
                  >
                    {semana.etiqueta}
                  </Typography>

                  <TableContainer component={Box}>
                    <Table
                      size='small'
                      sx={{ borderCollapse: 'collapse', '& th, & td': { border: '1px solid #000', p: 0 } }}
                    >
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#92D050' }}>
                          <TableCell sx={{ fontWeight: 'bold', minWidth: 60, textAlign: 'center', p: 1 }}>
                            GRADOS
                          </TableCell>
                          {semana.fechas.map(f => (
                            <TableCell key={f.fecha} align='center' colSpan={2} sx={{ fontWeight: 'bold', p: 1 }}>
                              {f.dia_nombre}
                              <br />
                              <Typography variant='caption'>{f.dia_mes}</Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {semana.detalle_grupos.map(g => (
                          <TableRow key={g.id}>
                            <TableCell
                              sx={{
                                bgcolor: '#FFFF00',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                p: 1
                              }}
                            >
                              {g.grupo}
                            </TableCell>
                            {semana.fechas.map(f => {
                              const estudiantes = g.dias[f.fecha] || []
                              return (
                                <Fragment key={f.fecha}>
                                  <TableCell sx={{ verticalAlign: 'top', minWidth: 100 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                      {estudiantes.map((est: any, eIdx: number) => (
                                        <Box
                                          key={eIdx}
                                          sx={{
                                            fontSize: '0.7rem',
                                            borderBottom: eIdx < estudiantes.length - 1 ? '1px solid #eee' : 'none',
                                            p: 0.5
                                          }}
                                        >
                                          {est.nombre}
                                        </Box>
                                      ))}
                                    </Box>
                                  </TableCell>
                                  <TableCell sx={{ verticalAlign: 'top', width: 30, textAlign: 'center' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                      {estudiantes.map((est: any, eIdx: number) => (
                                        <Box
                                          key={eIdx}
                                          sx={{
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            borderBottom: eIdx < estudiantes.length - 1 ? '1px solid #eee' : 'none',
                                            p: 0.5
                                          }}
                                        >
                                          {est.codigo}
                                        </Box>
                                      ))}
                                    </Box>
                                  </TableCell>
                                </Fragment>
                              )
                            })}
                          </TableRow>
                        ))}

                        {/* Secciones de consolidado UNIFICADAS */}
                        {[
                          { label: 'PERMISO', class: '#BDD7EE', key: 'PERMISO' },
                          { label: 'INASISTENCIAS', class: '#FFFF00', key: 'INASISTENCIAS' },
                          { label: 'JUSTIFICADOS', class: '#92D050', key: 'JUSTIFICADOS' },
                          { label: 'SUSPENDIDOS', class: '#FF0000', color: '#FFF', key: 'SUSPENDIDOS' }
                        ].map(type => (
                          <TableRow key={type.key}>
                            <TableCell
                              sx={{
                                bgcolor: type.class,
                                color: type.color || 'inherit',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                p: 1
                              }}
                            >
                              {type.label}
                            </TableCell>
                            {semana.fechas.map(f => (
                              <Fragment key={f.fecha}>
                                <TableCell
                                  sx={{
                                    bgcolor: '#F8CBAD',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    p: 1,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {f.dia_nombre}
                                </TableCell>
                                <TableCell
                                  align='center'
                                  sx={{ fontWeight: 'bold', bgcolor: type.class, color: type.color || 'inherit', p: 1 }}
                                >
                                  {semana.consolidado[f.fecha]?.[type.key] || 0}
                                </TableCell>
                              </Fragment>
                            ))}
                          </TableRow>
                        ))}

                        {/* Fila TOTAL final */}
                        <TableRow>
                          <TableCell
                            sx={{ bgcolor: '#548235', color: '#FFF', fontWeight: 'bold', textAlign: 'center', p: 1 }}
                          >
                            TOTAL
                          </TableCell>
                          {semana.fechas.map(f => (
                            <Fragment key={f.fecha}>
                              <TableCell
                                sx={{
                                  bgcolor: '#548235',
                                  color: '#FFF',
                                  fontWeight: 'bold',
                                  textAlign: 'center',
                                  p: 1,
                                  fontSize: '0.75rem'
                                }}
                              >
                                TOTAL
                              </TableCell>
                              <TableCell
                                align='center'
                                sx={{ fontWeight: 'bold', bgcolor: '#548235', color: '#FFF', p: 1 }}
                              >
                                {semana.consolidado[f.fecha]?.TOTAL || 0}
                              </TableCell>
                            </Fragment>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ))}
          </Box>

          <div className='flex gap-3 mt-4'>
            <Button
              variant='outlined'
              onClick={() =>
                handleExportExtra('pdf', 'exportReporteInasistenciasGrupo', 'Inasistencias.pdf', [
                  grupoId || 0,
                  fechaInicio,
                  fechaFin,
                  periodoId || 0
                ])
              }
              disabled={!periodoId || !fechaInicio || !fechaFin || exportExtraLoading.pdf}
            >
              {exportExtraLoading.pdf ? <CircularProgress size={16} /> : 'Exportar PDF'}
            </Button>
            <Button
              variant='contained'
              onClick={() =>
                handleExportExtra('xlsx', 'exportReporteInasistenciasGrupo', 'Inasistencias.xlsx', [
                  grupoId || 0,
                  fechaInicio,
                  fechaFin,
                  periodoId || 0
                ])
              }
              disabled={!periodoId || !fechaInicio || !fechaFin || exportExtraLoading.xlsx}
            >
              {exportExtraLoading.xlsx ? <CircularProgress size={16} /> : 'Exportar Excel'}
            </Button>
          </div>
        </>
      )}
    </Box>
  )
}
