'use client'
import { Chip } from '@mui/material'
import type { Corte } from '../types'

const colors: Record<Corte, string> = {
  corte_1: 'bg-blue-500',
  corte_2: 'bg-green-500',
  corte_3: 'bg-orange-500',
  corte_4: 'bg-purple-500'
}

const labels: Record<Corte, string> = {
  corte_1: 'Corte 1',
  corte_2: 'Corte 2',
  corte_3: 'Corte 3',
  corte_4: 'Corte 4'
}

interface Props {
  corte: Corte
}

export default function CorteBadge({ corte }: Props) {
  return <Chip label={labels[corte]} className={`${colors[corte]} text-white`} size="small" />
}
