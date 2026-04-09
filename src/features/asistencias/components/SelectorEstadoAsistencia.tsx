'use client'
import { Grid, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import type { EstadoAsistencia } from '../types'

interface Props {
  value: EstadoAsistencia
  onChange: (value: EstadoAsistencia) => void
}

export default function SelectorEstadoAsistencia({ value, onChange }: Props) {
  const isJustificada = value === 'ausencia_justificada' || value === 'tarde_justificada'
  const isTarde = value === 'tarde_justificada' || value === 'tarde_injustificada'

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={4}>
        <FormControl fullWidth size="small">
          <InputLabel id="estado-label">Estado</InputLabel>
          <Select labelId="estado-label" label="Estado" value={value} onChange={e => onChange(e.target.value as EstadoAsistencia)}>
            <MenuItem value="presente">Presente</MenuItem>
            <MenuItem value="ausencia_justificada">Ausencia Justificada</MenuItem>
            <MenuItem value="ausencia_injustificada">Ausencia Injustificada</MenuItem>
            <MenuItem value="tarde_justificada">Tarde Justificada</MenuItem>
            <MenuItem value="tarde_injustificada">Tarde Injustificada</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {isJustificada && (
        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" label="Justificación" required value={(undefined as any)} onChange={() => {}} />
        </Grid>
      )}
      {isTarde && (
        <Grid item xs={12} md={4}>
          <TextField fullWidth size="small" label="Hora" type="time" required value={(undefined as any)} onChange={() => {}} />
        </Grid>
      )}
    </Grid>
  )
}
