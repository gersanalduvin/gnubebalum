'use client'

import { useDebounce } from '@/hooks/useDebounce'
import { AddShoppingCart as AddShoppingCartIcon, Search as SearchIcon } from '@mui/icons-material'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, List, ListItem, ListItemText, TablePagination, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import recibosService from '../services/recibosService'
import type { ProductoCatalogo, ReciboDetalleRequest } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (detalle: ReciboDetalleRequest) => void
}

const ProductosSearchModal: React.FC<Props> = ({ open, onClose, onAdd }) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ProductoCatalogo[]>([])
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const debouncedQuery = useDebounce(query, 500)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await recibosService.getCatalogoProductos(query)
      if ((response as any).success) {
        setResults((response as any).data || [])
        setPage(0)
      } else {
        toast.error((response as any).message || 'Error al buscar productos')
        setResults([])
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Error al buscar productos')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setCantidades({})
      handleSearch() // cargar todos
    }
  }, [open])

  useEffect(() => {
    if (open) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, open])

  const pagedResults = useMemo(() => {
    const start = page * rowsPerPage
    return results.slice(start, start + rowsPerPage)
  }, [results, page, rowsPerPage])

  const handleAdd = (product: ProductoCatalogo) => {
    const cantidad = cantidades[product.id] ?? 1
    const detalle: ReciboDetalleRequest = {
      concepto: product.nombre,
      cantidad: Number(cantidad) || 1,
      monto: typeof (product as any).precio_venta === 'number' ? (product as any).precio_venta : parseFloat(String((product as any).precio_venta || 0)),
      tipo_pago: 'total',
      descuento: 0,
      producto_id: product.id
    }
    onAdd(detalle)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Buscar Productos
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Buscar"
            placeholder="Nombre del producto"
            value={query}
            onChange={e => setQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          {/* Búsqueda con debounce, sin botón */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <List dense>
            {pagedResults.map((item, index) => (
              <ListItem
                key={item.id}
                divider
                sx={{
                  bgcolor: index % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
                secondaryAction={
                  <IconButton color="primary" onClick={() => handleAdd(item)}>
                    <AddShoppingCartIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  disableTypography
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box>
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                          {item.nombre}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Código: {item.codigo}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: item.stock_actual && item.stock_actual > 0 ? 'primary.main' : 'error.main' }}>
                            Existencia: {item.stock_actual ?? 0}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" component="div" color="primary" sx={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'right', mr: 2 }}>
                        C$ {typeof (item as any).precio_venta === 'number' ? (item as any).precio_venta.toFixed(2) : parseFloat(String((item as any).precio_venta || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ minWidth: 100, ml: 1, mr: 5 }}>
                  <TextField
                    label="Cantidad"
                    type="number"
                    size="small"
                    value={cantidades[item.id] ?? 1}
                    onChange={e => setCantidades(prev => ({ ...prev, [item.id]: parseInt(e.target.value) }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </ListItem>
            ))}
          </List>
          <TablePagination
            component="div"
            count={results.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
            rowsPerPageOptions={[5,10,25,50]}
            labelRowsPerPage="Filas por página:"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProductosSearchModal
