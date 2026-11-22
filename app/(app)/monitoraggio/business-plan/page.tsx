import { configAttiva, elencoOfferte } from '@/lib/dati';
import { euro } from '@/lib/ui/formato';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { t as traduci } from '@/lib/i18n/server';

/* Recupero dell'investimento di piattaforma con le offerte approvate.
   Il margine di un'offerta approvata è quello dello scenario a cui è stata venduta:
   se l'offerta ne ha due, conta il SaaS (da sostituire con lo scenario firmato, vedi docs/backlog.md). */
export default async function BusinessPlan() {
  const [{ dati: cfg }, offerte, t] = await Promise.all([configAttiva(), elencoOfferte(), traduci()]);
  const investimento = cfg.investimento.sviluppo + cfg.investimento.amPrimoAnno;
  const approvate = offerte.filter((o) => o.stato === 'approvata' && o.sintesi);
  const contributi = approvate.map((o) => {
    const s = o.sintesi!.saas ?? o.sintesi!.onPremise!;
    return { id: o.id, cliente: o.cliente, primo: s.marginePrimoAnno, annuo: s.margineAnnuo };
  });
  const primoAnno = contributi.reduce((a, c) => a + c.primo, 0);
  const annuo = contributi.reduce((a, c) => a + c.annuo, 0);
  const residuo = Math.max(0, investimento - primoAnno);
  const anniPareggio = residuo === 0 ? 1 : annuo > 0 ? 1 + residuo / annuo : null;
  const recuperato = Math.min(1, primoAnno / investimento);

  return (
    <div className="shell">
      <aside className="subnav" aria-label="Sottosezioni">
        <p className="subnav__title">{t('mon.bp')}</p>
        <a className="subnav__a" aria-current="page" href="#"><span>{t('bp.recupero')}</span></a>
      </aside>
      <main className="content">
        <h1 className="ttl">{t('mon.bp')}</h1>
        <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('bp.investimento')}</h2></div>
          <div className="alt-card__body">
            <div className="bar" style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: 'var(--surface-sunken)' }}
              role="img" aria-label={`${Math.round(recuperato * 100)}%`}>
              <span style={{ width: `${recuperato * 100}%`, background: 'var(--accent-azure)' }} />
            </div>
            <div className="griglia-campi" style={{ marginTop: 16 }}>
              <div className="rail__stat"><span>{t('bp.inv')}</span><b>{euro(investimento)}</b></div>
              <div className="rail__stat"><span>{t('bp.primo')}</span><b>{euro(primoAnno)}</b></div>
              <div className="rail__stat"><span>{t('bp.annuo')}</span><b>{euro(annuo)}</b></div>
            </div>
          </div></div>
        <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('bp.contributo')}</h2></div>
          <div className="alt-card__body">
            {contributi.length === 0 ? <p className="vuoto">{t('bp.nessuna')}</p> : (
              <TabellaOrdinabile
                colonne={[{ nome: t('off.cliente') }, { nome: t('bp.primo'), num: true }, { nome: t('bp.margineAnnuo'), num: true }]}
                righe={contributi.map((c) => ({ key: c.id, celle: [{ v: c.cliente }, { v: c.primo, html: euro(c.primo) }, { v: c.annuo, html: euro(c.annuo) }] }))}
                totale={[{ v: t('comune.totale') }, { v: primoAnno, html: euro(primoAnno) }, { v: annuo, html: euro(annuo) }]}
              />
            )}
          </div></div>
      </main>
      <aside className="rail" aria-label="Statistiche">
        <div className="rail__card rail__card--brand">
          <p className="rail__h">{t('bp.pareggio')}</p>
          <div className="rail__stat"><span>{t('bp.anni')}</span><b>{anniPareggio ? anniPareggio.toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '—'}</b></div>
          <div className="rail__stat"><span>{t('bp.progetti')}</span><b>{contributi.length}</b></div>
        </div>
      </aside>
    </div>
  );
}
