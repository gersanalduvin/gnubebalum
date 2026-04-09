'use client'
import { Chip } from '@mui/material'

type Estado =
  | 'presente'
  | 'ausencia_justificada'
  | 'ausencia_injustificada'
  | 'tarde_justificada'
  | 'tarde_injustificada'

const map: Record<Estado, { label: string; className: string }> = {
  presente: { label: 'Presente', className: 'bg-blue-500 text-white' },
  ausencia_justificada: { label: 'Ausencia J', className: 'bg-green-500 text-white' },
  ausencia_injustificada: { label: 'Ausencia I', className: 'bg-red-500 text-white' },
  tarde_justificada: { label: 'Tarde J', className: 'bg-emerald-500 text-white' },
  tarde_injustificada: { label: 'Tarde I', className: 'bg-orange-500 text-white' }
}

export default function EstadoBadge({ estado }: { estado: Estado }) {
  const m = map[estado]
  return <Chip label={m.label} className={m.className} size="small" />
}
