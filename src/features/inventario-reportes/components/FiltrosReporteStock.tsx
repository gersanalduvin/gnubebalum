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
    TextField,
    Switch,
    FormControlLabel,
    CircularProgress
} from '@mui/material'

import {
    PictureAsPdf,
    Search,
    TableChart
} from '@mui/icons-material'

import categoriasService from '@/features/inventario-categorias/services/services_categoriasService'
import { useEffect, useState } from 'react'
import type { FiltrosReporteStock } from '../types/reporteStock'

interface Props {
  onFiltrar: (filtros: FiltrosReporteStock) => void
  onExportar: (view: boolean, filtros: FiltrosReporteStock) => void
  onExportarExcel: (filtros: FiltrosReporteStock) => void
  onFilterChange?: () => void
  loading?: boolean
  viewPdfLoading?: boolean
  downloadPdfLoading?: boolean
  excelLoading?: boolean
}

export default function FiltrosReporteStock({
  onFiltrar,
  onExportar,
  onExportarExcel,
  onFilterChange,
  loading,
  viewPdfLoading,
  downloadPdfLoading,
  excelLoading
}: Props) {
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0])
  const [buscar, setBuscar] = useState('')
  const [soloConMovimientos, setSoloConMovimientos] = useState(false)
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

  const getFiltrosActuales = (): FiltrosReporteStock => {
    return {
      fecha_corte: fechaCorte,
      search: buscar,
      categoria_id: categoriaId !== '' ? Number(categoriaId) : undefined,
      solo_con_movimientos: soloConMovimientos
    }
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

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          {/* Fecha de Corte */}
          <Grid item xs={12} md={3}>
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

          {/* Solo con movimientos */}
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch 
                  checked={soloConMovimientos} 
                  onChange={(e) => handleChange(setSoloConMovimientos, e.target.checked)} 
                />
              }
              label="Solo con movimientos"
            />
          </Grid>

          {/* Botones */}
          <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleFiltrar}
              disabled={loading || viewPdfLoading || downloadPdfLoading || excelLoading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
            >
              Consultar
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleExportar(true)}
              disabled={loading || viewPdfLoading || downloadPdfLoading || excelLoading}
              startIcon={viewPdfLoading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
            >
              Ver PDF
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleExportar(false)}
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
