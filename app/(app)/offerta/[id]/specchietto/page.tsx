import { Fragment } from 'react';
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
import { EsportaPdf } from '@/components/offerta/EsportaPdf';

/* Specchietto cliente: generato dal dettaglio con la sola funzione specchietto(), che non
   espone giornate, costi, margini né fornitori terzi. Si vede in ogni stato: in bozza usa l'ultima versione dei parametri, dall'approvazione quella congelata. */
export default async function Specchietto({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ sc?: string }>;
}) {
  const [{ id }, { sc }] = await Promise.all([params, searchParams]);
  const o = await offerta(id);
  if (!o) notFound();
  const [{ dati: cfg, versione, ultima, congelata }, t] = await Promise.all([configOfferta(o), traduci()]);
  const scenari = (['saas', 'on_premise'] as const).filter((x) => x === 'saas' ? o.approccio !== 'on_premise' : o.approccio !== 'saas');
  const scenario = scenari.includes(sc as never) ? (sc as 'saas' | 'on_premise') : scenari[0];
  const s = specchietto(cfg, o.dati, scenario);
  const righeUna = s.righe.filter((x) => !x.ricorrente);
  const righeAnno = s.righe.filter((x) => x.ricorrente);
  const unaTantum = righeUna.reduce((a, x) => a + x.importo, 0);
  const annuo = righeAnno.reduce((a, x) => a + x.importo, 0);
  const tot = Object.fromEntries(scenari.map((x) => [x, specchietto(cfg, o.dati, x).totalePrimoAnno]));
  const VOCE: Record<string, Chiave> = { messa: 'st.messa', infra: 'st.infra', canone: 're.licenza' };

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
              <span>{t(`approccio.${x}` as Chiave)}</span><small>{euro(tot[x])}</small>
            </Link>
          ))}
          <MenuUtente />
        </aside>
        <main className="content">
          <div className="alt-card sp-stampa"><div className="alt-card__body" style={{ padding: '28px 30px' }}>
              <p style={{ margin: '0 0 22px', fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                {s.cliente} · Digital Onboarding
              </p>
              <p style={{ margin: '-16px 0 22px', fontSize: 13, color: 'var(--ink-secondary)' }}>
                {t(`approccio.${s.scenario}` as Chiave)} · {o.dati.assessment.volumeAnnuo.toLocaleString('it-IT')} {t('sp.pratiche')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '0 0 22px' }}>
                {[{ k: 'sp.unaTantum', v: unaTantum, anno: false }, { k: 'sp.ognianno', v: annuo, anno: true }].map((b) => (
                  <div key={b.k} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{t(b.k as Chiave)}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{euro(b.v)}{b.anno && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)' }}>&nbsp;{t('sp.anno')}</span>}</div>
                  </div>
                ))}
              </div>
              {[{ titolo: 'sp.unaTantum', tot: 'sp.totUnaTantum', righe: righeUna, v: unaTantum, anno: false },
                { titolo: 'sp.ognianno', tot: 'sp.totAnnuo', righe: righeAnno, v: annuo, anno: true }].map((g) => (
                <table key={g.titolo} className="alt-table" style={{ fontSize: 15, marginBottom: 18 }}>
                  <thead><tr><th>{t(g.titolo as Chiave)}</th><th className="is-num">{g.anno ? `€ ${t('sp.anno')}` : '€'}</th></tr></thead>
                  <tbody>
                    {g.righe.map((rr) => (
                      <Fragment key={rr.id}>
                        <tr>
                          <td style={{ padding: '13px 14px' }}><strong>{t(VOCE[rr.id])}</strong>
                            {rr.nota && <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{t('sp.aggiornamenti')}</div>}</td>
                          <td className="is-num" style={{ padding: '13px 14px', fontSize: 18, fontWeight: 700 }}>{euro(rr.importo)}</td>
                        </tr>
                        {rr.sottovoci.length > 1 || (rr.sottovoci.length === 1 && rr.sottovoci[0].voce) ? rr.sottovoci.map((v) => (
                          <tr key={`${rr.id}-${v.id}`} className="sp-sotto">
                            <td>{v.voce ? t(`sp.sv.${v.id}` as Chiave, { v: v.voce }) : t(`sp.sv.${v.id}` as Chiave)}</td>
                            <td className="is-num">{euro(v.importo)}</td>
                          </tr>
                        )) : null}
                      </Fragment>
                    ))}
                    <tr className="is-total"><td style={{ padding: '14px' }}>{t(g.tot as Chiave)}</td>
                      <td className="is-num" style={{ padding: '14px', fontSize: 20 }}>{euro(g.v)}{g.anno && <span style={{ fontSize: 12, fontWeight: 600 }}>&nbsp;{t('sp.anno')}</span>}</td></tr>
                  </tbody>
                </table>
              ))}
              <table className="alt-table" style={{ fontSize: 15 }}>
                <tbody>
                  <tr className="is-total"><td style={{ padding: '14px' }}>{t('re.primoAnno')} <span style={{ fontWeight: 500, fontSize: 12 }}>({t('sp.unaTantum').toLowerCase()} + {t('sp.ognianno').toLowerCase()})</span></td>
                    <td className="is-num" style={{ padding: '14px', fontSize: 22 }}>{euro(s.totalePrimoAnno)}</td></tr>
                  {s.extra.length > 0 && (<>
                    <tr><td colSpan={2} style={{ padding: '18px 14px 6px', fontSize: 12, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}
                      title={t('sp.opzioniTip')}>{t('sp.opzioni')}</td></tr>
                    {s.extra.map((e) => (
                      <tr key={e.voce}><td style={{ padding: '12px 14px' }}><strong>{e.voce}</strong></td>
                        <td className="is-num" style={{ padding: '12px 14px', fontSize: 16, fontWeight: 700 }}>{euro(e.importo)}</td></tr>
                    ))}
                    <tr className="is-total"><td style={{ padding: '14px' }}>{t('sp.conOpzioni')}</td>
                      <td className="is-num" style={{ padding: '14px', fontSize: 18 }}>{euro(s.totalePrimoAnno + s.extra.reduce((a, e) => a + e.importo, 0))}</td></tr>
                  </>)}
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
        </main>
        <aside className="rail" aria-label={t('sp.esportazione')}>
          <div className="rail__card rail__card--brand"><p className="rail__h">{t('sp.esportazione')}</p>
            <div className="rail__stat"><span>{t('off.stato')}</span><b>{t(`stato.${o.stato}` as Chiave)}</b></div>
            <EsportaPdf nomeFile={`${s.cliente} - Digital Onboarding`} />
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
