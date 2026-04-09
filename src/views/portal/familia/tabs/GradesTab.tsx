'use client'

import GradesView from '@/features/padres/components/GradesView'

interface Props {
  studentId: number
}

const GradesTab = ({ studentId }: Props) => {
  return <GradesView studentId={studentId} />
}

export default GradesTab
