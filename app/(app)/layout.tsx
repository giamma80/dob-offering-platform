import { supabaseServer } from '@/lib/supabase/server';
import { UtenteProvider } from '@/components/utente/MenuUtente';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return <UtenteProvider email={user?.email ?? ''}>{children}</UtenteProvider>;
}
