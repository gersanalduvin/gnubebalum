import ResourcesView from '@/features/padres/components/ResourcesView'

interface Props {
  studentId: number
}

const ResourcesTab = ({ studentId }: Props) => {
  return <ResourcesView studentId={studentId} />
}

export default ResourcesTab
