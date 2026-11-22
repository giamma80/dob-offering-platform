import { Testata } from '@/components/Testata';
import { TabMonitoraggio } from './TabMonitoraggio';
import { t as traduci } from '@/lib/i18n/server';

export default async function MonitoraggioLayout({ children }: { children: React.ReactNode }) {
  const t = await traduci();
  return (
    <div className="alt-root">
      <Testata area="monitoraggio"
        contesto={<span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-azure-pale)' }}>{t('mon.tutte')}</span>} />
      <TabMonitoraggio />
      {children}
    </div>
  );
}
