'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n/client';

const VOCI = [
  { href: '/monitoraggio/configurazione/costi-sistema', nome: 'mon.costiSistema' },
  { href: '/monitoraggio/configurazione/parametri', nome: 'mon.parametri' }
] as const;

export function NavConfigurazione() {
  const p = usePathname();
  const t = useT();
  return (
    <>
      {VOCI.map((v) => (
        <Link key={v.href} className="subnav__a" href={v.href} aria-current={p.startsWith(v.href) ? 'page' : undefined}>
          <span>{t(v.nome)}</span>
        </Link>
      ))}
    </>
  );
}
