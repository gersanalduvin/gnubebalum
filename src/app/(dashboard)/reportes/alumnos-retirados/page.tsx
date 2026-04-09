'use client'

import PeriodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'
import type { ConfPeriodoLectivo } from '@/features/periodo-lectivo/types'
import ReporteRetiradosService from '@/features/reporte-retirados/services/reporteRetiradosService'
import { usePermissions } from '@/hooks/usePermissions'
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Type for Student Data from API
interface WithdrawnStudent {
  user_id: number
  codigo_usuario: string
  nombre_completo: string
  grado_nombre: string
  seccion_nombre: string
  turno_nombre: string
  estado: string
  fecha_retiro: string
  observaciones: string
}

export default function AlumnosRetiradosPage() {
  const router = useRouter()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()

  const [periodos, setPeriodos] = useState<ConfPeriodoLectivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [students, setStudents] = useState<WithdrawnStudent[]>([])
  
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingExcel, setDownloadingExcel] = useState(false)

  useEffect(() => {
    if (permissionsLoading) return

    if (!hasPermission('usuarios.alumnos.retirados')) {
      toast.error('No tiene permisos para acceder a esta sección')
      router.push('/home')
      return
    }

    loadPeriodos()
  }, [permissionsLoading, hasPermission, router])

  const loadPeriodos = async () => {
    try {
      setLoadingPeriodos(true)
      const response = await PeriodoLectivoService.getAllPeriodosLectivos()
      if (response.success) {
        setPeriodos(response.data)
        if (response.data.length > 0) {
          // Select first period by default
          setSelectedPeriodo(response.data[0].id)
        }
      } else {
        toast.error(response.message || 'Error al cargar periodos')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar periodos lectivos')
    } finally {
      setLoadingPeriodos(false)
    }
  }

  // Load Report Data when period changes or manually triggered
  const loadReportData = async () => {
    if (!selectedPeriodo) return

    try {
      setLoadingData(true)
      const response = await ReporteRetiradosService.getReporte(Number(selectedPeriodo))
      // response structure: { data: { periodo: ..., alumnos: [...] } }
      // Check if wrapper exists or direct access
      const data = response.data || response
      if (data && data.alumnos) {
        setStudents(data.alumnos)
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar datos del reporte')
      setStudents([])
    } finally {
      setLoadingData(false)
    }
  }

  // Effect to load data when period changes (optional, or make it manual)
  useEffect(() => {
    if (selectedPeriodo) {
      loadReportData()
    }
  }, [selectedPeriodo])

  const handleDownloadPdf = async () => {
    if (!selectedPeriodo) return
    try {
      setDownloadingPdf(true)
      const blob = await ReporteRetiradosService.downloadPdf(Number(selectedPeriodo))
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast.success('PDF generado correctamente')
    } catch (error) {
      console.error(error)
      toast.error('Error al descargar PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (!selectedPeriodo) return
    try {
      setDownloadingExcel(true)
      const blob = await ReporteRetiradosService.downloadExcel(Number(selectedPeriodo))
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `alumnos_retirados_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Excel descargado correctamente')
    } catch (error) {
      console.error(error)
      toast.error('Error al descargar Excel')
    } finally {
      setDownloadingExcel(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'retiro') return 'error'
    if (status === 'retiro_anticipado') return 'warning'
    return 'default'
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Reporte de Alumnos Retirados" subheader="Visualice y exporte el listado de alumnos retirados por período lectivo" />
          <CardContent>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Periodo Lectivo</InputLabel>
                  <Select
                    value={selectedPeriodo}
                    label="Periodo Lectivo"
                    onChange={(e) => setSelectedPeriodo(e.target.value as number)}
                    disabled={loadingPeriodos}
                  >
                     {periodos.map((periodo) => (
                      <MenuItem key={periodo.id} value={periodo.id}>
                        {periodo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={loadReportData}
                    disabled={loadingData || !selectedPeriodo}
                >
                    {loadingData ? 'Cargando...' : 'Actualizar Lista'}
                </Button>
                <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={downloadingPdf ? <CircularProgress size={20} color="inherit" /> : <i className="ri-file-pdf-line" />}
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf || !selectedPeriodo || students.length === 0}
                >
                    PDF
                </Button>
                <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={downloadingExcel ? <CircularProgress size={20} color="inherit" /> : <i className="ri-file-excel-2-line" />}
                    onClick={handleDownloadExcel}
                    disabled={downloadingExcel || !selectedPeriodo || students.length === 0}
                >
                    Excel
                </Button>
              </Grid>
            </Grid>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>#</TableCell>
                    <TableCell>Nombre Estudiante</TableCell>
                    <TableCell>Grado / Sección</TableCell>
                    <TableCell>Turno</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Retiro</TableCell>
                    <TableCell>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingData ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : students.length > 0 ? (
                    students.map((student, index) => (
                      <TableRow key={student.user_id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                            <Typography variant="body2" fontWeight="500">
                                {student.nombre_completo}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            {student.grado_nombre} <br />
                            <Typography variant="caption" color="text.secondary">
                                {student.seccion_nombre}
                            </Typography>
                        </TableCell>
                        <TableCell>{student.turno_nombre}</TableCell>
                        <TableCell>
                            <Chip 
                                label={formatStatus(student.estado)} 
                                color={getStatusColor(student.estado) as any} 
                                size="small" 
                            />
                        </TableCell>
                        <TableCell>{student.fecha_retiro}</TableCell>
                        <TableCell>{student.observaciones}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron alumnos retirados para este período.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
