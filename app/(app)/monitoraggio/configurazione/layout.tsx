import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';

export default async function ConfigurazioneLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!isAdmin(user?.email)) redirect('/monitoraggio/offerte');
  return children;
}
