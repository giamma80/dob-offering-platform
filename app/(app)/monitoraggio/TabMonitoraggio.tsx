'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n/client';

const TAB = [
  { href: '/monitoraggio/offerte', nome: 'mon.offerte' },
  { href: '/monitoraggio/business-plan', nome: 'mon.bp' },
  { href: '/monitoraggio/business-plan-new', nome: 'mon.bpNew' },
  { href: '/monitoraggio/costi-sistema', nome: 'mon.costiSistema' },
  { href: '/monitoraggio/parametri', nome: 'mon.parametri' }
] as const;

export function TabMonitoraggio() {
  const p = usePathname();
  const t = useT();
  return (
    <nav className="alt-tabs" aria-label="Monitoraggio" style={{ padding: '0 24px', background: 'var(--surface-card)', borderBottom: '1px solid var(--line-soft)' }}>
      {TAB.map((x) => (
        <Link key={x.href} className="alt-tab" href={x.href} aria-current={p === x.href || p.startsWith(`${x.href}/`) ? 'page' : undefined}>{t(x.nome)}</Link>
      ))}
    </nav>
  );
}
