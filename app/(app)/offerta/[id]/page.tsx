import { redirect } from 'next/navigation';

export default async function Offerta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/offerta/${id}/assessment`);
}
