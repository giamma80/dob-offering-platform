'use client';

import { useMemo, useState } from 'react';
import { pianoTrimestrale, riepilogoPiano, testoCurva, testoQuota } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import { euro, perc, rapporto } from '@/lib/ui/formato';
import type { DatiBP } from '@/lib/businessPlan';
import { scorriA } from '@/lib/ui/scorri';
import { AreeRicaviMargine } from '@/components/bp/AreeRicaviMargine';
import { CascataBP, type PassoCascata } from '@/components/bp/CascataBP';
import { CurvaNetto } from '@/components/bp/CurvaNetto';
import { indiceOggi } from '@/components/bp/GraficiBP';
import { LegendaBP } from '@/components/bp/LegendaBP';
import { coloreProgetto } from '@/components/bp/colori';
import { Icona } from '@/components/Icona';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { MenuUtente } from '@/components/utente/MenuUtente';
import { importo } from '@/lib/ui/formato';

const ANNI = 3;
const tratteggio = (c: string) => `repeating-linear-gradient(135deg, ${c} 0 4px, var(--surface-card) 4px 7px)`;

function Info({ tip }: { tip: string }) {
  return (
    <svg className="bpn-inf" width="16" height="16" viewBox="0 0 16 16" role="img" aria-label={tip}>
      <title>{tip}</title>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.2v4M8 4.9v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function VistaBusinessPlanNew({ investimento, progetti, piattaforma }: DatiBP) {
  const t = useT();
  const [sel, setSel] = useState<string[]>(() => progetti.map((p) => p.id));
  const [sez, setSez] = useState('bpn-sintesi');
  const tutti = useMemo(() => progetti.map((p) => ({ ...p, inizio: new Date(p.inizio) })), [progetti]);
  const inv = investimento.sviluppo + investimento.amPrimoAnno;
  const pf = useMemo(() => ({ ...piattaforma, dal: new Date(piattaforma.dal), voci: piattaforma.voci?.map((v) => ({ ...v, dal: new Date(v.dal) })) }), [piattaforma]);
  const oggi = useMemo(() => new Date(), []);
  const da = useMemo(() => {
    const min = tutti.reduce((a, p) => (p.inizio < a ? p.inizio : a), pf.dal < oggi ? pf.dal : oggi);
    return new Date(Date.UTC(min.getUTCFullYear(), 0, 1));
  }, [tutti, pf, oggi]);
  const colori = useMemo(() => new Map(tutti.map((p, i) => [p.id, coloreProgetto(i)])), [tutti]);
  const scelti = tutti.filter((p) => sel.includes(p.id));
  const piano = useMemo(() => pianoTrimestrale(inv, scelti, da, ANNI * 4, pf), [inv, scelti, da, pf]);
  const pianoTutti = useMemo(() => pianoTrimestrale(inv, tutti, da, ANNI * 4, pf), [inv, tutti, da, pf]);
  const pianoAppr = useMemo(() => pianoTrimestrale(inv, tutti.filter((p) => !p.inCorso), da, ANNI * 4, pf), [inv, tutti, da, pf]);
  const r = riepilogoPiano(piano), ra = riepilogoPiano(pianoAppr);

  /* trimestri mostrati: dal primo con ricavi o costi di piattaforma; i cumulati restano quelli del piano intero */
  const i0 = Math.max(0, pianoTutti.trimestri.findIndex((q) => q.ricavi > 0 || q.piattaforma > 0));
  const vis = piano.trimestri.slice(i0);
  const etichette = vis.map((q) => q.etichetta.slice(2));
  const N = vis.length;
  const fineAnno = da.getUTCFullYear() + ANNI - 1, inizioAnno = Number(vis[0].etichetta.slice(0, 4));
  const ioPiano = indiceOggi(piano, oggi);
  const io = ioPiano === null || ioPiano - i0 < 0 ? null : ioPiano - i0;
  const colOggi = (oggi.getUTCFullYear() - da.getUTCFullYear()) * 4 + Math.floor(oggi.getUTCMonth() / 3) - i0;

  const tuttiScelti = sel.length === tutti.length, soloApprovati = tutti.every((p) => sel.includes(p.id) === !p.inCorso);
  const alterna = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const nomeTutti = tuttiScelti ? t('bp.tutti') : t('bp.selezione');

  const ultimo = piano.trimestri[piano.trimestri.length - 1];
  const finali = (id: string) => ultimo.progetti.find((x) => x.id === id)!;
  const margineBozze = scelti.filter((p) => p.inCorso).reduce((a, p) => a + finali(p.id).margineCum, 0);
  const quotaBozze = r.margine ? margineBozze / r.margine : 0;
  const maggiore = scelti.reduce<(typeof scelti)[number] | null>((m, p) => (!m || finali(p.id).margineCum > finali(m.id).margineCum ? p : m), null);
  const quotaMaggiore = maggiore && r.margine ? finali(maggiore.id).margineCum / r.margine : 0;
  const ricorrenti = { appr: scelti.filter((p) => !p.inCorso).reduce((a, p) => a + p.licenzaAnnua, 0), bozze: scelti.filter((p) => p.inCorso).reduce((a, p) => a + p.licenzaAnnua, 0) };
  const tc = testoCurva(pianoTutti, pianoAppr), tq = testoQuota(quotaBozze);
  const segno = (v: number) => `${v > 0 ? '+' : ''}${euro(v)}`;

  const serie = scelti.map((p) => ({
    id: p.id, nome: p.cliente, colore: colori.get(p.id)!, bozza: p.inCorso,
    valori: vis.map((q) => q.progetti.find((x) => x.id === p.id)!.ricavi)
  }));
  const ricaviQ = vis.map((q) => q.ricavi), margineQ = vis.map((q) => q.margine);
  const dirQ = vis.map((q) => q.costiDiretti), pfQ = vis.map((q) => q.piattaforma);
  const costiQ = vis.map((q) => q.costiDiretti + q.piattaforma);
  const somma = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const avvio = (p: (typeof tutti)[number]) => `${String(p.inizio.getUTCFullYear()).slice(2)} Q${Math.floor(p.inizio.getUTCMonth() / 3) + 1}`;

  const cascata: PassoCascata[] = [
    { nome: t('bp.ricavi'), da: 0, valore: r.ricavi, colore: 'var(--accent-azure)', tipo: 'totale' },
    { nome: t('bp.costiDiretti'), da: r.ricavi, valore: -r.costiDiretti, colore: 'var(--ink-muted)', tipo: 'delta' },
    { nome: t('bpn.margineContribuzione.a'), da: 0, valore: r.margine, colore: 'var(--surface-brand)', tipo: 'totale' },
    { nome: t('bpn.costiPiattaforma.a'), da: r.margine, valore: -r.piattaforma, colore: 'var(--signal-negative)', tipo: 'delta' },
    { nome: t('bp.investimentoRiga'), da: r.margine - r.piattaforma, valore: -inv, colore: 'var(--signal-negative)', tipo: 'delta' },
    { nome: t('bp.netto'), da: 0, valore: r.netto, colore: r.netto < 0 ? 'var(--signal-negative)' : 'var(--signal-positive)', tipo: 'totale' }
  ];

  const righe = scelti.map((p) => {
    const x = finali(p.id);
    const massimo = Math.max(...scelti.map((s) => finali(s.id).margineCum), 1);
    const c = colori.get(p.id)!;
    return {
      key: p.id,
      celle: [
        { v: p.cliente, html: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><i className="bpn-dot" style={{ background: c }} />{p.cliente}</span> },
        { v: p.inCorso ? 0 : 1, html: <span className={`bpn-chip ${p.inCorso ? 'bpn-chip--bozza' : 'bpn-chip--ok'}`}>{p.inCorso ? t('bpn.bozza') : t('bp.approvata')}</span> },
        { v: x.ricaviCum, html: euro(x.ricaviCum) },
        { v: x.margineCum, html: (
          <div className="bpn-bar"><b>{euro(x.margineCum)}</b>
            <span className="bpn-trk"><i style={{ width: `${Math.max(0, x.margineCum / massimo) * 100}%`, background: p.inCorso ? tratteggio(c) : c, border: p.inCorso ? `1.5px solid ${c}` : undefined }} /></span></div>
        ) },
        { v: x.ricaviCum ? x.margineCum / x.ricaviCum : 0, html: x.ricaviCum ? perc(x.margineCum / x.ricaviCum) : '—' },
        { v: r.margine ? x.margineCum / r.margine : 0, html: r.margine ? perc(x.margineCum / r.margine) : '—' }
      ]
    };
  });

  const SEZ = [
    { id: 'bpn-sintesi', k: 'bp.sintesi' as const, ico: 'bp' },
    { id: 'bpn-curva', k: 'bpn.curvaNetto' as const, ico: 'sintesi' },
    { id: 'bpn-timeline', k: 'bpn.timeline' as const, ico: 'offerte' },
    { id: 'bpn-progetti', k: 'bpn.progetti' as const, ico: 'costi' }
  ];
  const titolo = (ico: string, testo: string, tip: string) => (
    <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome={ico} />{testo}<Info tip={tip} /></h2>
  );
  const kpi = (label: string, valore: string, tip: string, colore?: string) => (
    <div className="bpn-kpi"><p className="bpn-lb">{label}</p>
      <div className="bpn-kpi__r"><p className="bpn-fig" style={{ color: colore }}>{valore}</p><Info tip={tip} /></div></div>
  );
  const rigaMx = (nome: React.ReactNode, vals: number[], classe?: string) => (
    <tr className={classe}>
      <th scope="row">{nome}</th>
      {vals.map((v, i) => <td key={etichette[i]} className={i === colOggi ? 'og' : undefined}>{importo(v)}</td>)}
      <td className="tt">{importo(somma(vals))}</td>
    </tr>
  );
  const bande = (testo: string) => <tr className="bh"><td colSpan={N + 2}>{testo}</td></tr>;
  const coperturaCol = r.copertura < 1 ? 'var(--signal-negative)' : 'var(--signal-positive)';

  return (
    <div className="shell bpn-shell">
      <aside className="subnav" aria-label={t('mon.bpNew')}>
        <p className="subnav__title">{t('mon.bpNew')}</p>
        {SEZ.map((s) => (
          <a key={s.id} className="subnav__a" href={`#${s.id}`} aria-current={sez === s.id ? 'true' : undefined}
            onClick={(e) => { e.preventDefault(); setSez(s.id); scorriA(s.id); }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome={s.ico} />{t(s.k)}</span>
          </a>
        ))}
        <MenuUtente />
      </aside>
      <main className="content">
        <div className="bpn-head">
          <h1 className="ttl" style={{ margin: 0 }}>{t('mon.bpNew')}</h1>
          <span className="alt-badge alt-badge--riservato">{t('re.riservato')}</span>
          <span className="seg" role="radiogroup" aria-label={t('bp.perimetro')} style={{ marginLeft: 'auto' }}>
            <b role="radio" tabIndex={0} aria-checked={tuttiScelti} className={tuttiScelti ? 'on' : undefined}
              onClick={() => setSel(tutti.map((p) => p.id))} onKeyDown={(e) => e.key === 'Enter' && setSel(tutti.map((p) => p.id))}>{t('bp.tutti')}</b>
            <b role="radio" tabIndex={0} aria-checked={!tuttiScelti && soloApprovati} className={!tuttiScelti && soloApprovati ? 'on' : undefined}
              onClick={() => setSel(tutti.filter((p) => !p.inCorso).map((p) => p.id))} onKeyDown={(e) => e.key === 'Enter' && setSel(tutti.filter((p) => !p.inCorso).map((p) => p.id))}>{t('bp.soloApprovati')}</b>
          </span>
        </div>

        <div className="bpsel bpn-sel" role="group" aria-label={t('bp.perimetro')}>
          {tutti.map((p) => (
            <label key={p.id} className={p.inCorso ? 'bozza' : undefined} style={{ ['--c' as string]: colori.get(p.id) }}>
              <input type="checkbox" checked={sel.includes(p.id)} onChange={() => alterna(p.id)} />
              {p.cliente}{p.inCorso && <small>{t('bp.inCorsoBreve')}</small>}
            </label>
          ))}
        </div>

        <section className="bpn-hero" id="bpn-sintesi" aria-label={t('bp.sintesi')}>
          <div><p className="bpn-lb bpn-lb--hero">{t('bp.pareggio')}<Info tip={t('bpn.heroTip', { a: fineAnno, v: euro(r.netto), p: nomeTutti.toLowerCase() })} /></p>
            <p className="bpn-hero__big">{piano.pareggio ?? t('bpn.oltre', { a: fineAnno })}</p></div>
          <div><p className="bpn-lb bpn-lb--hero">{t('bp.soloApprovati')}<Info tip={t(ra.nettoTrimestre < 0 ? 'bpn.peggiora' : 'bpn.migliora', { v: euro(Math.abs(ra.nettoTrimestre)) })} /></p>
            <p className="bpn-hero__val" style={{ color: ra.netto < 0 ? 'var(--signal-negative-soft)' : 'var(--accent-azure-mid)' }}>{euro(ra.netto)}</p></div>
          <div><p className="bpn-lb bpn-lb--hero">{t('bpn.regime', { n: nomeTutti.toLowerCase() })}<Info tip={t(r.nettoTrimestre > 0 ? 'bpn.regimeMigliora' : 'bpn.regimePeggiora')} /></p>
            <p className="bpn-hero__val" style={{ color: r.nettoTrimestre > 0 ? 'var(--accent-azure-mid)' : 'var(--signal-negative-soft)' }}>{segno(r.nettoTrimestre)}</p></div>
        </section>

        <section className="bpn-kpis" aria-label={t('bpn.indicatori')}>
          {kpi(t('bpn.invDaRecuperare'), euro(inv), t('bpn.invTip', { s: euro(investimento.sviluppo), a: euro(investimento.amPrimoAnno) }))}
          {kpi(t('bp.esposizione'), euro(r.esposizione.valore), t('bpn.espTip', { q: r.esposizione.etichetta.slice(2) }), 'var(--signal-negative)')}
          {kpi(t('bpn.margineContribuzione'), euro(r.margine), t('bpn.margTip', { p: r.ricavi ? perc(r.margine / r.ricavi) : '—', r: euro(r.ricavi) }), 'var(--signal-positive)')}
          {kpi(t('bp.copertura'), rapporto(r.copertura), t('bpn.copTip', { a: rapporto(ra.copertura) }), coperturaCol)}
          {kpi(t('bpn.ricorrenti'), euro(ricorrenti.appr + ricorrenti.bozze), t('bpn.ricTip', { a: euro(ricorrenti.appr), b: euro(ricorrenti.bozze) }))}
        </section>

        <section className="bpn-due" id="bpn-curva">
          <div className="alt-card"><div className="alt-card__head">{titolo('sintesi', t('bpn.curvaNetto'), t('bpn.curvaTip', { f: t(tc.chiave, { q: tc.q ?? '', a: fineAnno }) }))}</div>
            <div className="alt-card__body">
              <CurvaNetto etichette={etichette} tutti={vis.map((q) => q.netto)} approvati={pianoAppr.trimestri.slice(i0).map((q) => q.netto)} oggi={io}
                testi={{ tutti: nomeTutti, approvati: t('bp.soloApprovati'), oggi: t('bp.oggi'), esposizione: t('bp.esposizione'), pareggio: t('bp.pareggio') }} aria={t('bpn.curvaNetto')} />
            </div></div>
          <div className="alt-card"><div className="alt-card__head">{titolo('costi', t('bpn.cascata'), t('bpn.cascataTip', { a: inizioAnno, b: fineAnno }))}</div>
            <div className="alt-card__body"><CascataBP passi={cascata} aria={t('bpn.cascata')} /></div></div>
        </section>

        <div className="alt-card" id="bpn-timeline">
          <div className="alt-card__head">{titolo('offerte', t('bpn.timeline'), t('bpn.timelineTip'))}</div>
          <div className="alt-card__body">
            <LegendaBP voci={[
              ...scelti.map((p) => ({ tipo: 'box' as const, nome: p.cliente, colore: p.inCorso ? tratteggio(colori.get(p.id)!) : colori.get(p.id)!, tip: t('bpn.avvioTip', { s: p.inCorso ? t('bpn.bozza') : t('bp.approvata'), q: avvio(p) }) })),
              { tipo: 'linea', nome: t('bp.margine'), colore: 'var(--surface-brand-deep)' }, { tipo: 'tratto', nome: t('bp.costi'), colore: 'var(--signal-negative)' }]} />
            <AreeRicaviMargine etichette={etichette} serie={serie} ricavi={ricaviQ} margine={margineQ} costi={costiQ} oggi={io}
              testi={{ margine: t('bp.margine'), costi: t('bp.costi'), ricavi: t('bp.ricavi'), oggi: t('bp.oggi') }} aria={t('bpn.timeline')} />
            <div className="bpn-mxw">
              <table className="bpn-mx">
                <thead><tr><th />{etichette.map((l, i) => <th key={l} className={`qh${i === colOggi ? ' og' : ''}`}>{l}{i === colOggi && <em>{t('bp.oggi')}</em>}</th>)}<th className="qh">{t('bp.periodo')}</th></tr></thead>
                <tbody>
                  {bande(t('bp.ricavi'))}
                  {scelti.map((p) => rigaMx(<><i className="bpn-dot" style={{ background: colori.get(p.id), opacity: p.inCorso ? 0.6 : 1 }} />{p.cliente}</>, serie.find((s) => s.id === p.id)!.valori))}
                  {rigaMx(t('bpn.totaleRicavi'), ricaviQ, 'tr')}
                  {bande(t('bpn.margineECosti'))}
                  {rigaMx(t('bpn.margineContribuzione'), margineQ, 'tr')}
                  {rigaMx(t('bp.costiDiretti'), dirQ)}
                  {rigaMx(t('bp.costiPiattaforma'), pfQ)}
                  {rigaMx(t('bpn.nettoTrimestre'), margineQ.map((m, i) => m - pfQ[i]), 'tr')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="alt-card" id="bpn-progetti">
          <div className="alt-card__head">{titolo('costi', t('bpn.progetti'), t('bpn.progettiTip', { f: t(tq.chiave, { p: perc(tq.quota) }), a: inizioAnno, b: fineAnno }))}</div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('bp.progetto') }, { nome: t('bp.stato') }, { nome: t('bp.ricavi'), num: true }, { nome: t('bpn.margineContribuzione'), num: true },
                { nome: t('bp.margPerc'), num: true }, { nome: t('bp.quota'), num: true }]}
              righe={righe}
              totale={[{ v: t('bpn.totale', { a: inizioAnno, b: fineAnno }) }, { v: '' }, { v: r.ricavi, html: euro(r.ricavi) }, { v: r.margine, html: euro(r.margine) },
                { v: r.ricavi ? r.margine / r.ricavi : 0, html: r.ricavi ? perc(r.margine / r.ricavi) : '—' }, { v: 1, html: perc(r.margine ? 1 : 0) }]}
            />
          </div>
        </div>

        <section className="bpn-tre" aria-label={t('bpn.monitoraggio')}>
          <div className="bpn-kpi"><p className="bpn-lb">{t('bp.copertura')}</p>
            <div className="bpn-kpi__r"><p className="bpn-fig" style={{ color: coperturaCol }}>{rapporto(r.copertura)}</p><Info tip={t('bpn.scalaTip', { v: rapporto(r.copertura) })} /></div>
            <div className="bpn-gauge"><i style={{ width: `${Math.min(r.copertura / 2, 1) * 100}%`, background: coperturaCol }} /><b /></div></div>
          <div className="bpn-kpi"><p className="bpn-lb">{t('bp.quotaBozze')}</p>
            <div className="bpn-kpi__r"><p className="bpn-fig">{perc(quotaBozze)}</p><Info tip={t('bpn.bozzeTip', { a: euro(margineBozze), b: euro(r.margine) })} /></div>
            <div className="bpn-gauge"><i style={{ width: `${quotaBozze * 100}%`, background: 'repeating-linear-gradient(135deg, var(--signal-open) 0 5px, var(--signal-open-soft) 5px 8px)' }} /></div></div>
          <div className="bpn-kpi"><p className="bpn-lb">{t('bpn.maggiore')}</p>
            <div className="bpn-kpi__r"><p className="bpn-fig">{perc(quotaMaggiore)}</p><Info tip={maggiore?.cliente ?? '—'} /></div>
            <div className="bpn-gauge"><i style={{ width: `${quotaMaggiore * 100}%`, background: 'var(--accent-azure)' }} /></div></div>
        </section>
      </main>
    </div>
  );
}
