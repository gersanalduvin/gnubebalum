import { MensajeDetail } from '@/features/mensajeria/components';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MensajeDetail mensajeId={id} />;
}
