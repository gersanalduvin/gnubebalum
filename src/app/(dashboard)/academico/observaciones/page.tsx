import StudentObservationPage from '@/features/docente-dashboard/pages/StudentObservationPage'

export const metadata = {
  title: 'Administración de Observaciones'
}

export default function Page() {
  return <StudentObservationPage isAdmin={true} />
}
