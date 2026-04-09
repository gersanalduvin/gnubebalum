import StudentDetail from '@/views/portal/familia/StudentDetail'

// Next.js App Router Page
const StudentDetailPage = ({ params }: any) => {
  const id = Number(params?.id)
  return <StudentDetail studentId={Number.isFinite(id) ? id : 0} />
}

export default StudentDetailPage
