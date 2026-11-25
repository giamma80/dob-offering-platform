import { Testata } from '@/components/Testata';
import { supabaseServer } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { TabMonitoraggio } from './TabMonitoraggio';

export default async function MonitoraggioLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  return (
    <div className="alt-root">
      <Testata area="monitoraggio" />
      <TabMonitoraggio admin={isAdmin(user?.email)} />
      {children}
    </div>
  );
}
