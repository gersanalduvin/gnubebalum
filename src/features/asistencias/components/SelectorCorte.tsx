'use client'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import type { Corte } from '../types'

interface Props {
  value: Corte | ''
  onChange: (value: Corte) => void
  required?: boolean
}

export default function SelectorCorte({ value, onChange, required }: Props) {
  return (
    <FormControl fullWidth size="small" required={required}>
      <InputLabel id="corte-label">Corte</InputLabel>
      <Select labelId="corte-label" label="Corte" value={value || ''} onChange={e => onChange(e.target.value as Corte)}>
        <MenuItem value="corte_1">Corte 1</MenuItem>
        <MenuItem value="corte_2">Corte 2</MenuItem>
        <MenuItem value="corte_3">Corte 3</MenuItem>
        <MenuItem value="corte_4">Corte 4</MenuItem>
      </Select>
    </FormControl>
  )
}
