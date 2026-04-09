import ReportesPage from '@/features/asistencias/pages/ReportesPage'

export const metadata = {
  title: 'Reportes de Asistencia'
}

export default function Page() {
  return <ReportesPage isTeacherView={true} />
}
