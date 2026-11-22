import Link from 'next/link';
import { elencoOfferte } from '@/lib/dati';
import { creaOfferta, duplicaOfferta } from '@/lib/azioni';
import { euro } from '@/lib/ui/formato';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { t as traduci } from '@/lib/i18n/server';

export default async function Offerte({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  const [offerte, t] = await Promise.all([elencoOfferte(), traduci()]);
  const approvate = offerte.filter((o) => o.stato === 'approvata').length;
  return (
    <div className="shell">
      <aside className="subnav" aria-label="Sottosezioni">
        <p className="subnav__title">{t('mon.offerte')}</p>
        <a className="subnav__a" aria-current="page" href="#"><span>{t('off.tutte')}</span><small>{offerte.length}</small></a>
      </aside>
      <main className="content">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <h1 className="ttl">{t('mon.offerte')}</h1>
          <form action={creaOfferta} className="azioni" style={{ marginLeft: 'auto' }}>
            <span className="alt-inputwrap" style={{ maxWidth: 240 }}>
              <input className="alt-input" name="cliente" placeholder={t('off.cliente')} required aria-label={t('off.cliente')}
                aria-invalid={errore === 'cliente' ? true : undefined} />
            </span>
            <button className="alt-btn alt-btn--primary" type="submit">{t('off.nuova')}</button>
          </form>
        </div>
        <div className="alt-card">
          <div className="alt-card__body">
            {offerte.length === 0 ? <p className="vuoto">{t('off.nessuna')}</p> : (
              <TabellaOrdinabile
                colonne={[
                  { nome: t('off.cliente') }, { nome: t('off.stato') }, { nome: t('off.approccio') },
                  { nome: t('off.primoSaas'), num: true }, { nome: t('off.primoOnp'), num: true },
                  { nome: t('off.definito'), num: true }, { nome: '' }
                ]}
                righe={offerte.map((o) => ({
                  key: o.id,
                  celle: [
                    { v: o.cliente, html: <Link href={`/offerta/${o.id}/assessment`}><strong>{o.cliente}</strong></Link> },
                    { v: t(`stato.${o.stato}`), html: <span className={`alt-badge alt-badge--${o.stato === 'approvata' ? 'chiuso' : 'aperto'}`}>{t(`stato.${o.stato}`)}</span> },
                    { v: t(`approccio.${o.approccio}`) },
                    { v: o.sintesi?.saas?.primoAnno ?? -1, html: o.sintesi?.saas ? euro(o.sintesi.saas.primoAnno) : '—' },
                    { v: o.sintesi?.onPremise?.primoAnno ?? -1, html: o.sintesi?.onPremise ? euro(o.sintesi.onPremise.primoAnno) : '—' },
                    { v: o.sintesi?.avanzamento ?? 0, html: `${o.sintesi?.avanzamento ?? 0}%` },
                    { v: '', html: (
                      <form action={duplicaOfferta.bind(null, o.id)}>
                        <button className="alt-btn alt-btn--ghost" type="submit">{t('comune.duplica')}</button>
                      </form>
                    ) }
                  ]
                }))}
              />
            )}
          </div>
        </div>
      </main>
      <aside className="rail" aria-label="Statistiche">
        <div className="rail__card">
          <p className="rail__h">{t('off.stato')}</p>
          <div className="rail__stat"><span>{t('off.bozze')}</span><b>{offerte.filter((o) => o.stato === 'bozza').length}</b></div>
          <div className="rail__stat"><span>{t('off.inApprovazione')}</span><b>{offerte.filter((o) => o.stato === 'in_approvazione').length}</b></div>
          <div className="rail__stat"><span>{t('off.approvate')}</span><b>{approvate}</b></div>
        </div>
      </aside>
    </div>
  );
}
