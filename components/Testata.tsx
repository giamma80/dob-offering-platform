import Link from 'next/link';
import { esci } from '@/app/login/actions';
import { t as traduci } from '@/lib/i18n/server';
import { SelettoreLingua } from './SelettoreLingua';

export async function Testata({ area, contesto, azioni, hrefOfferta }: {
  area: 'offerta' | 'monitoraggio';
  contesto?: React.ReactNode;
  azioni?: React.ReactNode;
  hrefOfferta?: string;
}) {
  const t = await traduci();
  return (
    <header style={{ background: 'var(--surface-brand)', flex: '0 0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '0 24px', height: 56 }}>
        <Link className="brand" href="/monitoraggio/offerte" aria-label={`ALTEN · ${t('app.nome')}`}>
          <img src="/alten-mark.png" alt="" width={19} height={28} />
          <b>ALTEN</b><span className="brand__sep" /><span className="brand__p">{t('app.nome')}</span>
        </Link>
        <nav className="area" aria-label="Area">
          {area === 'offerta'
            ? <a aria-current="page" href={hrefOfferta ?? '#'}>{t('area.offerta')}</a>
            : <span className="area__off" aria-disabled="true">{t('area.offerta')}</span>}
          <Link aria-current={area === 'monitoraggio' ? 'page' : undefined} href="/monitoraggio/offerte">{t('area.monitoraggio')}</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center' }}>{contesto}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {azioni}
          <form action={esci}>
            <button className="alt-btn alt-btn--ghost" type="submit" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>{t('comune.esci')}</button>
          </form>
          <SelettoreLingua />
        </div>
      </div>
    </header>
  );
}
