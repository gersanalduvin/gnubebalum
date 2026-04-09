import StudentObservationPage from '@/features/docente-dashboard/pages/StudentObservationPage'

export const metadata = {
  title: 'Observaciones de Alumnos'
}

export default function Page() {
  return <StudentObservationPage isAdmin={false} />
}
