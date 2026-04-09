// MUI Imports
import {
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField
} from '@mui/material'

import {
    PictureAsPdf,
    Search,
    TableChart
} from '@mui/icons-material'

import categoriasService from '@/features/inventario-categorias/services/services_categoriasService'
import { useEffect, useState } from 'react'
import type { FiltrosReporte } from '../types/reporteUtilidad'

import { CircularProgress } from '@mui/material'

interface Props {
  onFiltrar: (filtros: FiltrosReporte) => void
  onExportar: (view: boolean, filtros: FiltrosReporte) => void
  onExportarExcel: (filtros: FiltrosReporte) => void
  onFilterChange?: () => void
  loading?: boolean
  viewPdfLoading?: boolean
  downloadPdfLoading?: boolean
  excelLoading?: boolean
}

export default function FiltrosReporte({
  onFiltrar,
  onExportar,
  onExportarExcel,
  onFilterChange,
  loading,
  viewPdfLoading,
  downloadPdfLoading,
  excelLoading
}: Props) {
  const [tipoFiltro, setTipoFiltro] = useState<'actual' | 'mes' | 'fecha'>('actual')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [año, setAño] = useState(new Date().getFullYear())
  const [fechaCorte, setFechaCorte] = useState('')
  const [buscar, setBuscar] = useState('')

  // Category State
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  const [categorias, setCategorias] = useState<any[]>([])

  // Fetch Categories
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await categoriasService.getAllCategorias()
        setCategorias(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategorias()
  }, [])

  const getFiltrosActuales = (): FiltrosReporte => {
    const filtros: FiltrosReporte = {
      tipo_filtro: tipoFiltro,
      buscar,
      categoria_id: categoriaId !== '' ? Number(categoriaId) : undefined
    }

    if (tipoFiltro === 'mes') {
      filtros.year = año
      filtros.month = mes
    } else if (tipoFiltro === 'fecha') {
      filtros.fecha_corte = fechaCorte
    }

    return filtros
  }

  const handleFiltrar = () => {
    onFiltrar(getFiltrosActuales())
  }

  const handleExportar = (view: boolean) => {
    onExportar(view, getFiltrosActuales())
  }

  const handleExportarExcel = () => {
    onExportarExcel(getFiltrosActuales())
  }

  const handleChange = (setter: (val: any) => void, value: any) => {
    setter(value)
    onFilterChange?.()
  }

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          {/* Tipo de Filtro */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Periodo</InputLabel>
              <Select
                value={tipoFiltro}
                label="Periodo"
                onChange={(e) => handleChange(setTipoFiltro, e.target.value)}
              >
                <MenuItem value="actual">Ventas del Mes Actual</MenuItem>
                <MenuItem value="mes">Ventas por Mes</MenuItem>
                <MenuItem value="fecha">Ventas hasta la Fecha (Mismo mes)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por Mes */}
          {tipoFiltro === 'mes' && (
            <>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={mes}
                    label="Mes"
                    onChange={(e) => handleChange(setMes, Number(e.target.value))}
                  >
                    {meses.map((m, i) => (
                      <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Año"
                  type="number"
                  value={año}
                  onChange={(e) => handleChange(setAño, Number(e.target.value))}
                  inputProps={{ min: 2020, max: 2050 }}
                />
              </Grid>
            </>
          )}

          {/* Filtro por Fecha */}
          {tipoFiltro === 'fecha' && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Fecha de Corte"
                type="date"
                value={fechaCorte}
                onChange={(e) => handleChange(setFechaCorte, e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}

          {/* Categoría */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoriaId}
                label="Categoría"
                onChange={(e) => handleChange(setCategoriaId, e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Búsqueda */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Buscar Producto"
              placeholder="Código o nombre..."
              value={buscar}
              onChange={(e) => handleChange(setBuscar, e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Botones */}
          <Grid item xs={12} md={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleFiltrar}
              disabled={loading || viewPdfLoading || downloadPdfLoading || excelLoading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
            >
              Generar
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleExportar(true)} // View PDF
              disabled={loading || viewPdfLoading || downloadPdfLoading || excelLoading}
              startIcon={viewPdfLoading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
            >
              Ver PDF
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleExportar(false)} // Download PDF
              disabled={loading || viewPdfLoading || downloadPdfLoading || excelLoading}
              startIcon={downloadPdfLoading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
            >
              Descargar PDF
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={handleExportarExcel}
              disabled={loading || viewPdfLoading || downloadPdfLoading || excelLoading}
              startIcon={excelLoading ? <CircularProgress size={20} color="inherit" /> : <TableChart />}
            >
              Excel
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
