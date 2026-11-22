'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  FASI, avanzamento, bloccanti, calcola, cumulato, vociCustomizzazione,
  type Config, type Fase, type FiguraId, type Offerta, type StatoValore
} from '@/lib/engine';
import { salvaOfferta } from '@/lib/azioni';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';
import { euro, numero, perc } from '@/lib/ui/formato';
import { CampoNumero, StatoPulsanti } from '@/components/CampoNumero';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { Toast, useToast } from '@/components/Toast';
import { Footer } from './Footer';
import { Timeline } from './Timeline';

type Stati = Record<string, StatoValore>;

export function EditorOfferta({ id, fase, cfg, iniziale, statiIniziali, solaLettura }: {
  id: string; fase: Fase; cfg: Config; iniziale: Offerta; statiIniziali: Stati; solaLettura: boolean;
}) {
  const t = useT();
  const [o, setO] = useState<Offerta>(iniziale);
  const [stati, setStati] = useState<Stati>(statiIniziali);
  const [sub, setSub] = useState(0);
  const [, start] = useTransition();
  const { toast, mostra } = useToast();
  const r = useMemo(() => calcola(cfg, o), [cfg, o]);
  const primo = useRef(true);

  /* salvataggio automatico, 800 ms dopo l'ultima modifica */
  useEffect(() => {
    if (primo.current) { primo.current = false; return; }
    if (solaLettura) return;
    const h = setTimeout(() => start(async () => {
      const x = await salvaOfferta(id, o, stati);
      if (x.errore) mostra({ tipo: 'errore', testo: x.errore });
    }), 800);
    return () => clearTimeout(h);
  }, [o, stati, id, solaLettura, mostra]);

  /* avviso sotto soglia: non blocca */
  const sotto = r.saas.attivo && r.saas.sottoSoglia;
  useEffect(() => {
    if (sotto) mostra({ tipo: 'avviso', testo: t('pr.sottoSoglia') });
  }, [sotto, mostra, t]);

  const upd = (f: (x: Offerta) => void, campo?: string) => {
    if (solaLettura) return;
    setO((p) => { const x = structuredClone(p); f(x); return x; });
    if (campo && (stati[campo] ?? 'assunto') === 'assunto') setStati((s) => ({ ...s, [campo]: 'dichiarato' }));
  };
  const st = (campo: string) => stati[campo] ?? 'assunto';
  const setSt = (campo: string) => (v: StatoValore) => !solaLettura && setStati((s) => ({ ...s, [campo]: v }));
  const fig = (idf: FiguraId) => cfg.figure.find((f) => f.id === idf)?.nome ?? idf;
  const onp = o.approccio !== 'saas';
  const pct = Object.fromEntries(FASI.map((f) => [f.id, avanzamento(o, stati, f.id)])) as Record<Fase, number>;

  const SUB: Record<Fase, Chiave[]> = {
    assessment: ['as.volumi', 'as.vincoli'],
    soluzione: ['so.approccio', 'so.connettori', 'so.integrazioni', 'so.cicd', 'so.ai'],
    stima: ['st.base', 'st.custom', 'st.messa', 'st.quote'],
    prezzo: ['pr.figure', 'pr.scaglioni', 'pr.vincoli'],
    resoconto: ['re.sintesi', 're.sostenibilita', 're.dettaglio']
  };
  const s = Math.min(sub, SUB[fase].length - 1);

  return (
    <>
      <nav className="alt-tabs" style={{ background: 'var(--surface-card)', padding: '0 24px', borderBottom: '1px solid var(--line-soft)', flex: '0 0 auto' }}>
        <Link className="alt-tab" href={`/offerta/${id}/assessment`} aria-current="page">{t('tab.dettaglio')}</Link>
        <Link className="alt-tab" href={`/offerta/${id}/specchietto`}>{t('tab.specchietto')}</Link>
      </nav>
      <Timeline id={id} corrente={fase} pct={pct} />
      <div className="shell">
        <aside className="subnav" aria-label="Sottosezioni">
          <p className="subnav__title">{t(`fase.${fase}` as Chiave)}</p>
          {SUB[fase].map((k, i) => (
            <a key={k} className="subnav__a" href="#" aria-current={i === s ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); setSub(i); }}><span>{t(k)}</span></a>
          ))}
        </aside>
        <main className="content">
          <h1 className="ttl">{t(SUB[fase][s])}</h1>

          {/* ------------------------------------------------ 1 ASSESSMENT */}
          {fase === 'assessment' && s === 0 && (
            <div className="alt-card"><div className="alt-card__body griglia-campi">
              <CampoNumero etichetta={t('as.volume')} valore={o.assessment.volumeAnnuo} min={0}
                stato={st('assessment.volumeAnnuo')} onStato={setSt('assessment.volumeAnnuo')}
                onChange={(v) => upd((x) => { x.assessment.volumeAnnuo = v; }, 'assessment.volumeAnnuo')} />
              <CampoNumero etichetta={t('as.crescita')} valore={o.assessment.crescita * 100} suffisso="%" min={0}
                stato={st('assessment.crescita')} onStato={setSt('assessment.crescita')}
                onChange={(v) => upd((x) => { x.assessment.crescita = v / 100; }, 'assessment.crescita')} />
              <CampoNumero etichetta={t('as.documenti')} valore={o.assessment.documentiPerPratica} min={0}
                stato={st('assessment.documentiPerPratica')} onStato={setSt('assessment.documentiPerPratica')}
                onChange={(v) => upd((x) => { x.assessment.documentiPerPratica = v; }, 'assessment.documentiPerPratica')} />
            </div></div>
          )}
          {fase === 'assessment' && s === 1 && (
            <div className="alt-card"><div className="alt-card__head"><span style={{ marginLeft: 'auto' }}>
              <StatoPulsanti stato={st('vincoli')} onStato={setSt('vincoli')} /></span></div>
              <div className="alt-card__body">
                <table className="alt-table">
                  <thead><tr><th style={{ width: 54 }}><span className="visually-hidden">{t('as.attivo')}</span></th><th>{t('as.vincolo')}</th></tr></thead>
                  <tbody>
                    {cfg.vincoli.map((v) => (
                      <tr key={v.id}>
                        <td><label className="alt-switch"><input type="checkbox" checked={!!o.vincoli[v.id]} aria-label={v.nome}
                          onChange={(e) => upd((x) => { x.vincoli[v.id] = e.target.checked; }, 'vincoli')} />
                          <span className="alt-switch__box" aria-hidden="true" /></label></td>
                        <td style={o.vincoli[v.id] ? undefined : { color: 'var(--ink-muted)' }}><strong>{v.nome}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
          )}

          {/* ------------------------------------------------ 2 SOLUZIONE */}
          {fase === 'soluzione' && s === 0 && (
            <div className="alt-card"><div className="alt-card__body"><div className="scelta">
              {(['saas', 'on_premise', 'entrambi'] as const).map((a) => (
                <label key={a} className={`scelta__c${o.approccio === a ? ' on' : ''}`}>
                  <input type="radio" name="approccio" checked={o.approccio === a}
                    onChange={() => upd((x) => { x.approccio = a; }, 'approccio')} />
                  <strong>{t(`approccio.${a}` as Chiave)}</strong>
                </label>
              ))}
            </div></div></div>
          )}
          {fase === 'soluzione' && (s === 1 || s === 2) && (() => {
            const k = s === 1 ? 'connettori' : 'integrazioni';
            const kc = s === 1 ? 'connettoriCustom' : 'integrazioniCustom';
            return (
              <div className="alt-card"><div className="alt-card__body"><div className="griglia">
                {cfg.catalogo[k].map((c) => {
                  const vinc = 'vincolo' in c && c.vincolo ? c.vincolo : null;
                  const bloccato = !!vinc && !o.vincoli[vinc];
                  const on = o.soluzione[k].includes(c.id);
                  return (
                    <label key={c.id} className={`opt${on ? ' opt--on' : ''}${bloccato ? ' is-bloccato' : ''}`}
                      title={bloccato ? t('so.bloccatoDa', { v: cfg.vincoli.find((v) => v.id === vinc)?.nome ?? '' }) : undefined}>
                      <input type="checkbox" checked={on} disabled={bloccato}
                        onChange={(e) => upd((x) => {
                          x.soluzione[k] = e.target.checked ? [...x.soluzione[k], c.id] : x.soluzione[k].filter((i) => i !== c.id);
                        }, `soluzione.${k}`)} />
                      <span className="opt__box" aria-hidden="true" />
                      <span className="opt__t">{c.nome}<span className="opt__sub">{o.stima.gg[c.id] ?? c.gg} gg</span></span>
                    </label>
                  );
                })}
                {o.soluzione[kc].map((c, i) => (
                  <label key={c.id} className="opt opt--on">
                    <span className="opt__t">
                      <span className="alt-inputwrap"><input className="alt-input" value={c.nome} aria-label={t('so.nuovaVoce')}
                        onChange={(e) => upd((x) => { x.soluzione[kc][i].nome = e.target.value; }, `soluzione.${k}`)} /></span>
                    </span>
                  </label>
                ))}
                {!solaLettura && (
                  <button type="button" className="opt opt--piu" onClick={() => upd((x) => {
                    x.soluzione[kc].push({ id: `${k}-${Date.now()}`, nome: t('so.nuovaVoce'), gg: 5, figura: 'dev' });
                  }, `soluzione.${k}`)}>{t('so.aggiungi')}</button>
                )}
              </div></div></div>
            );
          })()}
          {fase === 'soluzione' && s === 3 && (
            <div className={`alt-card${onp ? '' : ' is-bloccato'}`}><div className="alt-card__body">
              <div className="scelta">
                {cfg.catalogo.cicd.map((c) => (
                  <label key={c.id} className={`scelta__c${o.soluzione.cicd === c.id ? ' on' : ''}`}>
                    <input type="radio" name="cicd" checked={o.soluzione.cicd === c.id} disabled={!onp}
                      onChange={() => upd((x) => { x.soluzione.cicd = c.id; }, 'soluzione.cicd')} />
                    <strong>{c.nome}</strong><span>{o.stima.gg[c.id] ?? c.gg} gg</span>
                  </label>
                ))}
              </div>
              <label className={`opt${o.soluzione.passaggioConsegne ? ' opt--on' : ''}`} style={{ marginTop: 12 }}>
                <input type="checkbox" checked={o.soluzione.passaggioConsegne} disabled={!onp}
                  onChange={(e) => upd((x) => { x.soluzione.passaggioConsegne = e.target.checked; }, 'soluzione.cicd')} />
                <span className="opt__box" aria-hidden="true" />
                <span className="opt__t">{t('so.consegne')}<span className="opt__sub">{cfg.catalogo.passaggioConsegne.gg} gg</span></span>
              </label>
            </div></div>
          )}
          {fase === 'soluzione' && s === 4 && (
            <div className={`alt-card${onp ? '' : ' is-bloccato'}`}><div className="alt-card__body">
              <div className="scelta">
                {(['incluso', 'proxy', 'cliente'] as const).map((m) => (
                  <label key={m} className={`scelta__c${o.leve.aiOnPremise === m ? ' on' : ''}`}>
                    <input type="radio" name="ai" checked={o.leve.aiOnPremise === m} disabled={!onp}
                      onChange={() => upd((x) => { x.leve.aiOnPremise = m; }, 'leve.aiOnPremise')} />
                    <strong>{t(`so.ai.${m}` as Chiave)}</strong>
                    <span>{euro(m === 'cliente' ? 0 : m === 'proxy' ? r.aiAnno / (1 - o.prezzo.margineVenduto) : r.aiAnno)}</span>
                  </label>
                ))}
              </div>
              <div className="griglia-campi" style={{ marginTop: 16 }}>
                <label className={`opt${o.leve.manutenzioneOnPremise.attiva ? ' opt--on' : ''}`}>
                  <input type="checkbox" checked={o.leve.manutenzioneOnPremise.attiva} disabled={!onp}
                    onChange={(e) => upd((x) => { x.leve.manutenzioneOnPremise.attiva = e.target.checked; }, 'leve.manutenzioneOnPremise')} />
                  <span className="opt__box" aria-hidden="true" />
                  <span className="opt__t">{t('so.manutenzione')}<span className="opt__sub">{euro(r.onPremise.licenza.manutenzione)}</span></span>
                </label>
                <CampoNumero etichetta={t('st.giornate')} valore={o.leve.manutenzioneOnPremise.gg} min={0}
                  onChange={(v) => upd((x) => { x.leve.manutenzioneOnPremise.gg = v; }, 'leve.manutenzioneOnPremise')} />
              </div>
            </div></div>
          )}

          {/* ------------------------------------------------ 3 STIMA */}
          {fase === 'stima' && s === 0 && (
            <div className="alt-card"><div className="alt-card__body">
              <table className="alt-table">
                <thead><tr><th>{t('st.voce')}</th><th className="is-num">{t('st.giornate')}</th><th>{t('st.figura')}</th></tr></thead>
                <tbody>
                  {o.stima.base.map((b, i) => (
                    <tr key={b.id}>
                      <td>{b.nome}<StatoPulsanti stato={st(`stima.base.${b.id}`)} onStato={setSt(`stima.base.${b.id}`)} /></td>
                      <td className="is-num"><CampoNumero compatto etichetta={b.nome} valore={b.gg} min={0}
                        stato={st(`stima.base.${b.id}`)}
                        onChange={(v) => upd((x) => { x.stima.base[i].gg = v; }, `stima.base.${b.id}`)} /></td>
                      <td>{fig(b.figura)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="is-total"><td>{t('comune.totale')}</td>
                  <td className="is-num">{numero(o.stima.base.reduce((a, b) => a + b.gg, 0))}</td><td /></tr></tfoot>
              </table>
            </div></div>
          )}
          {fase === 'stima' && s === 1 && (() => {
            const voci = vociCustomizzazione(cfg, o).filter((v) => !o.stima.base.some((b) => b.id === v.id));
            return (
              <div className="alt-card"><div className="alt-card__body">
                <table className="alt-table">
                  <thead><tr><th>{t('st.voce')}</th><th className="is-num">{t('st.giornate')}</th><th>{t('st.figura')}</th></tr></thead>
                  <tbody>
                    {voci.map((v) => (
                      <tr key={v.id}>
                        <td>{v.nome}</td>
                        <td className="is-num"><CampoNumero compatto etichetta={v.nome} valore={v.gg} min={0}
                          onChange={(g) => upd((x) => {
                            const cust = [...x.soluzione.connettoriCustom, ...x.soluzione.integrazioniCustom].find((c) => c.id === v.id);
                            if (cust) cust.gg = g; else x.stima.gg[v.id] = g;
                          }, 'stima.custom')} /></td>
                        <td>{fig(v.figura)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="is-total"><td>{t('comune.totale')}</td>
                    <td className="is-num">{numero(voci.reduce((a, v) => a + v.gg, 0))}</td><td /></tr></tfoot>
                </table>
              </div></div>
            );
          })()}
          {fase === 'stima' && s === 2 && (
            <div className="alt-card"><div className="alt-card__body">
              <table className="alt-table">
                <thead><tr><th>{t('st.voce')}</th><th className="is-num">SaaS</th><th className="is-num">On-premise</th></tr></thead>
                <tbody>
                  {[...r.saas.setup.righe.map((x) => ({ ...x, sc: 'saas' })), ...r.onPremise.setup.righe.map((x) => ({ ...x, sc: 'onp' }))].map((x) => (
                    <tr key={x.sc + x.id}>
                      <td>{x.nome}</td>
                      <td className="is-num">{x.sc === 'saas' ? <CampoNumero compatto etichetta={x.nome} valore={x.gg} min={0}
                        onChange={(g) => upd((y) => { y.stima.gg[x.id] = g; }, 'stima.messa')} /> : '—'}</td>
                      <td className="is-num">{x.sc === 'onp' ? <CampoNumero compatto etichetta={x.nome} valore={x.gg} min={0}
                        onChange={(g) => upd((y) => { y.stima.gg[x.id] = g; }, 'stima.messa')} /> : '—'}</td>
                    </tr>
                  ))}
                  <tr><td>{t('st.quote')}</td>
                    <td className="is-num">{numero(r.saas.setup.quote.reduce((a, q) => a + q.gg, 0))}</td>
                    <td className="is-num">{numero(r.onPremise.setup.quote.reduce((a, q) => a + q.gg, 0))}</td></tr>
                </tbody>
                <tfoot><tr className="is-total"><td>{t('comune.totale')}</td>
                  <td className="is-num">{numero(r.saas.setup.gg)}</td><td className="is-num">{numero(r.onPremise.setup.gg)}</td></tr></tfoot>
              </table>
            </div></div>
          )}
          {fase === 'stima' && s === 3 && (
            <div className="alt-card"><div className="alt-card__head"><span style={{ marginLeft: 'auto' }}>
              <StatoPulsanti stato={st('stima.quote')} onStato={setSt('stima.quote')} /></span></div>
              <div className="alt-card__body griglia-campi">
                {cfg.quote.map((q) => (
                  <CampoNumero key={q.id} etichetta={q.nome} valore={(o.stima.quote[q.id] ?? q.pct) * 100} suffisso="%" min={0} max={100}
                    onChange={(v) => upd((x) => { x.stima.quote[q.id] = v / 100; }, 'stima.quote')} />
                ))}
              </div></div>
          )}

          {/* ------------------------------------------------ 4 PREZZO */}
          {fase === 'prezzo' && s === 0 && (
            <div className="alt-card"><div className="alt-card__body">
              <div className="griglia-campi" style={{ marginBottom: 16 }}>
                <CampoNumero etichetta={t('pr.margine')} valore={o.prezzo.margineVenduto * 100} suffisso="%" min={0} max={99}
                  stato={st('prezzo.margineVenduto')} onStato={setSt('prezzo.margineVenduto')}
                  onChange={(v) => upd((x) => { x.prezzo.margineVenduto = v / 100; x.prezzo.tariffe = {}; }, 'prezzo.margineVenduto')} />
              </div>
              <TabellaOrdinabile
                colonne={[{ nome: t('st.figura') }, { nome: t('pr.costo'), num: true }, { nome: t('pr.tariffa'), num: true }, { nome: t('pr.margine'), num: true }]}
                righe={cfg.figure.map((f) => ({
                  key: f.id,
                  celle: [
                    { v: f.nome },
                    { v: f.costo, html: euro(f.costo) },
                    { v: r.tariffe[f.id], html: <CampoNumero compatto etichetta={f.nome} valore={r.tariffe[f.id]} min={0}
                      onChange={(v) => upd((x) => { x.prezzo.tariffe[f.id] = v; }, 'prezzo.margineVenduto')} /> },
                    { v: (r.tariffe[f.id] - f.costo) / r.tariffe[f.id], html: perc((r.tariffe[f.id] - f.costo) / r.tariffe[f.id]) }
                  ]
                }))}
              />
            </div></div>
          )}
          {fase === 'prezzo' && s === 1 && (
            <div className="alt-card"><div className="alt-card__head"><span style={{ marginLeft: 'auto' }}>
              <StatoPulsanti stato={st('prezzo.scaglioni')} onStato={setSt('prezzo.scaglioni')} /></span></div>
              <div className="alt-card__body">
                <table className="alt-table">
                  <thead><tr><th className="is-num">{t('pr.da')}</th><th className="is-num">{t('pr.a')}</th><th className="is-num">{t('pr.euroTx')}</th>
                    <th className="is-num">{t('pr.transazioni')}</th><th className="is-num">{t('pr.importo')}</th></tr></thead>
                  <tbody>
                    {r.consumo.fasce.map((f, i) => (
                      <tr key={i}>
                        <td className="is-num">{numero(f.da)}</td>
                        <td className="is-num">{f.a === null ? '∞' : <CampoNumero compatto etichetta={`${t('pr.a')} ${i + 1}`} valore={f.a} min={f.da}
                          onChange={(v) => upd((x) => { x.prezzo.scaglioni[i].a = v; if (x.prezzo.scaglioni[i + 1]) x.prezzo.scaglioni[i + 1].da = v + 1; }, 'prezzo.scaglioni')} />}</td>
                        <td className="is-num"><CampoNumero compatto etichetta={`${t('pr.euroTx')} ${i + 1}`} valore={f.prezzo} min={0}
                          onChange={(v) => upd((x) => { x.prezzo.scaglioni[i].prezzo = v; }, 'prezzo.scaglioni')} /></td>
                        <td className="is-num">{numero(f.tx)}</td>
                        <td className="is-num">{euro(f.importo)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="is-total"><td colSpan={4}>{t('comune.totale')}</td><td className="is-num">{euro(r.consumo.totale)}</td></tr></tfoot>
                </table>
                <div className="griglia-campi" style={{ marginTop: 16 }}>
                  <label className="campo">
                    <span>{t('pr.metrica')}<StatoPulsanti stato={st('prezzo.metrica')} onStato={setSt('prezzo.metrica')} /></span>
                    <span className="alt-inputwrap">
                      <select className="alt-input" value={o.prezzo.metrica ?? ''}
                        onChange={(e) => upd((x) => { x.prezzo.metrica = (e.target.value || null) as Offerta['prezzo']['metrica']; }, 'prezzo.metrica')}>
                        <option value="">—</option>
                        <option value="avviata">{t('pr.metrica.avviata')}</option>
                        <option value="completata">{t('pr.metrica.completata')}</option>
                      </select>
                    </span>
                  </label>
                </div>
              </div></div>
          )}
          {fase === 'prezzo' && s === 2 && (
            <div className="alt-card"><div className="alt-card__body">
              <TabellaOrdinabile
                colonne={[{ nome: t('st.voce') }, { nome: t('pr.natura') }, { nome: t('pr.costo'), num: true }, { nome: t('pr.prezzo'), num: true }]}
                righe={[
                  ...r.vincoliUnaTantum.map((v) => ({ key: v.id, celle: [{ v: v.nome }, { v: t('pr.unaTantum') }, { v: v.costo, html: euro(v.costo) }, { v: v.prezzo, html: euro(v.prezzo) }] })),
                  ...r.saas.ricorrenti.filter((v) => cfg.vincoli.some((c) => c.id === v.id)).map((v) => ({
                    key: v.id, celle: [{ v: v.nome }, { v: t('pr.ricorrente') }, { v: v.costo, html: euro(v.costo) }, { v: '', html: '—' }]
                  }))
                ]}
              />
            </div></div>
          )}

          {/* ------------------------------------------------ 5 RESOCONTO */}
          {fase === 'resoconto' && s === 0 && (
            <>
              <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('re.approvazione')}</h2></div>
                <div className="alt-card__body">
                  <div className="rail__stat"><span>{t('off.definito')}</span><b>{pct.resoconto}%</b></div>
                  <div className="rail__stat"><span>{t('re.critici')}</span><b>{bloccanti(o, stati).length}</b></div>
                </div></div>
              <div className="alt-card"><div className="alt-card__body">
                <table className="alt-table">
                  <thead><tr><th>{t('st.voce')}</th>{r.saas.attivo && <th className="is-num">SaaS</th>}{r.onPremise.attivo && <th className="is-num">On-premise</th>}</tr></thead>
                  <tbody>
                    {([['re.setup', (x: typeof r.saas) => x.setup.prezzo], ['re.custom', (x: typeof r.saas) => x.customizzazione.prezzo],
                      ['re.licenza', (x: typeof r.saas) => x.licenza.totale]] as const).map(([k, f]) => (
                      <tr key={k}><td>{t(k)}</td>
                        {r.saas.attivo && <td className="is-num">{euro(f(r.saas))}</td>}
                        {r.onPremise.attivo && <td className="is-num">{euro(f(r.onPremise))}</td>}</tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="is-total"><td>{t('re.primoAnno')}</td>
                    {r.saas.attivo && <td className="is-num">{euro(r.saas.primoAnno.prezzo)}</td>}
                    {r.onPremise.attivo && <td className="is-num">{euro(r.onPremise.primoAnno.prezzo)}</td>}</tr></tfoot>
                </table>
              </div></div>
            </>
          )}
          {fase === 'resoconto' && s === 1 && (
            <div className="alt-card"><div className="alt-card__body">
              {([['saas', r.saas], ['on_premise', r.onPremise]] as const).filter(([, x]) => x.attivo).map(([k, x]) => {
                const c = cumulato(x, 3, o.assessment.crescita);
                const max = Math.max(...c.map((y) => y.ricavo), 1);
                return (
                  <div key={k} style={{ marginBottom: 24 }}>
                    <h3 className="alt-card__title" style={{ marginBottom: 8 }}>{t(`approccio.${k}` as Chiave)}</h3>
                    <svg viewBox="0 0 300 120" width="100%" height="140" role="img" aria-label={t('re.margineCum')}>
                      {c.map((y, i) => (
                        <g key={y.anno} transform={`translate(${30 + i * 90},0)`}>
                          <rect x="0" y={110 - (y.ricavo / max) * 100} width="28" height={(y.ricavo / max) * 100} fill="var(--accent-azure)" />
                          <rect x="32" y={110 - (y.costo / max) * 100} width="28" height={(y.costo / max) * 100} fill="var(--line-strong)" />
                        </g>
                      ))}
                    </svg>
                    <table className="alt-table">
                      <thead><tr><th>{t('re.anno')}</th><th className="is-num">{t('re.ricavo')}</th><th className="is-num">{t('re.costoCum')}</th><th className="is-num">{t('re.margineCum')}</th></tr></thead>
                      <tbody>{c.map((y) => (
                        <tr key={y.anno}><td>{y.anno}</td><td className="is-num">{euro(y.ricavo)}</td><td className="is-num">{euro(y.costo)}</td><td className="is-num">{euro(y.margine)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                );
              })}
            </div></div>
          )}
          {fase === 'resoconto' && s === 2 && (
            <div className="alt-card"><div className="alt-card__body">
              {([['saas', r.saas], ['on_premise', r.onPremise]] as const).filter(([, x]) => x.attivo).map(([k, x]) => (
                <div key={k} style={{ marginBottom: 24 }}>
                  <h3 className="alt-card__title" style={{ marginBottom: 8 }}>{t(`approccio.${k}` as Chiave)}</h3>
                  <TabellaOrdinabile
                    colonne={[{ nome: t('st.voce') }, { nome: t('st.giornate'), num: true }, { nome: t('pr.costo'), num: true }, { nome: t('pr.prezzo'), num: true }]}
                    righe={[...x.setup.righe, ...x.setup.quote, ...x.customizzazione.righe, ...x.customizzazione.quote].map((y, i) => ({
                      key: `${y.id}-${i}`, celle: [{ v: y.nome }, { v: y.gg, html: numero(y.gg) }, { v: y.costo, html: euro(y.costo) }, { v: y.prezzo, html: euro(y.prezzo) }]
                    }))}
                  />
                  <TabellaOrdinabile
                    colonne={[{ nome: t('re.ricorrenti') }, { nome: t('pr.costo'), num: true }]}
                    righe={x.ricorrenti.map((y) => ({ key: y.id, celle: [{ v: y.nome }, { v: y.costo, html: euro(y.costo) }] }))}
                    totale={[{ v: t('comune.totale') }, { v: x.costoRicorrente, html: euro(x.costoRicorrente) }]}
                  />
                </div>
              ))}
            </div></div>
          )}
        </main>
        <aside className="rail" aria-label="Statistiche">
          <div className="rail__card">
            <p className="rail__h">{t('re.licenza')}</p>
            {r.saas.attivo && <div className="rail__stat"><span>SaaS</span><b>{euro(r.saas.licenza.totale)}</b></div>}
            {r.onPremise.attivo && <div className="rail__stat"><span>On-premise</span><b>{euro(r.onPremise.licenza.totale)}</b></div>}
          </div>
          <div className="rail__card">
            <p className="rail__h">{t('re.margine')}</p>
            {r.saas.attivo && <div className="rail__stat"><span>SaaS</span><b>{perc(r.saas.annuo.marginePct)}</b></div>}
            {r.onPremise.attivo && <div className="rail__stat"><span>On-premise</span><b>{perc(r.onPremise.annuo.marginePct)}</b></div>}
          </div>
          {r.saas.attivo && (
            <div className="rail__card">
              <p className="rail__h">{t('leva.canoneSaas')}</p>
              <div className="rail__stat"><span>{t('pr.soglia', { v: '' })}</span><b>{euro(r.saas.soglia)}</b></div>
            </div>
          )}
        </aside>
      </div>
      <Footer o={o} r={r} solaLettura={solaLettura}
        onCanone={(v) => upd((x) => { x.leve.canoneSaas = v; }, 'leve.canoneSaas')}
        onSoftware={(v) => upd((x) => { x.leve.softwareOnPremise = v; }, 'leve.softwareOnPremise')}
        onAi={(m) => upd((x) => { x.leve.aiOnPremise = m; }, 'leve.aiOnPremise')} />
      <Toast toast={toast} />
    </>
  );
}
