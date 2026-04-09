'use client'
interface Props {
  corteLabel: string
  presentes: number
  excepciones: number
}

export default function ResumenAsistencia({ corteLabel, presentes, excepciones }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-medium">{corteLabel}</span>
      <span className="px-2 py-1 rounded bg-green-100 text-green-700">{presentes} presentes</span>
      <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">{excepciones} excepciones</span>
    </div>
  )
}
