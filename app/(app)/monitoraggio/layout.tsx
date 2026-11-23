import { Testata } from '@/components/Testata';
import { TabMonitoraggio } from './TabMonitoraggio';

export default async function MonitoraggioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="alt-root">
      <Testata area="monitoraggio" />
      <TabMonitoraggio />
      {children}
    </div>
  );
}
