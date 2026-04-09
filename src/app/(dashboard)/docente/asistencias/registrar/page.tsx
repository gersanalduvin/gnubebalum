import RegistrarPage from '@/features/asistencias/pages/RegistrarPage'

export const metadata = {
  title: 'Registrar Asistencia'
}

export default function Page() {
  return <RegistrarPage isTeacherView={true} />
}
