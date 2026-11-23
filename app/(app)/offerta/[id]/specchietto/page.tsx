import Link from 'next/link';
import { notFound } from 'next/navigation';
import { configOfferta, offerta } from '@/lib/dati';
import { specchietto } from '@/lib/engine';
import { Testata } from '@/components/Testata';
import { t as traduci } from '@/lib/i18n/server';
import { euro } from '@/lib/ui/formato';
import type { Chiave } from '@/lib/i18n/dizionari';
import { MenuUtente } from '@/components/utente/MenuUtente';
import { MappaArchitettura } from '@/components/offerta/MappaArchitettura';

/* Specchietto cliente: generato dal dettaglio con la sola funzione specchietto(), che non
   espone giornate, costi, margini né fornitori terzi. Esiste solo per offerte approvate. */
export default async function Specchietto({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ sc?: string }>;
}) {
  const [{ id }, { sc }] = await Promise.all([params, searchParams]);
  const o = await offerta(id);
  if (!o) notFound();
  const [{ dati: cfg, versione, ultima, congelata }, t] = await Promise.all([configOfferta(o), traduci()]);
  const scenari = (['saas', 'on_premise'] as const).filter((x) => x === 'saas' ? o.approccio !== 'on_premise' : o.approccio !== 'saas');
  const scenario = scenari.includes(sc as never) ? (sc as 'saas' | 'on_premise') : scenari[0];
  const approvata = o.stato === 'approvata';
  const s = approvata ? specchietto(cfg, o.dati, scenario) : null;
  const tot = Object.fromEntries(scenari.map((x) => [x, specchietto(cfg, o.dati, x).totalePrimoAnno]));
  const VOCE: Record<string, Chiave> = { 'Setup e impianto': 're.setup', Customizzazione: 're.custom', 'Canone annuo': 're.licenza' };

  return (
    <div className="alt-root">
      <Testata area="offerta" hrefOfferta={`/offerta/${id}/assessment`}
        contesto={<span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{o.cliente}</span>} />
      <nav className="alt-tabs" style={{ background: 'var(--surface-card)', padding: '0 24px', borderBottom: '1px solid var(--line-soft)', flex: '0 0 auto' }}>
        <Link className="alt-tab" href={`/offerta/${id}/assessment`}>{t('tab.dettaglio')}</Link>
        <Link className="alt-tab" href={`/offerta/${id}/specchietto`} aria-current="page">{t('tab.specchietto')}</Link>
      </nav>
      <div className="shell">
        <aside className="subnav" aria-label="Scenari">
          <p className="subnav__title">{t('tab.specchietto')}</p>
          {scenari.map((x) => (
            <Link key={x} className="subnav__a" href={`?sc=${x}`} aria-current={x === scenario ? 'page' : undefined}>
              <span>{t(`approccio.${x}` as Chiave)}</span>{approvata && <small>{euro(tot[x])}</small>}
            </Link>
          ))}
          <MenuUtente />
        </aside>
        <main className="content">
          {!s ? <p className="vuoto">{t('sp.bloccato')}</p> : (
            <div className="alt-card"><div className="alt-card__body" style={{ padding: '28px 30px' }}>
              <p style={{ margin: '0 0 22px', fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                {s.cliente} · Digital Onboarding
              </p>
              <p style={{ margin: '-16px 0 22px', fontSize: 13, color: 'var(--ink-secondary)' }}>
                {t(`approccio.${s.scenario}` as Chiave)} · {o.dati.assessment.volumeAnnuo.toLocaleString('it-IT')} {t('sp.pratiche')}
              </p>
              <table className="alt-table" style={{ fontSize: 15 }}>
                <tbody>
                  {s.righe.map((rr) => (
                    <tr key={rr.voce}>
                      <td style={{ padding: '15px 14px' }}><strong>{t(VOCE[rr.voce])}</strong>
                        {rr.nota && <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('sp.aggiornamenti')}</div>}</td>
                      <td className="is-num" style={{ padding: '15px 14px', fontSize: 20, fontWeight: 700 }}>
                        {euro(rr.importo)}{rr.ricorrente && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>&nbsp;{t('sp.anno')}</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="is-total"><td style={{ padding: '16px 14px' }}>{t('re.primoAnno')}</td>
                    <td className="is-num" style={{ padding: '16px 14px', fontSize: 24 }}>{euro(s.totalePrimoAnno)}</td></tr>
                  {s.extra.map((e) => (
                    <tr key={e.voce}><td style={{ padding: '15px 14px' }}><strong>{e.voce}</strong></td>
                      <td className="is-num" style={{ padding: '15px 14px', fontSize: 17, fontWeight: 700 }}>{euro(e.importo)}</td></tr>
                  ))}
                </tbody>
              </table>
              {s.moduli.length > 0 && (<>
                <p style={{ margin: '22px 0 8px', fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  {t('sp.moduli')}
                </p>
                <ul className="sp-moduli">{s.moduli.map((m) => <li key={m}>{m}</li>)}</ul>
              </>)}
              <p style={{ margin: '22px 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                {t('sp.architettura')}
              </p>
              <MappaArchitettura cliente dati={{
                terzi: s.architettura.terzi.map((x) => ({ id: x.id, stato: x.incluso ? 'incluso' : 'spento' })),
                piattaforma: s.architettura.piattaforma.map((x) => ({ id: x.id, stato: x.incluso ? 'incluso' : 'spento' })),
                cliente: s.architettura.cliente.map((x) => ({ id: x.id, stato: x.incluso ? 'incluso' : 'spento' })),
                moduli: s.architettura.moduli.map((m) => ({ id: m.id, nome: m.nome, stato: m.incluso ? 'incluso' : 'spento' })),
                deployment: s.architettura.deployment
              }} />
            </div></div>
          )}
        </main>
        <aside className="rail" aria-label={t('sp.esportazione')}>
          <div className="rail__card rail__card--brand"><p className="rail__h">{t('sp.esportazione')}</p>
            <div className="rail__stat"><span>{t('off.stato')}</span><b>{t(approvata ? 'sp.disponibile' : 'sp.bloccatoBreve')}</b></div>
          </div>
          <div className="rail__card"><p className="rail__h">{t('sp.righeVincoli')}</p>
            {cfg.vincoli.filter((v) => v.specchietto).map((v) => (
              <div key={v.id} className="rail__stat"><span>{v.nome}</span><b>{t(o.dati.vincoli[v.id] ? 'sp.si' : 'sp.no')}</b></div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
