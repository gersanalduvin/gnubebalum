'use client'

import AlumnosService from '@/features/alumnos/services/alumnosService'
import PeriodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'
import type { ConfPeriodoLectivo } from '@/features/periodo-lectivo/types'
import { usePermissions } from '@/hooks/usePermissions'
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Definición de grupos de campos
const FIELD_GROUPS = {
  identificacion: {
    title: 'Datos de Identificación',
    fields: [
      { key: 'codigo_unico', label: 'Código Único' },
      { key: 'codigo_mined', label: 'Código MINED' },
      { key: 'primer_nombre', label: 'Primer Nombre' },
      { key: 'segundo_nombre', label: 'Segundo Nombre' },
      { key: 'primer_apellido', label: 'Primer Apellido' },
      { key: 'segundo_apellido', label: 'Segundo Apellido' },
      { key: 'sexo', label: 'Sexo' },
      { key: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
      { key: 'lugar_nacimiento', label: 'Lugar de Nacimiento' },
    ]
  },
  contacto: {
    title: 'Datos de Contacto (Madre/Padre)',
    fields: [
       { key: 'nombre_madre', label: 'Nombre Madre' },
       { key: 'telefono_madre', label: 'Teléfono Madre' },
       { key: 'direccion_madre', label: 'Dirección Madre' },
       { key: 'nombre_padre', label: 'Nombre Padre' },
       { key: 'telefono_padre', label: 'Teléfono Padre' },
       { key: 'direccion_padre', label: 'Dirección Padre' },
    ]
  },
  matricula: {
    title: 'Datos de Matrícula',
    fields: [
      { key: 'grado', label: 'Grado' },
      { key: 'seccion', label: 'Sección' },
      { key: 'turno', label: 'Turno' },
      { key: 'periodo_lectivo', label: 'Periodo Lectivo' },
      { key: 'numero_recibo', label: 'Número de Recibo' },
      { key: 'fecha_matricula', label: 'Fecha de Matrícula' },
    ]
  }
}

export default function ExportarAlumnosPage() {
  const router = useRouter()
  const { hasPermission, isLoading } = usePermissions()
  
  const [periodos, setPeriodos] = useState<ConfPeriodoLectivo[]>([])
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | ''>('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isLoading) return 

    if (!hasPermission('exportar.alumnos')) {
      toast.error('No tiene permisos para acceder a esta sección')
      router.push('/home')
      return
    }

    loadPeriodos()
  }, [hasPermission, isLoading, router])

  const loadPeriodos = async () => {
    try {
      setLoading(true)
      const response = await PeriodoLectivoService.getAllPeriodosLectivos()
      
      if (response.success) {
        setPeriodos(response.data)
        
        // Seleccionar el primero por defecto (asumimos el más reciente o relevante si el backend lo ordena)
        if (response.data.length > 0) {
          setSelectedPeriodo(response.data[0].id)
        }
      } else {
        toast.error(response.message || 'Error al cargar periodos')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar periodos lectivos')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldToggle = (key: string) => {
    setSelectedFields(prev => {
      if (prev.includes(key)) {
        return prev.filter(f => f !== key)
      } else {
        return [...prev, key]
      }
    })
  }

  const handleSelectAllGroup = (groupKey: string) => {
    const groupFields = FIELD_GROUPS[groupKey as keyof typeof FIELD_GROUPS].fields.map(f => f.key)
    const allSelected = groupFields.every(f => selectedFields.includes(f))

    if (allSelected) {
      // Deseleccionar todos
      setSelectedFields(prev => prev.filter(f => !groupFields.includes(f)))
    } else {
      // Seleccionar todos
      setSelectedFields(prev => {
        const unique = new Set([...prev, ...groupFields])
        return Array.from(unique)
      })
    }
  }

  const handleExport = async () => {
    if (!selectedPeriodo) {
      toast.warning('Seleccione un periodo lectivo')
      return
    }

    if (selectedFields.length === 0) {
      toast.warning('Seleccione al menos un campo para exportar')
      return
    }

    try {
      setDownloading(true)
      const blob = await AlumnosService.exportCustomReport({
        periodo_lectivo_id: Number(selectedPeriodo),
        fields: selectedFields 
      })

      // Crear link de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_alumnos_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Reporte generado exitosamente')
    } catch (error) {
      console.error(error)
      toast.error('Error al generar el reporte')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader 
        title="Exportar Datos de Alumnos" 
        subheader="Seleccione el periodo y los datos que desea incluir en el reporte Excel"
      />
      
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Periodo Lectivo</InputLabel>
                <Select
                  value={selectedPeriodo}
                  label="Periodo Lectivo"
                  onChange={(e) => setSelectedPeriodo(e.target.value as number)}
                  disabled={loading}
                >
                  {periodos.map((periodo) => (
                    <MenuItem key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
               <Button 
                variant="contained" 
                color="primary" 
                startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <i className="ri-file-excel-2-line" />}
                onClick={handleExport}
                disabled={downloading || loading || !selectedPeriodo}
              >
                {downloading ? 'Generando...' : 'Exportar a Excel'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => (
            <Grid item xs={12} md={6} key={groupKey}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" className="text-base font-semibold">
                    {group.title}
                  </Typography>
                  <Button size="small" onClick={() => handleSelectAllGroup(groupKey)}>
                    Alternar Todo
                  </Button>
                </Box>
                <Grid container>
                  {group.fields.map((field) => (
                    <Grid item xs={12} sm={6} key={field.key}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={selectedFields.includes(field.key)}
                            onChange={() => handleFieldToggle(field.key)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">{field.label}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </CardContent>
    </Card>
  )
}
