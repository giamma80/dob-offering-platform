'use client';

import { useMemo, useState } from 'react';
import { pianoTrimestrale, riepilogoPiano, titoloPiano } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import { euro, perc } from '@/lib/ui/formato';
import type { DatiBP } from '@/lib/businessPlan';
import { AreeTimeline, type SerieArea } from '@/components/bp/AreeTimeline';
import { LegendaBP } from '@/components/bp/LegendaBP';
import { coloreProgetto } from '@/components/bp/colori';
import { Icona } from '@/components/Icona';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { MenuUtente } from '@/components/utente/MenuUtente';

const ANNI = 3;
type Vista = 'ricavi' | 'margine' | 'costi';

export function VistaBusinessPlanNew({ investimento, progetti, piattaforma }: DatiBP) {
  const t = useT();
  const [sel, setSel] = useState<string[]>(() => progetti.map((p) => p.id));
  const [vista, setVista] = useState<Vista>('margine');
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
  const pianoApprovati = useMemo(() => pianoTrimestrale(inv, tutti.filter((p) => !p.inCorso), da, ANNI * 4, pf), [inv, tutti, da, pf]);
  const r = riepilogoPiano(piano), ra = riepilogoPiano(pianoApprovati);
  const titolo = titoloPiano(piano, pianoApprovati);
  const bozze = tutti.filter((p) => p.inCorso && sel.includes(p.id));
  const margineBozze = piano.trimestri[piano.trimestri.length - 1].progetti.filter((x) => bozze.some((b) => b.id === x.id)).reduce((a, x) => a + x.margineCum, 0);
  const tuttiScelti = sel.length === tutti.length, soloApprovati = tutti.every((p) => sel.includes(p.id) === !p.inCorso);
  const alterna = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const fineAnno = da.getUTCFullYear() + ANNI - 1;

  const serie: SerieArea[] = scelti.map((p) => ({
    id: p.id, nome: p.cliente, colore: colori.get(p.id)!,
    valori: piano.trimestri.map((q) => {
      const x = q.progetti.find((y) => y.id === p.id)!;
      return vista === 'ricavi' ? x.ricavi : vista === 'margine' ? x.margine : x.costiDiretti;
    })
  }));
  if (vista === 'costi') {
    serie.push({ id: 'piattaforma', nome: t('bp.costiPiattaforma'), colore: 'var(--signal-negative)', valori: piano.trimestri.map((q) => q.piattaforma) });
  }
  const viste: { id: Vista; k: 'bp.ricavi' | 'bp.margineProgetti' | 'bp.costi' }[] = [
    { id: 'ricavi', k: 'bp.ricavi' }, { id: 'margine', k: 'bp.margineProgetti' }, { id: 'costi', k: 'bp.costi' }
  ];
  const vuota = (n: number) => Array.from({ length: n }, () => ({ v: '' }));
  const righe = scelti.map((p) => {
    const x = piano.trimestri[piano.trimestri.length - 1].progetti.find((y) => y.id === p.id)!;
    return {
      key: p.id,
      celle: [
        { v: p.cliente, html: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: colori.get(p.id) }} />{p.cliente}</span> },
        { v: p.inCorso ? 0 : 1, html: p.inCorso ? t('bp.inCorsoBreve') : t('bp.approvata') },
        { v: p.inizio.getTime(), html: `${p.inizio.getUTCMonth() + 1}/${p.inizio.getUTCFullYear()}` },
        { v: x.ricaviCum, html: euro(x.ricaviCum) },
        { v: x.costiDirettiCum, html: euro(-x.costiDirettiCum) },
        { v: x.margineCum, html: euro(x.margineCum) },
        { v: x.ricaviCum ? x.margineCum / x.ricaviCum : 0, html: x.ricaviCum ? perc(x.margineCum / x.ricaviCum) : '—' },
        { v: r.margine ? x.margineCum / r.margine : 0, html: r.margine ? perc(x.margineCum / r.margine) : '—' }
      ]
    };
  });
  const voci = scelti.map((p) => ({ tipo: 'box' as const, nome: p.cliente, colore: colori.get(p.id)! }));

  return (
    <div className="shell">
      <aside className="subnav" aria-label={t('mon.bpNew')}>
        <p className="subnav__title">{t('mon.bpNew')}</p>
        <MenuUtente />
      </aside>
      <main className="content">
        <h1 className="ttl">{t(titolo.chiave, { q: titolo.q ?? '' })}</h1>
        <div className="alt-confid"><span className="alt-badge alt-badge--riservato">{t('re.riservato')}</span></div>

        <div className="alt-card">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('bp.perimetroTip')}><Icona nome="bp" />{t('bp.perimetro')}</h2>
            <span className="seg" role="radiogroup" aria-label={t('bp.perimetro')} style={{ marginLeft: 'auto' }}>
              <b role="radio" tabIndex={0} aria-checked={tuttiScelti} className={tuttiScelti ? 'on' : undefined}
                onClick={() => setSel(tutti.map((p) => p.id))} onKeyDown={(e) => e.key === 'Enter' && setSel(tutti.map((p) => p.id))}>{t('bp.tutti')}</b>
              <b role="radio" tabIndex={0} aria-checked={!tuttiScelti && soloApprovati} className={!tuttiScelti && soloApprovati ? 'on' : undefined}
                onClick={() => setSel(tutti.filter((p) => !p.inCorso).map((p) => p.id))} onKeyDown={(e) => e.key === 'Enter' && setSel(tutti.filter((p) => !p.inCorso).map((p) => p.id))}>{t('bp.soloApprovati')}</b>
            </span>
          </div>
          <div className="alt-card__body">
            <div className="bpsel" role="group" aria-label={t('bp.perimetro')}>
              {tutti.map((p) => (
                <label key={p.id} className={p.inCorso ? 'bozza' : undefined} style={{ ['--c' as string]: colori.get(p.id) }}>
                  <input type="checkbox" checked={sel.includes(p.id)} onChange={() => alterna(p.id)} />
                  {p.cliente}{p.inCorso && <small>{t('bp.inCorsoBreve')}</small>}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bpkpi">
          <div className="alt-kpi alt-kpi--brand alt-kpi--hero" title={t('bp.nettoTip', { a: fineAnno })}>
            <p className="alt-kpi__label">{t('bp.pareggio')}</p>
            <p className="alt-kpi__value">{piano.pareggio ?? t('bp.nonRaggiunto')}</p>
            <span className="alt-kpi__delta alt-kpi__delta--flat" style={{ color: 'var(--accent-azure-pale)' }}>{t('bp.nettoA', { a: fineAnno })}: {euro(r.netto)}</span>
          </div>
          <div className="bpkpi__g">
            <div className="alt-kpi alt-kpi--md" title={t('bp.esposizioneTip', { q: r.esposizione.etichetta })}>
              <p className="alt-kpi__label">{t('bp.esposizione')}</p><p className="alt-kpi__value" style={{ color: 'var(--signal-negative)' }}>{euro(r.esposizione.valore)}</p></div>
            <div className="alt-kpi alt-kpi--md" title={t('bp.coperturaTip')}>
              <p className="alt-kpi__label">{t('bp.copertura')}</p><p className="alt-kpi__value">{r.copertura.toFixed(2)}×</p>
              <span className="alt-kpi__delta alt-kpi__delta--flat">{t('bp.soloApprovati')}: {ra.copertura.toFixed(2)}×</span></div>
            <div className="alt-kpi alt-kpi--md" title={t('bp.margineDettaglio', { p: r.ricavi ? perc(r.margine / r.ricavi) : '—' })}>
              <p className="alt-kpi__label">{t('bp.margineProgetti')}</p><p className="alt-kpi__value">{euro(r.margine)}</p></div>
            <div className="alt-kpi alt-kpi--md" title={t('bp.quotaBozzeTip')}>
              <p className="alt-kpi__label">{t('bp.quotaBozze')}</p><p className="alt-kpi__value">{r.margine ? perc(margineBozze / r.margine) : '—'}</p></div>
          </div>
        </div>

        <div className="alt-card">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('bp.areeTip')}><Icona nome="offerte" />{t('bp.timeline')}</h2>
            <span className="seg" role="radiogroup" aria-label={t('bp.timeline')} style={{ marginLeft: 'auto' }}>
              {viste.map((v) => (
                <b key={v.id} role="radio" tabIndex={0} aria-checked={vista === v.id} className={vista === v.id ? 'on' : undefined}
                  onClick={() => setVista(v.id)} onKeyDown={(e) => e.key === 'Enter' && setVista(v.id)}>{t(v.k)}</b>
              ))}
            </span>
          </div>
          <div className="alt-card__body">
            <AreeTimeline piano={piano} serie={serie} etichetta={t('bp.timeline')} oggi={oggi} />
            <LegendaBP voci={[...voci, ...(vista === 'costi' ? [{ tipo: 'box' as const, nome: t('bp.costiPiattaforma'), colore: 'var(--signal-negative)' }] : []),
              { tipo: 'tratto', nome: t('bp.pareggio'), colore: 'var(--signal-positive)' }, { tipo: 'tratto', nome: t('bp.oggi'), colore: 'var(--accent-azure)' }]} />
          </div>
        </div>

        <div className="alt-card">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('bp.tabellaTip', { a: fineAnno })}><Icona nome="costi" />{t('bp.contributo')}</h2>
          </div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('bp.progetto') }, { nome: t('bp.stato') }, { nome: t('bp.avvio') }, { nome: t('bp.ricavi'), num: true }, { nome: t('bp.costiDiretti'), num: true },
                { nome: t('bp.margine'), num: true }, { nome: t('bp.margPerc'), num: true }, { nome: t('bp.quota'), num: true }]}
              righe={[
                ...righe,
                { key: 'piattaforma', className: 'is-neg', celle: [{ v: t('bp.costiPiattaforma') }, ...vuota(4), { v: -r.piattaforma, html: euro(-r.piattaforma) }, ...vuota(2)] },
                { key: 'investimento', className: 'is-neg', celle: [{ v: t('bp.investimentoRiga') }, ...vuota(4), { v: -inv, html: euro(-inv) }, ...vuota(2)] }
              ]}
              totale={[{ v: t('bp.nettoA', { a: fineAnno }) }, { v: '' }, { v: '' }, { v: r.ricavi, html: euro(r.ricavi) }, { v: -r.costiDiretti, html: euro(-r.costiDiretti) },
                { v: r.netto, html: euro(r.netto) }, { v: '' }, { v: '' }]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
