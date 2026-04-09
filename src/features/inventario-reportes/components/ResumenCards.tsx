// MUI Imports
import {
    Avatar,
    Card,
    CardContent,
    Grid,
    Typography,
    useTheme
} from '@mui/material'

import {
    AttachMoney,
    Inventory2,
    LocalOffer,
    TrendingUp
} from '@mui/icons-material'

import type { ResumenUtilidad } from '../types/reporteUtilidad'

interface Props {
  resumen: ResumenUtilidad
}

export default function ResumenCards({ resumen }: Props) {
  const theme = useTheme()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO',
      minimumFractionDigits: 2
    }).format(value)
  }

  const cards = [
    {
      title: 'Total Productos',
      value: resumen.total_productos,
      subValue: `${resumen.total_unidades.toFixed(2)} unidades`,
      icon: <Inventory2 sx={{ fontSize: '1.75rem' }} />,
      color: theme.palette.primary.main,
      bgcolor: theme.palette.primary.light
    },
    {
      title: 'Valor Costo',
      value: formatCurrency(resumen.valor_inventario_costo),
      subValue: '',
      icon: <AttachMoney sx={{ fontSize: '1.75rem' }} />,
      color: theme.palette.info.main,
      bgcolor: theme.palette.info.light
    },
    {
      title: 'Venta Realizada',
      value: formatCurrency(resumen.valor_inventario_venta),
      subValue: '',
      icon: <LocalOffer sx={{ fontSize: '1.75rem' }} />,
      color: theme.palette.warning.main,
      bgcolor: theme.palette.warning.light
    },
    {
      title: 'Ganancia Real',
      value: formatCurrency(resumen.ganancia_potencial),
      subValue: `Margen Real: ${resumen.margen_promedio.toFixed(2)}%`,
      icon: <TrendingUp sx={{ fontSize: '1.75rem' }} />,
      color: theme.palette.success.main,
      bgcolor: theme.palette.success.light
    }
  ]

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Grid container alignItems='center' spacing={2}>
                <Grid item>
                  <Avatar
                    variant='rounded'
                    sx={{
                      bgcolor: card.bgcolor + '20', // Opacity 20%
                      color: card.color,
                      width: 48,
                      height: 48
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant='body2' color='text.secondary' noWrap>
                    {card.title}
                  </Typography>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {card.value}
                  </Typography>
                  {card.subValue && (
                    <Typography variant='caption' color='text.secondary'>
                      {card.subValue}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
