import Link from 'next/link';
import { notFound } from 'next/navigation';
import { configOfferta, offerta } from '@/lib/dati';
import { specchiettoManager } from '@/lib/engine';
import { Testata } from '@/components/Testata';
import { t as traduci } from '@/lib/i18n/server';
import { euro } from '@/lib/ui/formato';
import type { Chiave } from '@/lib/i18n/dizionari';
import { MenuUtente } from '@/components/utente/MenuUtente';
import { VistaManager } from '@/components/offerta/VistaManager';

/* Specchietto manager: la vista dello specchietto cliente con costi e margine, divisa in setup e canone.
   Interno ALTEN: nessuna esportazione, nessun salvataggio dei prezzi spostati. */
export default async function SpecchiettoManager({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ sc?: string }>;
}) {
  const [{ id }, { sc }] = await Promise.all([params, searchParams]);
  const o = await offerta(id);
  if (!o) notFound();
  const [{ dati: cfg }, t] = await Promise.all([configOfferta(o), traduci()]);
  const scenari = (['saas', 'on_premise'] as const).filter((x) => x === 'saas' ? o.approccio !== 'on_premise' : o.approccio !== 'saas');
  const scenario = scenari.includes(sc as never) ? (sc as 'saas' | 'on_premise') : scenari[0];
  const per = Object.fromEntries(scenari.map((x) => [x, specchiettoManager(cfg, o.dati, x)]));

  return (
    <div className="alt-root">
      <Testata area="offerta" hrefOfferta={`/offerta/${id}/assessment`}
        contesto={<span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{o.cliente}</span>} />
      <nav className="alt-tabs" style={{ background: 'var(--surface-card)', padding: '0 24px', borderBottom: '1px solid var(--line-soft)', flex: '0 0 auto' }}>
        <Link className="alt-tab" href={`/offerta/${id}/assessment`}>{t('tab.dettaglio')}</Link>
        <Link className="alt-tab" href={`/offerta/${id}/specchietto`}>{t('tab.specchietto')}</Link>
        <Link className="alt-tab" href={`/offerta/${id}/manager`} aria-current="page">{t('tab.manager')}</Link>
      </nav>
      <div className="shell">
        <aside className="subnav" aria-label="Scenari">
          <p className="subnav__title">{t('tab.manager')}</p>
          {scenari.map((x) => (
            <Link key={x} className="subnav__a" href={`?sc=${x}`} aria-current={x === scenario ? 'page' : undefined}>
              <span>{t(`approccio.${x}` as Chiave)}</span><small>{euro(per[x].primoAnno.margine)}</small>
            </Link>
          ))}
          <MenuUtente />
        </aside>
        <VistaManager key={scenario} iniziale={per[scenario]} />
      </div>
    </div>
  );
}
