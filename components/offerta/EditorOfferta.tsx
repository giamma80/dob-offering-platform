'use client';

import { scorriA } from '@/lib/ui/scorri';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  FASI, avanzamento, bloccanti, calcola, coperturaSistema, fattoreImpianto, moduliAttivi, moduloBloccante, sistemi, vociCustomizzazione,
  type Complessita, type Config, type Fase, type FiguraId, type Offerta, type RigaGg, type Sistema, type StatoValore
} from '@/lib/engine';
import { salvaOfferta } from '@/lib/azioni';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';
import { euro, numero, perc } from '@/lib/ui/formato';
import { CampoNumero, StatoPulsanti } from '@/components/CampoNumero';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { Toast, useToast } from '@/components/Toast';
import { Icona } from '@/components/Icona';
import { Footer } from './Footer';
import { Timeline } from './Timeline';
import { DettaglioCosti, RailDettaglio, RailSintesi, RailSostenibilita, Sintesi, Sostenibilita } from './Resoconto';

type Stati = Record<string, StatoValore>;
type Sezione = { id: string; k: Chiave; ico: string };

/* Sezioni di ogni fase, nell'ordine del mockup. Le fasi 1–4 le mostrano tutte in colonna e la
   sottonavigazione scorre alla card; il Resoconto ha tre sottopagine (Sintesi, Sostenibilità, Dettaglio). */
const SEZIONI: Record<Fase, Sezione[]> = {
  assessment: [
    { id: 'a-cli', k: 'as.cliente', ico: 'cliente' },
    { id: 'a-mod', k: 'as.moduli', ico: 'catalogo' },
    { id: 'a-vol', k: 'as.volumi', ico: 'volumi' },
    { id: 'a-sis', k: 'as.sistemi', ico: 'sistemi' },
    { id: 'a-vin', k: 'as.vincoli', ico: 'vincoli' }
  ],
  soluzione: [
    { id: 's-app', k: 'so.approccio', ico: 'approccio' },
    { id: 's-sis', k: 'so.coperturaTit', ico: 'sistemi' },
    { id: 's-con', k: 'so.connettori', ico: 'sistemi' },
    { id: 's-int', k: 'so.integrazioni', ico: 'integraz' },
    { id: 's-ci', k: 'so.cicd', ico: 'cicd' },
    { id: 's-ai', k: 'so.ai', ico: 'ai' },
    { id: 's-man', k: 'so.manutenzione', ico: 'manut' }
  ],
  stima: [
    { id: 'st-base', k: 'st.base', ico: 'stima' },
    { id: 'st-cust', k: 'st.custom', ico: 'integraz' },
    { id: 'st-op', k: 'st.messa', ico: 'cicd' },
    { id: 'st-q', k: 'st.quote', ico: 'quote' }
  ],
  prezzo: [
    { id: 'p-fig', k: 'pr.figure', ico: 'figure' },
    { id: 'p-can', k: 'pr.canoni', ico: 'canoni' },
    { id: 'p-sca', k: 'pr.scaglioni', ico: 'scaglioni' },
    { id: 'p-vin', k: 'pr.vincoli', ico: 'vincoli' },
    { id: 'p-min', k: 'pr.minimo', ico: 'minimo' }
  ],
  resoconto: [
    { id: 'r-sin', k: 're.sintesi', ico: 'sintesi' },
    { id: 'r-sos', k: 're.sostenibilita', ico: 'sostenib' },
    { id: 'r-det', k: 're.dettaglio', ico: 'costi' }
  ]
};

/** Barra orizzontale spezzata (componente "bar" del mockup). */
function Barra({ parti, etichetta }: { parti: { v: number; cls: string; titolo: string }[]; etichetta: string }) {
  const tot = parti.reduce((a, p) => a + Math.max(0, p.v), 0) || 1;
  return (
    <div className="bar bar--xs" role="img" aria-label={etichetta} style={{ marginTop: 12 }}>
      {parti.filter((p) => p.v > 0).map((p) => (
        <span key={p.titolo} className={p.cls} style={{ flex: p.v / tot }} title={`${p.titolo}: ${euro(p.v)}`} />
      ))}
    </div>
  );
}


/** Card del mockup: titolo con icona, aside a destra. Definita fuori dall'editor perché un componente
   creato a ogni render verrebbe rimontato e i campi perderebbero il focus a ogni carattere. */
function Card({ id, titolo, ico, aside, bloccata, children }: {
  id: string; titolo: string; ico: string; aside?: React.ReactNode; bloccata?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`alt-card${bloccata ? ' is-bloccato' : ''}`} id={id}>
      <div className="alt-card__head">
        <h2 className="alt-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icona nome={ico} />{titolo}</h2>
        {aside && <span style={{ marginLeft: 'auto' }}>{aside}</span>}
      </div>
      <div className="alt-card__body">{children}</div>
    </div>
  );
}

function RigaGiornate({ v, onGg, onNome, onFigura, onRimuovi, stato, onStato, figure, solaLettura, t, importo, nota, origine }: {
  importo?: number; nota?: string; origine?: string;
  v: RigaGg; onGg: (g: number) => void; onNome?: (n: string) => void; onFigura?: (f: FiguraId) => void; onRimuovi?: () => void;
  stato?: StatoValore; onStato?: (s: StatoValore) => void; figure: Config['figure']; solaLettura: boolean; t: ReturnType<typeof useT>;
}) {
  return (
    <tr>
      <td>
        {onNome ? (
          <span className="alt-inputwrap" style={{ maxWidth: 280 }}>
            <input className="alt-input" value={v.nome} aria-label={t('st.voce')} disabled={solaLettura}
              onChange={(e) => onNome(e.target.value)} />
          </span>
        ) : v.nome}
        {origine && <span className="alt-badge alt-badge--neutro origine">{origine}</span>}
        {stato && onStato && <StatoPulsanti stato={stato} onStato={onStato} />}
      </td>
      <td className="is-num"><CampoNumero compatto etichetta={v.nome} valore={v.gg} min={0} stato={stato} onChange={onGg} /></td>
      <td>
        {onFigura ? (
          <span className="alt-inputwrap" style={{ maxWidth: 220 }}>
            <select className="alt-input" value={v.figura} aria-label={t('st.figura')} disabled={solaLettura}
              onChange={(e) => onFigura(e.target.value as FiguraId)}>
              {figure.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </span>
        ) : (figure.find((f) => f.id === v.figura)?.nome ?? v.figura)}
      </td>
      {importo !== undefined && <td className="is-num">{euro(importo)}{nota && <div className="muted" style={{ fontSize: 11 }}>{nota}</div>}</td>}
      <td style={{ width: 40 }}>
        {onRimuovi && !solaLettura && (
          <button type="button" className="chip__x" aria-label={t('comune.rimuovi')} title={t('comune.rimuovi')} onClick={onRimuovi}>×</button>
        )}
      </td>
    </tr>
  );
}

function RigaPiu({ testo, onClick, colonne = 4, solaLettura }: { testo: string; onClick: () => void; colonne?: number; solaLettura: boolean }) {
  if (solaLettura) return null;
  return (
    <tr className="is-piu"><td colSpan={colonne}>
      <button type="button" className="btn-piu" onClick={onClick}>{testo}</button>
    </td></tr>
  );
}

export function EditorOfferta({ id, fase, cfg, iniziale, statiIniziali, solaLettura }: {
  id: string; fase: Fase; cfg: Config; iniziale: Offerta; statiIniziali: Stati; solaLettura: boolean;
}) {
  const t = useT();
  const [o, setO] = useState<Offerta>(iniziale);
  const [stati, setStati] = useState<Stati>(statiIniziali);
  const [attiva, setAttiva] = useState(SEZIONI[fase][0].id);
  const [, start] = useTransition();
  const { toast, mostra } = useToast();
  const r = useMemo(() => calcola(cfg, o), [cfg, o]);
  const primo = useRef(true);
  const centro = useRef<HTMLElement>(null);

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

  /* sottonavigazione che segue lo scorrimento della colonna centrale */
  useEffect(() => {
    if (fase === 'resoconto' || !centro.current) return;
    const obs = new IntersectionObserver((es) => {
      const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setAttiva(v.target.id);
    }, { root: centro.current, rootMargin: '0px 0px -60% 0px' });
    SEZIONI[fase].forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [fase]);

  const upd = (f: (x: Offerta) => void, campo?: string) => {
    if (solaLettura) return;
    setO((p) => { const x = structuredClone(p); f(x); return x; });
    if (campo && (stati[campo] ?? 'assunto') === 'assunto') setStati((s) => ({ ...s, [campo]: 'dichiarato' }));
  };
  const st = (campo: string) => stati[campo] ?? 'assunto';
  const setSt = (campo: string) => (v: StatoValore) => !solaLettura && setStati((s) => ({ ...s, [campo]: v }));
  const onp = o.approccio !== 'saas';
  const saas = o.approccio !== 'on_premise';
  const pct = Object.fromEntries(FASI.map((f) => [f.id, avanzamento(o, stati, f.id)])) as Record<Fase, number>;
  const nuovoId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

  const cp = (id: string) => { const x = SEZIONI[fase].find((y) => y.id === id)!; return { id, titolo: t(x.k), ico: x.ico }; };
  const comuni = { figure: cfg.figure, solaLettura, t };
  const offSol = o.soluzione.sezioniOff ?? [];
  const interr = (k: 'connettori' | 'integrazioni' | 'cicd', extra?: React.ReactNode) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {extra}
      <label className="alt-switch" title={t('so.abilita')}>
        <input type="checkbox" checked={!offSol.includes(k)} disabled={solaLettura} aria-label={t('so.abilita')}
          onChange={(e) => upd((x) => {
            const cur = x.soluzione.sezioniOff ?? [];
            x.soluzione.sezioniOff = e.target.checked ? cur.filter((y) => y !== k) : [...cur, k];
          })} />
        <span className="alt-switch__box" aria-hidden="true" />
      </label>
    </span>
  );
  const sis = sistemi(o);
  const is = cfg.integrazioneSistema ?? { bassa: 5, media: 10, alta: 20, figura: 'dev' as const };
  const ggSistema = (x: Sistema) => o.stima.gg[x.id] ?? is[x.complessita] ?? is.media;
  const updSis = (f: (y: Sistema[]) => void, campo = 'assessment.sistemi') => upd((x) => {
    const y = sistemi(x); f(y); x.assessment.sistemi = y;
  }, campo);
  const fImp = fattoreImpianto(cfg, o);
  const modAtt = moduliAttivi(cfg, o);
  const sezioni = SEZIONI[fase];
  const propsRes = { cfg, o, r, definito: pct.resoconto, critici: bloccanti(o, stati) };
  const sub = fase === 'resoconto' ? attiva : null;
  const vociCust = vociCustomizzazione(cfg, o).filter((v) => !o.stima.base.some((b) => b.id === v.id));
  const origine = (x?: string) => {
    if (!x) return undefined;
    const [k, ...resto] = x.split(':'); const v = resto.join(':');
    return k === 'sistema' ? t('st.daSistema', { v }) : k === 'copre' ? t('so.copreSistema', { v }) : k === 'modulo' ? t('so.daModulo', { v })
      : k === 'vincolo' ? t('so.daVincolo', { v }) : k === 'soluzione' ? t('so.vocecustom') : t('st.daCatalogo');
  };
  const dovCustom = (idv: string) =>
    o.soluzione.connettoriCustom.some((c) => c.id === idv) ? 'connettoriCustom' as const
      : o.soluzione.integrazioniCustom.some((c) => c.id === idv) ? 'integrazioniCustom' as const : null;

  return (
    <>
      <nav className="alt-tabs" style={{ background: 'var(--surface-card)', padding: '0 24px', borderBottom: '1px solid var(--line-soft)', flex: '0 0 auto' }}>
        <Link className="alt-tab" href={`/offerta/${id}/assessment`} aria-current="page">{t('tab.dettaglio')}</Link>
        <Link className="alt-tab" href={`/offerta/${id}/specchietto`}>{t('tab.specchietto')}</Link>
      </nav>
      <Timeline id={id} corrente={fase} pct={pct} />
      <div className="shell">
        <aside className="subnav" aria-label={t(`fase.${fase}` as Chiave)}>
          <p className="subnav__title">{t(`fase.${fase}` as Chiave)}</p>
          {sezioni.map((s) => (
            <a key={s.id} className="subnav__a" href={`#${s.id}`} aria-current={attiva === s.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setAttiva(s.id);
                if (fase !== 'resoconto') scorriA(s.id);
              }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icona nome={s.ico} />{t(s.k)}</span>
            </a>
          ))}
        </aside>

        <main className="content" ref={centro}>
          <h1 className="ttl">{t(fase === 'resoconto' ? sezioni.find((s) => s.id === sub)!.k : `fase.${fase}` as Chiave)}</h1>

          {/* ================================================= 1 ASSESSMENT */}
          {fase === 'assessment' && (<>
            <Card {...cp("a-cli")}>
              <div className="griglia-campi">
                <label className="campo"><span>{t('as.ragioneSociale')}</span>
                  <span className="alt-inputwrap"><input className="alt-input" value={o.cliente} disabled={solaLettura}
                    onChange={(e) => upd((x) => { x.cliente = e.target.value; })} /></span></label>
                <label className="campo"><span>{t('as.settore')}</span>
                  <span className="alt-inputwrap"><input className="alt-input" value={o.assessment.settore ?? ''} disabled={solaLettura}
                    onChange={(e) => upd((x) => { x.assessment.settore = e.target.value; })} /></span></label>
                <label className="campo"><span>{t('as.referente')}</span>
                  <span className="alt-inputwrap"><input className="alt-input" value={o.assessment.referente ?? ''} disabled={solaLettura}
                    onChange={(e) => upd((x) => { x.assessment.referente = e.target.value; })} /></span></label>
              </div>
            </Card>
            <Card {...cp("a-mod")} aside={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <StatoPulsanti stato={st('assessment.moduli')} onStato={setSt('assessment.moduli')} />
                <label className="alt-switch">
                  <input type="checkbox" checked={!!o.assessment.light} disabled={solaLettura}
                    onChange={(e) => upd((x) => {
                      x.assessment.light = e.target.checked;
                      if (!x.assessment.moduli) x.assessment.moduli = (cfg.moduli ?? []).map((m) => m.id);
                    }, 'assessment.moduli')} />
                  <span className="alt-switch__box" aria-hidden="true" /><span>{t('as.light')}</span>
                </label>
              </span>}>
              <TabellaOrdinabile
                colonne={[{ nome: t('as.incluso') }, { nome: t('as.modulo') }, { nome: t('par.peso'), num: true }, { nome: t('as.effetto') }]}
                righe={(cfg.moduli ?? []).map((m) => {
                  const on = modAtt.includes(m.id);
                  const op = m.opzioneClassi, sc = o.assessment.opzioniModuli?.[m.id] ?? { attiva: false, classi: 1 };
                  const collegati = [
                    ...(m.connettori ?? []).map((id) => cfg.catalogo.connettori.find((c) => c.id === id)?.nome ?? id),
                    ...(m.integrazioni ?? []).map((id) => cfg.catalogo.integrazioni.find((c) => c.id === id)?.nome ?? id)
                  ];
                  return {
                    key: m.id, className: on ? undefined : 'is-off',
                    celle: [
                      { v: on ? 1 : 0, html: (
                        <label className="alt-switch"><input type="checkbox" checked={on} aria-label={m.nome} disabled={solaLettura || !o.assessment.light}
                          onChange={(e) => upd((x) => {
                            const cur = x.assessment.moduli ?? (cfg.moduli ?? []).map((y) => y.id);
                            x.assessment.moduli = e.target.checked ? [...cur, m.id] : cur.filter((y) => y !== m.id);
                          }, 'assessment.moduli')} /><span className="alt-switch__box" aria-hidden="true" /></label>) },
                      { v: m.nome, html: <strong>{m.nome}</strong> },
                      { v: m.peso, html: perc(m.peso / 100) },
                      { v: collegati.join(), html: op ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <label className="alt-switch alt-switch--sm"><input type="checkbox" checked={on && sc.attiva} disabled={solaLettura || !on}
                            onChange={(e) => upd((x) => { x.assessment.opzioniModuli = { ...(x.assessment.opzioniModuli ?? {}), [m.id]: { ...sc, attiva: e.target.checked } }; }, 'assessment.moduli')} />
                            <span className="alt-switch__box" aria-hidden="true" /><span>{op.nome}</span></label>
                          {on && sc.attiva && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <CampoNumero compatto etichetta={t('as.classi')} valore={sc.classi} min={0} suffisso={t('as.classiBreve')}
                                onChange={(v) => upd((x) => { x.assessment.opzioniModuli = { ...(x.assessment.opzioniModuli ?? {}), [m.id]: { ...sc, classi: v } }; }, 'assessment.moduli')} />
                              <span className="muted" style={{ fontSize: 12 }}>{t('as.classiFormula', { i: op.impianto, c: op.perClasse, g: numero(op.impianto + op.perClasse * sc.classi) })}</span>
                            </span>
                          )}
                        </span>
                      ) : <span className="muted">{collegati.length ? t('as.moduloCollegati', { v: collegati.join(', ') }) : '—'}</span> }
                    ]
                  };
                })}
              />
              <div className="moduli-tot">
                <span>{t('as.impianto')}</span>
                <div className="bar bar--xs" style={{ flex: 1 }}><span className="s3" style={{ flex: fImp }} /><span style={{ flex: 1 - fImp }} /></div>
                <b>{perc(fImp)}</b>
              </div>
            </Card>
            <Card {...cp("a-vol")}>
              <div className="griglia-campi">
                <CampoNumero etichetta={t('as.volume')} valore={o.assessment.volumeAnnuo} min={0}
                  stato={st('assessment.volumeAnnuo')} onStato={setSt('assessment.volumeAnnuo')}
                  onChange={(v) => upd((x) => { x.assessment.volumeAnnuo = v; }, 'assessment.volumeAnnuo')} />
                <CampoNumero etichetta={t('as.crescita')} valore={o.assessment.crescita * 100} suffisso="%" min={0}
                  stato={st('assessment.crescita')} onStato={setSt('assessment.crescita')}
                  onChange={(v) => upd((x) => { x.assessment.crescita = v / 100; }, 'assessment.crescita')} />
                <CampoNumero etichetta={t('as.documenti')} valore={o.assessment.documentiPerPratica} min={0}
                  stato={st('assessment.documentiPerPratica')} onStato={setSt('assessment.documentiPerPratica')}
                  onChange={(v) => upd((x) => { x.assessment.documentiPerPratica = v; }, 'assessment.documentiPerPratica')} />
              </div>
            </Card>
            <Card {...cp("a-sis")}>
              <TabellaOrdinabile
                colonne={[{ nome: t('as.sistema') }, { nome: t('as.complessita') }, { nome: t('as.integrazioneGg'), num: true }, { nome: '' }]}
                righe={sis.map((x, i) => ({
                  key: x.id,
                  celle: [
                    { v: x.nome, html: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className="alt-inputwrap" style={{ maxWidth: 280 }}>
                          <input className="alt-input" value={x.nome} aria-label={t('as.sistema')} disabled={solaLettura}
                            onChange={(e) => updSis((y) => { y[i].nome = e.target.value; })} />
                        </span>
                        <StatoPulsanti stato={st(`assessment.sistemi.${x.id}`)} onStato={setSt(`assessment.sistemi.${x.id}`)} />
                      </span>) },
                    { v: ['bassa', 'media', 'alta'].indexOf(x.complessita), html: (
                      <span className="alt-inputwrap" style={{ maxWidth: 160 }}>
                        <select className="alt-input" value={x.complessita} aria-label={t('as.complessita')} disabled={solaLettura}
                          onChange={(e) => updSis((y) => { y[i].complessita = e.target.value as Complessita; })}>
                          {(['bassa', 'media', 'alta'] as const).map((c) => <option key={c} value={c}>{t(`as.compl.${c}` as Chiave)}</option>)}
                        </select>
                      </span>) },
                    { v: ggSistema(x), html: x.copertoDa ? <span className="muted">{t('as.copertoDa', { v: cfg.catalogo.connettori.find((c) => c.id === x.copertoDa)?.nome ?? '' })}</span> : `${numero(ggSistema(x))} gg` },
                    { v: '', html: !solaLettura && <button type="button" className="chip__x" aria-label={t('comune.rimuovi')} title={t('comune.rimuovi')}
                      onClick={() => updSis((y) => { y.splice(i, 1); })}>×</button> }
                  ]
                }))}
              />
              {!solaLettura && <button type="button" className="btn-piu" style={{ marginTop: 10 }}
                onClick={() => updSis((y) => { y.push({ id: nuovoId('sis'), nome: t('as.nuovoSistema'), complessita: 'media' }); })}>{t('as.aggiungiSistema')}</button>}
            </Card>
            <Card {...cp("a-vin")} aside={<StatoPulsanti stato={st('vincoli')} onStato={setSt('vincoli')} />}>
              <TabellaOrdinabile
                colonne={[{ nome: t('as.attivo') }, { nome: t('as.vincolo') }, { nome: t('as.effetto') }]}
                righe={cfg.vincoli.map((v) => ({
                  key: v.id,
                  className: o.vincoli[v.id] ? undefined : 'is-off',
                  celle: [
                    { v: o.vincoli[v.id] ? 1 : 0, html: (
                      <label className="alt-switch"><input type="checkbox" checked={!!o.vincoli[v.id]} aria-label={v.nome} disabled={solaLettura}
                        onChange={(e) => upd((x) => { x.vincoli[v.id] = e.target.checked; }, 'vincoli')} />
                        <span className="alt-switch__box" aria-hidden="true" /></label>) },
                    { v: v.nome, html: <strong>{v.nome}</strong> },
                    { v: v.effetto.tipo, html: <span className="muted">{effetto(v, t)}</span> }
                  ]
                }))}
              />
            </Card>
          </>)}

          {/* ================================================= 2 SOLUZIONE */}
          {fase === 'soluzione' && (<>
            <Card {...cp("s-app")} aside={<StatoPulsanti stato={st('approccio')} onStato={setSt('approccio')} />}>
              <div className="scelta">
                {(['saas', 'on_premise', 'entrambi'] as const).map((a) => (
                  <label key={a} className={`scelta__c${o.approccio === a ? ' on' : ''}`}>
                    <input type="radio" name="approccio" checked={o.approccio === a} disabled={solaLettura}
                      onChange={() => upd((x) => { x.approccio = a; }, 'approccio')} />
                    <h3>{t(`approccio.${a}` as Chiave)}</h3>
                    <span className="v">{a === 'saas' ? euro(r.saas.primoAnno.prezzo) : a === 'on_premise' ? euro(r.onPremise.primoAnno.prezzo) : '—'}</span>
                  </label>
                ))}
              </div>
            </Card>
            <Card {...cp("s-sis")}>
              {sis.length === 0 ? <p className="vuoto">{t('so.nessunSistema')}</p> : (
                <TabellaOrdinabile
                  colonne={[{ nome: t('as.sistema') }, { nome: t('as.complessita') }, { nome: t('so.copertura') }, { nome: t('st.giornate'), num: true }]}
                  righe={sis.map((x, i) => {
                    const cop = coperturaSistema(cfg, o, x);
                    const con = cop ? cfg.catalogo.connettori.find((c) => c.id === cop) : null;
                    return {
                      key: x.id,
                      celle: [
                        { v: x.nome, html: <strong>{x.nome}</strong> },
                        { v: x.complessita, html: t(`as.compl.${x.complessita}` as Chiave) },
                        { v: cop ?? '', html: (
                          <span className="alt-inputwrap" style={{ maxWidth: 300 }}>
                            <select className="alt-input" value={x.copertoDa ?? ''} aria-label={t('so.copertura')} disabled={solaLettura}
                              onChange={(e) => updSis((y) => { y[i].copertoDa = e.target.value || null; }, 'soluzione.sistemi')}>
                              <option value="">{t('so.integrazioneDedicata')}</option>
                              {cfg.catalogo.connettori.filter((c) => !moduloBloccante(cfg, o, 'connettori', c.id)).map((c) =>
                                <option key={c.id} value={c.id}>{t('so.connettoreX', { v: c.nome })}</option>)}
                            </select>
                          </span>) },
                        { v: con ? (o.stima.gg[con.id] ?? con.gg) : ggSistema(x), html: `${numero(con ? (o.stima.gg[con.id] ?? con.gg) : ggSistema(x))} gg` }
                      ]
                    };
                  })}
                />
              )}
            </Card>
            {(['connettori', 'integrazioni'] as const).map((k) => {
              const kc = k === 'connettori' ? 'connettoriCustom' as const : 'integrazioniCustom' as const;
              const coperti = new Map(sis.map((x) => [coperturaSistema(cfg, o, x), x.nome] as const).filter(([c]) => !!c));
              return (
                <Card key={k} {...cp(k === 'connettori' ? 's-con' : 's-int')}
                  aside={interr(k, <StatoPulsanti stato={st(`soluzione.${k}`)} onStato={setSt(`soluzione.${k}`)} />)}>
                  <div className={offSol.includes(k) ? 'is-off' : undefined} inert={offSol.includes(k) ? true : undefined}>
                    <TabellaOrdinabile
                      colonne={[{ nome: t('as.incluso') }, { nome: t('st.voce') }, { nome: t('st.giornate'), num: true }, { nome: t('so.collegamento') }, { nome: '' }]}
                      righe={[
                        ...cfg.catalogo[k].map((c) => {
                          const vinc = 'vincolo' in c && c.vincolo ? c.vincolo : null;
                          const modB = moduloBloccante(cfg, o, k, c.id);
                          const bloccato = (!!vinc && !o.vincoli[vinc]) || !!modB;
                          const copre = k === 'connettori' ? coperti.get(c.id) : undefined;
                          const on = (o.soluzione[k].includes(c.id) || !!copre) && !bloccato;
                          const modOn = (cfg.moduli ?? []).find((m) => modAtt.includes(m.id) && (m[k] ?? []).includes(c.id));
                          return {
                            key: c.id, className: bloccato ? 'is-bloccato' : on ? undefined : 'is-off',
                            celle: [
                              { v: on ? 1 : 0, html: (
                                <label className="alt-switch" title={copre ? t('as.copertoDa', { v: copre }) : undefined}>
                                  <input type="checkbox" checked={on} aria-label={c.nome} disabled={bloccato || solaLettura || !!copre}
                                    onChange={(e) => upd((x) => {
                                      x.soluzione[k] = e.target.checked ? [...x.soluzione[k], c.id] : x.soluzione[k].filter((i) => i !== c.id);
                                    }, `soluzione.${k}`)} /><span className="alt-switch__box" aria-hidden="true" /></label>) },
                              { v: c.nome, html: <strong>{c.nome}</strong> },
                              { v: o.stima.gg[c.id] ?? c.gg, html: `${numero(o.stima.gg[c.id] ?? c.gg)} gg` },
                              { v: '', html: <span className="muted">{
                                modB ? t('so.bloccatoModulo', { v: modB.nome })
                                  : vinc && !o.vincoli[vinc] ? t('so.bloccatoDa', { v: cfg.vincoli.find((v) => v.id === vinc)?.nome ?? '' })
                                  : copre ? t('so.copreSistema', { v: copre })
                                  : modOn ? t('so.daModulo', { v: modOn.nome })
                                  : vinc ? t('so.daVincolo', { v: cfg.vincoli.find((v) => v.id === vinc)?.nome ?? '' }) : '—'}</span> },
                              { v: '', html: null }
                            ]
                          };
                        }),
                        ...o.soluzione[kc].map((c, i) => ({
                          key: c.id,
                          celle: [
                            { v: 1, html: <span className="muted" aria-hidden="true">✓</span> },
                            { v: c.nome, html: (
                              <span className="alt-inputwrap" style={{ maxWidth: 280 }}><input className="alt-input" value={c.nome} aria-label={t('so.nuovaVoce')} disabled={solaLettura}
                                onChange={(e) => upd((x) => { x.soluzione[kc][i].nome = e.target.value; }, `soluzione.${k}`)} /></span>) },
                            { v: c.gg, html: <CampoNumero compatto etichetta={c.nome} valore={c.gg} min={0} suffisso="gg"
                              onChange={(g) => upd((x) => { x.soluzione[kc][i].gg = g; }, `soluzione.${k}`)} /> },
                            { v: '', html: <span className="muted">{t('so.vocecustom')}</span> },
                            { v: '', html: !solaLettura && <button type="button" className="chip__x" aria-label={t('comune.rimuovi')} title={t('comune.rimuovi')}
                              onClick={() => upd((x) => { x.soluzione[kc].splice(i, 1); }, `soluzione.${k}`)}>×</button> }
                          ]
                        }))
                      ]}
                    />
                    {!solaLettura && (
                      <button type="button" className="btn-piu" style={{ marginTop: 10 }} onClick={() => upd((x) => {
                        x.soluzione[kc].push({ id: nuovoId(k), nome: t(k === 'connettori' ? 'so.nuovoConnettore' : 'so.nuovaIntegrazione'), gg: 5, figura: 'dev' });
                      }, `soluzione.${k}`)}>{t(k === 'connettori' ? 'so.aggiungiConnettore' : 'so.aggiungiIntegrazione')}</button>
                    )}
                  </div>
                </Card>
              );
            })}
            <Card {...cp("s-ci")} bloccata={!onp} aside={onp ? interr('cicd', <StatoPulsanti stato={st('soluzione.cicd')} onStato={setSt('soluzione.cicd')} />) : undefined}>
              <div className={`scelta${offSol.includes('cicd') ? ' is-off' : ''}`} inert={offSol.includes('cicd') ? true : undefined}>
                {cfg.catalogo.cicd.map((c) => (
                  <label key={c.id} className={`scelta__c${o.soluzione.cicd === c.id ? ' on' : ''}`}>
                    <input type="radio" name="cicd" checked={o.soluzione.cicd === c.id} disabled={!onp || solaLettura}
                      onChange={() => upd((x) => { x.soluzione.cicd = c.id; }, 'soluzione.cicd')} />
                    <h3>{c.nome}</h3><span className="v">{o.stima.gg[c.id] ?? c.gg} gg</span>
                  </label>
                ))}
              </div>
              <label className={`opt${o.soluzione.passaggioConsegne ? ' opt--on' : ''}`} style={{ marginTop: 12 }}>
                <input type="checkbox" checked={o.soluzione.passaggioConsegne} disabled={!onp || solaLettura}
                  onChange={(e) => upd((x) => { x.soluzione.passaggioConsegne = e.target.checked; }, 'soluzione.cicd')} />
                <span className="opt__box" aria-hidden="true" />
                <span className="opt__t">{t('so.consegne')}<span className="opt__sub">{cfg.catalogo.passaggioConsegne.gg} gg</span></span>
              </label>
            </Card>
            <Card {...cp("s-ai")} bloccata={!onp} aside={onp ? <StatoPulsanti stato={st('leve.aiOnPremise')} onStato={setSt('leve.aiOnPremise')} /> : undefined}>
              <div className="scelta">
                {(['incluso', 'proxy', 'cliente'] as const).map((m) => (
                  <label key={m} className={`scelta__c${o.leve.aiOnPremise === m ? ' on' : ''}`}
                    title={t(`so.ai.${m}.tip` as Chiave)}>
                    <input type="radio" name="ai" checked={o.leve.aiOnPremise === m} disabled={!onp || solaLettura}
                      onChange={() => upd((x) => { x.leve.aiOnPremise = m; }, 'leve.aiOnPremise')} />
                    <h3>{t(`so.ai.${m}` as Chiave)}</h3>
                    <span className="v">{m === 'cliente' ? euro(0) : m === 'proxy' ? `+${euro(r.aiAnno / (1 - o.prezzo.margineVenduto))}` : euro(r.aiAnno)}</span>
                  </label>
                ))}
              </div>
            </Card>
            <Card {...cp("s-man")} bloccata={!onp} aside={onp ? (
              <label className="alt-switch"><input type="checkbox" checked={o.leve.manutenzioneOnPremise.attiva} disabled={solaLettura}
                aria-label={t('so.manutenzione')}
                onChange={(e) => upd((x) => { x.leve.manutenzioneOnPremise.attiva = e.target.checked; }, 'leve.manutenzioneOnPremise')} />
                <span className="alt-switch__box" aria-hidden="true" /></label>) : undefined}>
              <div className={`griglia-campi${o.leve.manutenzioneOnPremise.attiva ? '' : ' is-off'}`}>
                <CampoNumero etichetta={t('st.giornate')} valore={o.leve.manutenzioneOnPremise.gg} min={0} suffisso="gg"
                  stato={st('leve.manutenzioneOnPremise')} onStato={setSt('leve.manutenzioneOnPremise')}
                  onChange={(v) => upd((x) => { x.leve.manutenzioneOnPremise.gg = v; }, 'leve.manutenzioneOnPremise')} />
                <label className="campo"><span>{t('st.figura')}</span>
                  <span className="alt-inputwrap"><select className="alt-input" value={o.leve.manutenzioneOnPremise.figura} disabled={solaLettura || !onp}
                    onChange={(e) => upd((x) => { x.leve.manutenzioneOnPremise.figura = e.target.value as FiguraId; }, 'leve.manutenzioneOnPremise')}>
                    {cfg.figure.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select></span></label>
                <div className="campo"><span>{t('pr.prezzo')}</span><b className="valore">{euro(r.onPremise.licenza.manutenzione)}</b></div>
              </div>
            </Card>
          </>)}

          {/* ================================================= 3 STIMA */}
          {fase === 'stima' && (<>
            <Card {...cp("st-base")}>
              <table className="alt-table">
                <thead><tr><th>{t('st.voce')}</th><th className="is-num">{t('st.giornate')}</th><th>{t('st.figura')}</th><th className="is-num">{t('st.importo')}</th><th /></tr></thead>
                <tbody>
                  {fImp < 1 && (
                    <tr className="is-sub"><td colSpan={5}>{t('st.baseLight', { p: perc(fImp), g: numero(Math.round(o.stima.base.reduce((a, b) => a + b.gg, 0) * fImp)) })}</td></tr>
                  )}
                  {o.stima.base.map((b, i) => {
                    const daCatalogo = cfg.catalogo.base.some((c) => c.id === b.id);
                    return (
                      <RigaGiornate key={b.id} v={b} {...comuni} stato={st(`stima.base.${b.id}`)} onStato={setSt(`stima.base.${b.id}`)}
                        importo={b.gg * fImp * r.tariffe[b.figura]} nota={fImp < 1 ? t('st.ggEffettive', { g: numero(Math.round(b.gg * fImp * 10) / 10) }) : undefined}
                        onGg={(g) => upd((x) => { x.stima.base[i].gg = g; }, `stima.base.${b.id}`)}
                        onNome={daCatalogo ? undefined : (n) => upd((x) => { x.stima.base[i].nome = n; })}
                        onFigura={daCatalogo ? undefined : (f) => upd((x) => { x.stima.base[i].figura = f; })}
                        onRimuovi={() => upd((x) => { x.stima.base.splice(i, 1); })} />
                    );
                  })}
                  <RigaPiu colonne={5} solaLettura={solaLettura} testo={t('st.aggiungiVoce')} onClick={() => upd((x) => {
                    x.stima.base.push({ id: nuovoId('base'), nome: t('so.nuovaVoce'), gg: 5, figura: 'dev' });
                  })} />
                </tbody>
                <tfoot><tr className="is-total"><td>{t('comune.totale')}</td>
                  <td className="is-num">{numero(Math.round(o.stima.base.reduce((a, b) => a + b.gg, 0) * fImp * 10) / 10)}</td><td />
                  <td className="is-num">{euro(o.stima.base.reduce((a, b) => a + b.gg * fImp * r.tariffe[b.figura], 0))}</td><td /></tr></tfoot>
              </table>
            </Card>
            <Card {...cp("st-cust")}>
              <table className="alt-table">
                <thead><tr><th>{t('st.voce')}</th><th className="is-num">{t('st.giornate')}</th><th>{t('st.figura')}</th><th className="is-num">{t('st.importo')}</th><th /></tr></thead>
                {(['integrazioni', 'catalogo', 'moduli', 'stima'] as const).map((g) => {
                  const righe = vociCust.filter((v) => (v.gruppo ?? 'catalogo') === g);
                  if (!righe.length && g !== 'stima') return null;
                  return (
                    <tbody key={g}>
                      <tr className="is-gruppo"><td colSpan={3}><strong>{t(`st.gruppo.${g}` as Chiave)}</strong></td>
                        <td className="is-num muted">{euro(righe.reduce((a, v) => a + v.gg * r.tariffe[v.figura], 0))}</td><td /></tr>
                      {righe.map((v) => {
                        const dove = dovCustom(v.id);
                        const extra = g === 'stima';
                        return (
                          <RigaGiornate key={v.id} v={v} {...comuni} importo={v.gg * r.tariffe[v.figura]} origine={extra || g === 'integrazioni' ? undefined : origine(v.origine)}
                            onGg={(n) => upd((x) => {
                              const c = extra ? x.stima.extra?.find((y) => y.id === v.id) : dove ? x.soluzione[dove].find((y) => y.id === v.id) : null;
                              if (c) c.gg = n; else x.stima.gg[v.id] = n;
                            }, 'stima.custom')}
                            onNome={extra ? (n) => upd((x) => { x.stima.extra!.find((y) => y.id === v.id)!.nome = n; })
                              : dove ? (n) => upd((x) => { x.soluzione[dove].find((y) => y.id === v.id)!.nome = n; }) : undefined}
                            onFigura={extra ? (f) => upd((x) => { x.stima.extra!.find((y) => y.id === v.id)!.figura = f; })
                              : dove ? (f) => upd((x) => { x.soluzione[dove].find((y) => y.id === v.id)!.figura = f; }) : undefined}
                            onRimuovi={extra ? () => upd((x) => { x.stima.extra = (x.stima.extra ?? []).filter((y) => y.id !== v.id); })
                              : dove ? () => upd((x) => { x.soluzione[dove] = x.soluzione[dove].filter((y) => y.id !== v.id); })
                              : g === 'catalogo' && !v.origine?.startsWith('copre:') ? () => upd((x) => {
                                x.soluzione.connettori = x.soluzione.connettori.filter((y) => y !== v.id);
                                x.soluzione.integrazioni = x.soluzione.integrazioni.filter((y) => y !== v.id);
                              }) : undefined} />
                        );
                      })}
                      {g === 'stima' && <RigaPiu colonne={5} solaLettura={solaLettura} testo={t('st.aggiungiCustom')} onClick={() => upd((x) => {
                        x.stima.extra = [...(x.stima.extra ?? []), { id: nuovoId('extra'), nome: t('st.nuovaCustom'), gg: 5, figura: 'dev' }];
                      }, 'stima.custom')} />}
                    </tbody>
                  );
                })}
                <tfoot><tr className="is-total"><td>{t('comune.totale')}</td>
                  <td className="is-num">{numero(vociCust.reduce((a, v) => a + v.gg, 0))}</td><td />
                  <td className="is-num">{euro(vociCust.reduce((a, v) => a + v.gg * r.tariffe[v.figura], 0))}</td><td /></tr></tfoot>
              </table>
            </Card>
            <Card {...cp("st-op")}>
              <table className="alt-table">
                <thead><tr><th>{t('st.voce')}</th>{saas && <th className="is-num">SaaS</th>}{onp && <th className="is-num">On-premise</th>}</tr></thead>
                <tbody>
                  {saas && r.saas.setup.righe.filter((x) => !o.stima.base.some((b) => b.id === x.id)).map((x) => (
                    <tr key={`s-${x.id}`}><td>{x.nome}</td>
                      <td className="is-num"><CampoNumero compatto etichetta={x.nome} valore={x.gg} min={0}
                        onChange={(g) => upd((y) => { y.stima.gg[x.id] = g; }, 'stima.messa')} />
                        <div className="muted" style={{ fontSize: 11 }}>{euro(x.prezzo)}</div></td>
                      {onp && <td className="is-num">—</td>}</tr>
                  ))}
                  {onp && r.onPremise.setup.righe.filter((x) => !o.stima.base.some((b) => b.id === x.id)).map((x) => (
                    <tr key={`o-${x.id}`}><td>{x.nome}</td>
                      {saas && <td className="is-num">—</td>}
                      <td className="is-num"><CampoNumero compatto etichetta={x.nome} valore={x.gg} min={0}
                        onChange={(g) => upd((y) => { y.stima.gg[x.id] = g; }, 'stima.messa')} />
                        <div className="muted" style={{ fontSize: 11 }}>{euro(x.prezzo)}</div></td></tr>
                  ))}
                  <tr><td>{t('st.base')}</td>
                    {saas && <td className="is-num">{numero(r.saas.setup.righe.filter((x) => o.stima.base.some((b) => b.id === x.id)).reduce((a, x) => a + x.gg, 0))} gg · {euro(r.saas.setup.righe.filter((x) => o.stima.base.some((b) => b.id === x.id)).reduce((a, x) => a + x.prezzo, 0))}</td>}
                    {onp && <td className="is-num">{numero(r.onPremise.setup.righe.filter((x) => o.stima.base.some((b) => b.id === x.id)).reduce((a, x) => a + x.gg, 0))} gg · {euro(r.onPremise.setup.righe.filter((x) => o.stima.base.some((b) => b.id === x.id)).reduce((a, x) => a + x.prezzo, 0))}</td>}</tr>
                  <tr><td>{t('st.quote')}</td>
                    {saas && <td className="is-num">{numero(r.saas.setup.quote.reduce((a, q) => a + q.gg, 0))} gg · {euro(r.saas.setup.quote.reduce((a, q) => a + q.prezzo, 0))}</td>}
                    {onp && <td className="is-num">{numero(r.onPremise.setup.quote.reduce((a, q) => a + q.gg, 0))} gg · {euro(r.onPremise.setup.quote.reduce((a, q) => a + q.prezzo, 0))}</td>}</tr>
                  {saas && r.saas.setup.reevoServizi > 0 && (
                    <tr><td>{t('st.serviziReevo')}</td><td className="is-num">{euro(r.saas.setup.prezzo - r.saas.setup.righe.concat(r.saas.setup.quote).reduce((a, x) => a + x.prezzo, 0))}</td>{onp && <td className="is-num">—</td>}</tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="is-total"><td>{t('st.totaleSetup')}</td>
                    {saas && <td className="is-num">{numero(r.saas.setup.gg)} gg · {euro(r.saas.setup.prezzo)}</td>}
                    {onp && <td className="is-num">{numero(r.onPremise.setup.gg)} gg · {euro(r.onPremise.setup.prezzo)}</td>}</tr>
                </tfoot>
              </table>
            </Card>
            <Card {...cp("st-q")} aside={<StatoPulsanti stato={st('stima.quote')} onStato={setSt('stima.quote')} />}>
              <table className="alt-table">
                <thead><tr><th>{t('st.voce')}</th><th className="is-num">%</th>
                  <th className="is-num">{t('re.custom')}</th>{saas && <th className="is-num">{t('re.setup')} SaaS</th>}{onp && <th className="is-num">{t('re.setup')} on-premise</th>}</tr></thead>
                <tbody>
                  {cfg.quote.map((q) => {
                    const cella = (b: typeof r.saas.customizzazione) => { const x = b.quote.find((y) => y.id === q.id); return x ? `${numero(x.gg)} gg · ${euro(x.prezzo)}` : '—'; };
                    return (
                      <tr key={q.id}><td>{q.nome}</td>
                        <td className="is-num"><CampoNumero compatto etichetta={q.nome} valore={(o.stima.quote[q.id] ?? q.pct) * 100} suffisso="%" min={0} max={100}
                          onChange={(v) => upd((x) => { x.stima.quote[q.id] = v / 100; }, 'stima.quote')} /></td>
                        <td className="is-num">{cella(r.saas.customizzazione)}</td>
                        {saas && <td className="is-num">{cella(r.saas.setup)}</td>}
                        {onp && <td className="is-num">{cella(r.onPremise.setup)}</td>}</tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>)}

          {/* ================================================= 4 PREZZO */}
          {fase === 'prezzo' && (<>
            <Card {...cp("p-fig")} aside={<StatoPulsanti stato={st('prezzo.margineVenduto')} onStato={setSt('prezzo.margineVenduto')} />}>
              <div className="griglia-campi" style={{ marginBottom: 16 }}>
                <CampoNumero etichetta={t('pr.margine')} valore={o.prezzo.margineVenduto * 100} suffisso="%" min={0} max={99}
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
                    { v: (r.tariffe[f.id] - f.costo) / (r.tariffe[f.id] || 1), html: perc((r.tariffe[f.id] - f.costo) / (r.tariffe[f.id] || 1)) }
                  ]
                }))}
              />
            </Card>

            <Card {...cp("p-can")}>
              <div className="canoni">
                {saas && (
                  <div>
                    <div className="griglia-campi"><CampoNumero etichetta={t('leva.canoneSaas')} valore={o.leve.canoneSaas} min={0} suffisso="€"
                      stato={st('leve.canoneSaas')} onStato={setSt('leve.canoneSaas')}
                      onChange={(v) => upd((x) => { x.leve.canoneSaas = v; }, 'leve.canoneSaas')} /></div>
                    <div className="soglia" role="img" aria-label={t('pr.soglia', { v: euro(r.saas.soglia) })}>
                      <span className="soglia__v" style={{ width: `${Math.min(100, (o.leve.canoneSaas / 300000) * 100)}%` }} />
                      <span className="soglia__m" style={{ left: `${Math.min(100, (r.saas.soglia / 300000) * 100)}%` }} title={t('pr.soglia', { v: euro(r.saas.soglia) })} />
                    </div>
                    <table className="alt-table alt-table--compatta" style={{ marginTop: 14 }}>
                      <tbody>
                        <tr><td>{t('pr.canone')}</td><td className="is-num">{euro(r.saas.licenza.software)}</td></tr>
                        <tr><td>{t('pr.consumo')}</td><td className="is-num">{euro(r.saas.licenza.consumo)}</td></tr>
                        <tr className="is-total"><td>{t('re.licenza')}</td><td className="is-num">{euro(r.saas.licenza.totale)}</td></tr>
                        <tr><td className="muted">{t('re.ricorrenti')}</td><td className="is-num muted">−{euro(r.saas.costoRicorrente)}</td></tr>
                        <tr><td>{t('re.margine')}</td><td className="is-num">{euro(r.saas.annuo.margine)} · {perc(r.saas.annuo.marginePct)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {onp && (
                  <div>
                    <div className="griglia-campi"><CampoNumero etichetta={t('leva.softwareOnp')} valore={o.leve.softwareOnPremise} min={0} suffisso="€"
                      stato={st('leve.softwareOnPremise')} onStato={setSt('leve.softwareOnPremise')}
                      onChange={(v) => upd((x) => { x.leve.softwareOnPremise = v; }, 'leve.softwareOnPremise')} /></div>
                    <Barra etichetta={t('pr.licenzaOnp')} parti={[
                      { v: r.onPremise.licenza.software, cls: 's1', titolo: t('pr.software') },
                      { v: r.onPremise.licenza.manutenzione, cls: 's3', titolo: t('so.manutenzione') },
                      { v: r.onPremise.licenza.aiRifatturata, cls: 's2', titolo: t('pr.aiRif') }
                    ]} />
                    <table className="alt-table alt-table--compatta" style={{ marginTop: 14 }}>
                      <tbody>
                        <tr><td>{t('pr.software')}</td><td className="is-num">{euro(r.onPremise.licenza.software)}</td></tr>
                        <tr className={o.leve.manutenzioneOnPremise.attiva ? undefined : 'is-off'}>
                          <td><label className="alt-switch alt-switch--sm"><input type="checkbox" checked={o.leve.manutenzioneOnPremise.attiva} disabled={solaLettura}
                            onChange={(e) => upd((x) => { x.leve.manutenzioneOnPremise.attiva = e.target.checked; }, 'leve.manutenzioneOnPremise')} />
                            <span className="alt-switch__box" aria-hidden="true" /><span>{t('so.manutenzione')}</span></label></td>
                          <td className="is-num">{euro(r.onPremise.licenza.manutenzione)}</td></tr>
                        <tr className={o.leve.aiOnPremise === 'proxy' ? undefined : 'is-off'}>
                          <td title={t(`so.ai.${o.leve.aiOnPremise}.tip` as Chiave)}>{t('pr.aiRif')} · {t(`leva.ai.${o.leve.aiOnPremise}` as Chiave)}</td>
                          <td className="is-num">{euro(r.onPremise.licenza.aiRifatturata)}</td></tr>
                        {o.prezzo.consumoOnPremise && <tr><td>{t('pr.consumo')}</td><td className="is-num">{euro(r.onPremise.licenza.consumo)}</td></tr>}
                        <tr className="is-total"><td>{t('re.licenza')}</td><td className="is-num">{euro(r.onPremise.licenza.totale)}</td></tr>
                        <tr><td className="muted">{t('re.ricorrenti')}</td><td className="is-num muted">−{euro(r.onPremise.costoRicorrente)}</td></tr>
                        <tr><td>{t('re.margine')}</td><td className="is-num">{euro(r.onPremise.annuo.margine)} · {perc(r.onPremise.annuo.marginePct)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>

            <Card {...cp("p-sca")} bloccata={!saas && !o.prezzo.consumoOnPremise} aside={<StatoPulsanti stato={st('prezzo.scaglioni')} onStato={setSt('prezzo.scaglioni')} />}>
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
                <tfoot><tr className="is-total"><td colSpan={4}>{t('pr.consumo')}</td><td className="is-num">{euro(r.consumo.totale)}</td></tr></tfoot>
              </table>
              <div className="griglia-campi" style={{ marginTop: 16 }}>
                <label className="campo">
                  <span>{t('pr.metrica')}<StatoPulsanti stato={st('prezzo.metrica')} onStato={setSt('prezzo.metrica')} /></span>
                  <span className="alt-inputwrap">
                    <select className="alt-input" value={o.prezzo.metrica ?? ''} disabled={solaLettura}
                      onChange={(e) => upd((x) => { x.prezzo.metrica = (e.target.value || null) as Offerta['prezzo']['metrica']; }, 'prezzo.metrica')}>
                      <option value="">—</option>
                      <option value="avviata">{t('pr.metrica.avviata')}</option>
                      <option value="completata">{t('pr.metrica.completata')}</option>
                    </select>
                  </span>
                </label>
                {onp && (
                  <label className="alt-switch" style={{ alignSelf: 'end' }}>
                    <input type="checkbox" checked={o.prezzo.consumoOnPremise} disabled={solaLettura}
                      onChange={(e) => upd((x) => { x.prezzo.consumoOnPremise = e.target.checked; })} />
                    <span className="alt-switch__box" aria-hidden="true" /><span>{t('pr.consumoOnp')}</span>
                  </label>
                )}
              </div>
            </Card>

            <Card {...cp("p-vin")}>
              <TabellaOrdinabile
                colonne={[{ nome: t('st.voce') }, { nome: t('pr.natura') }, { nome: t('pr.costo'), num: true }, { nome: t('pr.prezzo'), num: true }]}
                righe={[
                  ...r.vincoliUnaTantum.map((v) => ({ key: v.id, celle: [{ v: v.nome }, { v: t('pr.unaTantum') }, { v: v.costo, html: euro(v.costo) }, { v: v.prezzo, html: euro(v.prezzo) }] })),
                  ...(saas ? r.saas : r.onPremise).ricorrenti.filter((v) => cfg.vincoli.some((c) => c.id === v.id)).map((v) => ({
                    key: v.id, celle: [{ v: v.nome }, { v: t('pr.ricorrente') }, { v: v.costo, html: euro(v.costo) }, { v: '', html: '—' }]
                  })),
                  ...cfg.vincoli.filter((v) => !o.vincoli[v.id] && v.effetto.tipo !== 'nessuno' && v.effetto.tipo !== 'sblocca').map((v) => ({
                    key: `off-${v.id}`, className: 'is-bloccato', celle: [{ v: v.nome }, { v: '—' }, { v: '', html: '—' }, { v: '', html: '—' }]
                  }))
                ]}
              />
            </Card>

            <Card {...cp("p-min")}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>
                <label className="alt-switch">
                  <input type="checkbox" checked={o.prezzo.minimoGarantito !== null} disabled={solaLettura}
                    onChange={(e) => upd((x) => { x.prezzo.minimoGarantito = e.target.checked ? Math.round(r.saas.soglia) : null; })} />
                  <span className="alt-switch__box" aria-hidden="true" /><span>{t('pr.minimoPrevisto')}</span>
                </label>
                {o.prezzo.minimoGarantito !== null && (
                  <CampoNumero etichetta={t('pr.minimoImpegno')} valore={o.prezzo.minimoGarantito} min={0} suffisso="€"
                    onChange={(v) => upd((x) => { x.prezzo.minimoGarantito = v; })} />
                )}
              </div>
            </Card>
          </>)}

          {/* ================================================= 5 RESOCONTO */}
          {fase === 'resoconto' && sub === 'r-sin' && <Sintesi {...propsRes} />}
          {fase === 'resoconto' && sub === 'r-sos' && <Sostenibilita {...propsRes} />}
          {fase === 'resoconto' && sub === 'r-det' && <DettaglioCosti {...propsRes} />}
        </main>

        <aside className="rail" aria-label={t('re.licenza')}>
          {sub === 'r-sin' ? <RailSintesi {...propsRes} /> : sub === 'r-sos' ? <RailSostenibilita {...propsRes} /> : sub === 'r-det' ? <RailDettaglio {...propsRes} /> : (<>
          <div className="rail__card rail__card--brand">
            <p className="rail__h">{t('re.licenza')}</p>
            {saas && <div className="rail__stat"><span>SaaS</span><b>{euro(r.saas.licenza.totale)}</b></div>}
            {onp && <div className="rail__stat"><span>On-premise</span><b>{euro(r.onPremise.licenza.totale)}</b></div>}
          </div>
          <div className="rail__card">
            <p className="rail__h">{t('re.margine')}</p>
            {saas && <div className="rail__stat"><span>SaaS</span><b>{perc(r.saas.annuo.marginePct)}</b></div>}
            {onp && <div className="rail__stat"><span>On-premise</span><b>{perc(r.onPremise.annuo.marginePct)}</b></div>}
          </div>
          <div className="rail__card">
            <p className="rail__h">{t('re.approvazione')}</p>
            <div className="rail__stat"><span>{t('off.definito')}</span><b>{pct[fase]}%</b></div>
            <div className="rail__stat"><span>{t('re.critici')}</span><b>{bloccanti(o, stati).length}</b></div>
          </div>
          </>)}
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

function effetto(v: Config['vincoli'][number], t: ReturnType<typeof useT>): string {
  const e = v.effetto;
  switch (e.tipo) {
    case 'ricorrente_fisso': return t('as.eff.fisso', { v: euro(e.importo) });
    case 'ricorrente_pct_licenza': return t('as.eff.pct', { v: perc(e.pct) });
    case 'una_tantum_gg': return t('as.eff.gg', { v: e.gg });
    case 'sblocca': return t('as.eff.sblocca');
    default: return t('as.eff.ai');
  }
}
