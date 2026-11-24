'use client';

import { scorriA } from '@/lib/ui/scorri';

import { useMemo, useState } from 'react';
import { costoPiattaformaAl, pianoTrimestrale, type VocePiattaforma } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import { euro, perc } from '@/lib/ui/formato';
import { CurvaRecupero } from '@/components/grafici';
import { AreeMargine, RicaviCosti, indiceOggi } from '@/components/bp/GraficiBP';
import { LegendaBP } from '@/components/bp/LegendaBP';
import { TimelineBP } from '@/components/bp/TimelineBP';
import { coloreProgetto } from '@/components/bp/colori';
import { Icona } from '@/components/Icona';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { MenuUtente } from '@/components/utente/MenuUtente';

import type { ProgettoBP } from '@/lib/businessPlan';
export type { ProgettoBP };

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ANNI = 3;
const mi = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

export function VistaBusinessPlan({ investimento, progetti, piattaforma }: {
  investimento: { sviluppo: number; amPrimoAnno: number; mesiSviluppo: string[] }; progetti: ProgettoBP[];
  piattaforma: { dal: string; mese: number; unaTantum: number; voci?: (Omit<VocePiattaforma, 'dal'> & { dal: string })[] };
}) {
  const t = useT();
  const [sel, setSel] = useState<string[]>(() => progetti.map((p) => p.id));
  const [sez, setSez] = useState('bp-sintesi');
  const tutti = useMemo(() => progetti.map((p) => ({ ...p, inizio: new Date(p.inizio) })), [progetti]);
  const inv = investimento.sviluppo + investimento.amPrimoAnno;
  const pf = useMemo(() => ({
    ...piattaforma, dal: new Date(piattaforma.dal),
    voci: piattaforma.voci?.map((v) => ({ ...v, dal: new Date(v.dal) }))
  }), [piattaforma]);
  const oggi = useMemo(() => new Date(), []);
  const da = useMemo(() => {
    const min = tutti.reduce((a, p) => (p.inizio < a ? p.inizio : a), pf.dal < oggi ? pf.dal : oggi);
    return new Date(Date.UTC(min.getUTCFullYear(), 0, 1));
  }, [tutti, pf, oggi]);
  const fineOrizzonte = new Date(Date.UTC(da.getUTCFullYear() + ANNI, 0, 1));
  const finePeriodo = new Date(fineOrizzonte.getTime() - 1);
  const nomeMese = (d: Date) => `${(t('comune.lingua') === 'Language' ? MONTHS : MESI)[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  const colori = useMemo(() => new Map(tutti.map((p, i) => [p.id, coloreProgetto(i)])), [tutti]);
  const scelti = tutti.filter((p) => sel.includes(p.id));
  const piano = useMemo(() => pianoTrimestrale(inv, scelti, da, ANNI * 4, pf), [inv, scelti, da, pf]);
  const pianoTutti = useMemo(() => pianoTrimestrale(inv, tutti, da, ANNI * 4, pf), [inv, tutti, da, pf]);
  const pianoApprovati = useMemo(() => pianoTrimestrale(inv, tutti.filter((p) => !p.inCorso), da, ANNI * 4, pf), [inv, tutti, da, pf]);
  const ultimo = piano.trimestri[piano.trimestri.length - 1];
  const voci = scelti.map((p) => ({ id: p.id, nome: p.cliente, colore: colori.get(p.id)! }));

  const tot = {
    ricavi: ultimo.progetti.reduce((a, x) => a + x.ricaviCum, 0),
    diretti: ultimo.progetti.reduce((a, x) => a + x.costiDirettiCum, 0),
    margine: ultimo.margineCum
  };
  const costiTotali = tot.diretti + ultimo.piattaformaCum + inv;
  const tuttiScelti = sel.length === tutti.length, soloApprovati = tutti.every((p) => sel.includes(p.id) === !p.inCorso);
  const alterna = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const punti = piano.trimestri.map((q) => ({ etichetta: q.etichetta, cumulato: q.netto }));
  const costoPf = costoPiattaformaAl(pf, finePeriodo);

  const SEZ = [
    { id: 'bp-sintesi', k: 'bp.sintesi' as const, ico: 'bp', badge: piano.pareggio ?? '—' },
    { id: 'bp-margini', k: 'bp.margini' as const, ico: 'costi', badge: String(scelti.length) },
    { id: 'bp-ricavi', k: 'bp.ricaviCosti' as const, ico: 'offerte', badge: '' },
    { id: 'bp-curva', k: 'bp.abbattimento' as const, ico: 'bp', badge: '' },
    { id: 'bp-tl', k: 'bp.timeline' as const, ico: 'offerte', badge: '' },
    { id: 'bp-con', k: 'bp.contributi' as const, ico: 'costi', badge: '' }
  ];
  const titolo = (ico: string, k: Parameters<typeof t>[0], tip?: string) => (
    <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={tip}><Icona nome={ico} />{t(k)}</h2>
  );
  const vociBox = voci.map((v) => ({ tipo: 'box' as const, nome: v.nome, colore: v.colore }));
  const oggiTratto = { tipo: 'tratto' as const, nome: t('bp.oggi'), colore: 'var(--accent-azure)' };
  const pareggioTratto = { tipo: 'tratto' as const, nome: t('bp.pareggio'), colore: 'var(--signal-positive)' };
  const mesiSv = investimento.mesiSviluppo.map((m) => { const [a, mm] = m.split('-').map(Number); return new Date(Date.UTC(a, (mm || 1) - 1, 1)); });

  const righe = scelti.map((p) => {
    const r = ultimo.progetti.find((x) => x.id === p.id)!;
    const fine = new Date(Date.UTC(p.inizio.getUTCFullYear(), p.inizio.getUTCMonth() + p.durataMesi - 1, 1));
    const mesiPiano = Math.max(0, Math.min(p.durataMesi, mi(fineOrizzonte) - mi(p.inizio)));
    const periodo = `${nomeMese(p.inizio)} → ${nomeMese(fine)}`;
    return {
      key: p.id,
      celle: [
        { v: p.cliente, html: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: colori.get(p.id) }} />{p.cliente}</span> },
        { v: p.inCorso ? 0 : 1, html: p.inCorso ? t('bp.inCorsoBreve') : t('bp.approvata') },
        { v: p.inizio.getTime(), html: <span title={t('bp.periodoTip', { m: mesiPiano, d: p.durataMesi })}>{periodo}</span> },
        { v: r.ricaviCum, html: euro(r.ricaviCum) },
        { v: r.costiDirettiCum, html: euro(-r.costiDirettiCum) },
        { v: r.margineCum, html: <span title={t('bp.lordoTip', { q: euro(p.quotaPiattaformaAnnua ?? 0), m: euro(p.margineAnnuo) })}>{euro(r.margineCum)}</span> },
        { v: r.ricaviCum ? r.margineCum / r.ricaviCum : 0, html: r.ricaviCum ? perc(r.margineCum / r.ricaviCum) : '—' },
        { v: tot.margine ? r.margineCum / tot.margine : 0, html: tot.margine ? perc(r.margineCum / tot.margine) : '—' }
      ]
    };
  });
  const vuota = (n: number) => Array.from({ length: n }, () => ({ v: '' }));

  return (
    <div className="shell">
      <aside className="subnav" aria-label={t('mon.bp')}>
        <p className="subnav__title">{t('mon.bp')}</p>
        {SEZ.map((s) => (
          <a key={s.id} className="subnav__a" href={`#${s.id}`} aria-current={sez === s.id ? 'true' : undefined}
            onClick={(e) => { e.preventDefault(); setSez(s.id); scorriA(s.id); }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome={s.ico} />{t(s.k)}</span><small>{s.badge}</small>
          </a>
        ))}
        <MenuUtente />
      </aside>
      <main className="content">
        <h1 className="ttl">{t('mon.bp')}</h1>
        <div className="alt-confid"><span className="alt-badge alt-badge--riservato">{t('re.riservato')}</span></div>

        <div className="alt-card" id="bp-sintesi">
          <div className="alt-card__head">
            {titolo('bp', 'bp.perimetro', t('bp.perimetroTip'))}
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
          <div className="alt-kpi alt-kpi--brand alt-kpi--hero">
            <p className="alt-kpi__label">{t('bp.pareggio')}</p>
            <p className="alt-kpi__value">{piano.pareggio ?? t('bp.nonRaggiunto')}</p>
            <span className="alt-kpi__delta alt-kpi__delta--flat" style={{ color: 'var(--accent-azure-pale)' }}>{t('bp.nettoA', { a: fineOrizzonte.getUTCFullYear() - 1 })}: {euro(ultimo.netto)}</span>
          </div>
          <div className="bpkpi__g">
            <div className="alt-kpi alt-kpi--md"><p className="alt-kpi__label">{t('bp.ricavi')}</p><p className="alt-kpi__value">{euro(tot.ricavi)}</p></div>
            <div className="alt-kpi alt-kpi--md"><p className="alt-kpi__label">{t('bp.costi')}</p><p className="alt-kpi__value">{euro(-costiTotali)}</p>
              <span className="alt-kpi__delta alt-kpi__delta--flat">{t('bp.costiDettaglio', { d: euro(tot.diretti), p: euro(ultimo.piattaformaCum), i: euro(inv) })}</span></div>
            <div className="alt-kpi alt-kpi--md"><p className="alt-kpi__label">{t('bp.margineProgetti')}</p><p className="alt-kpi__value">{euro(tot.margine)}</p>
              <span className="alt-kpi__delta alt-kpi__delta--flat">{t('bp.margineDettaglio', { p: tot.ricavi ? perc(tot.margine / tot.ricavi) : '—' })}</span></div>
            <div className="alt-kpi alt-kpi--md"><p className="alt-kpi__label">{t('bp.netto')}</p>
              <p className="alt-kpi__value" style={{ color: ultimo.netto >= 0 ? 'var(--signal-positive)' : 'var(--signal-negative)' }}>{euro(ultimo.netto)}</p>
              <span className="alt-kpi__delta alt-kpi__delta--flat">{t('bp.nettoDettaglio')}</span></div>
          </div>
        </div>

        <div className="alt-card" id="bp-margini">
          <div className="alt-card__head">{titolo('costi', 'bp.margini')}</div>
          <div className="alt-card__body">
            <AreeMargine piano={piano} progetti={voci} etichetta={t('bp.margini')} oggi={oggi} />
            <LegendaBP voci={[{ tipo: 'titolo', nome: t('bp.legMargine') }, ...vociBox,
              { tipo: 'box', nome: t('bp.investimentoRiga'), colore: 'var(--line-strong)', opacita: 0.5 }, { tipo: 'box', nome: t('bp.costiPiattaforma'), colore: 'var(--signal-negative)', opacita: 0.4 },
              { tipo: 'linea', nome: t('bp.nettoLinea'), colore: 'var(--ink-primary)' }, pareggioTratto, oggiTratto]} />
          </div>
        </div>

        <div className="alt-card" id="bp-ricavi">
          <div className="alt-card__head">{titolo('offerte', 'bp.ricaviCosti')}</div>
          <div className="alt-card__body">
            <RicaviCosti piano={piano} progetti={voci} etichetta={t('bp.ricaviCosti')} oggi={oggi} />
            <LegendaBP voci={[{ tipo: 'titolo', nome: t('bp.legRicavi') }, ...vociBox,
              { tipo: 'titolo', nome: t('bp.legCosti') }, { tipo: 'box', nome: t('bp.costiDiretti'), colore: 'var(--ink-muted)' }, { tipo: 'box', nome: t('bp.costiPiattaforma'), colore: 'var(--signal-negative)' }, oggiTratto]} />
          </div>
        </div>

        <div className="alt-card" id="bp-curva">
          <div className="alt-card__head">{titolo('bp', 'bp.curvaTit')}</div>
          <div className="alt-card__body">
            <CurvaRecupero punti={punti} pareggio={piano.pareggio} etichetta={t('bp.curvaTit')} oggi={indiceOggi(piano, oggi)} />
            <LegendaBP voci={[{ tipo: 'linea', nome: t('bp.nettoLinea'), colore: 'var(--accent-azure)' },
              { tipo: 'box', nome: t('bp.legSopra'), colore: 'var(--signal-positive-soft)' }, { tipo: 'box', nome: t('bp.legSotto'), colore: 'var(--signal-negative-soft)' },
              pareggioTratto, oggiTratto]} />
          </div>
        </div>

        <div className="alt-card" id="bp-tl">
          <div className="alt-card__head">{titolo('offerte', 'bp.timeline', t('bp.tlTip'))}</div>
          <div className="alt-card__body">
            <TimelineBP
              progetti={scelti.map((p) => ({ id: p.id, cliente: p.cliente, inizio: p.inizio, durataMesi: p.durataMesi, inCorso: p.inCorso, colore: colori.get(p.id)!, licenzaAnnua: p.licenzaAnnua }))}
              servizi={(pf.voci ?? []).map((v) => ({ id: v.id, dal: v.dal }))} sviluppo={mesiSv}
              da={da} anni={ANNI} pareggioIndice={piano.indicePareggio} pareggioEtichetta={piano.pareggio} oggi={oggi} nomeMese={nomeMese} />
            <LegendaBP voci={[{ tipo: 'tratto', nome: t('bp.legAvvioProgetto'), colore: 'var(--ink-secondary)' }, { tipo: 'tratto', nome: t('bp.legAvvioCosto'), colore: 'var(--signal-negative)' }, pareggioTratto, oggiTratto]} />
          </div>
        </div>

        <div className="alt-card" id="bp-con">
          <div className="alt-card__head">{titolo('costi', 'bp.contributo', t('bp.tabellaTip', { a: fineOrizzonte.getUTCFullYear() - 1 }))}</div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('bp.progetto') }, { nome: t('bp.stato') }, { nome: t('bp.periodo') }, { nome: t('bp.ricavi'), num: true }, { nome: t('bp.costiDiretti'), num: true },
                { nome: t('bp.margine'), num: true }, { nome: t('bp.margPerc'), num: true }, { nome: t('bp.quota'), num: true }]}
              righe={[
                ...righe,
                { key: 'piattaforma', className: 'is-neg',
                  celle: [{ v: t('bp.costiPiattaforma'), html: <span title={t('bp.costiPiattaformaTip', { d: nomeMese(pf.dal) })}>{t('bp.costiPiattaforma')}</span> }, ...vuota(4),
                    { v: -ultimo.piattaformaCum, html: euro(-ultimo.piattaformaCum) }, ...vuota(2)] },
                { key: 'investimento', className: 'is-neg',
                  celle: [{ v: t('bp.investimentoRiga') }, ...vuota(4), { v: -inv, html: euro(-inv) }, ...vuota(2)] }
              ]}
              totale={[{ v: t('bp.nettoA', { a: fineOrizzonte.getUTCFullYear() - 1 }) }, { v: '' }, { v: '' },
                { v: tot.ricavi, html: euro(tot.ricavi) }, { v: -tot.diretti, html: euro(-tot.diretti) }, { v: ultimo.netto, html: euro(ultimo.netto) }, { v: '' }, { v: '' }]}
            />
          </div>
        </div>
      </main>
      <aside className="rail" aria-label={t('bp.inv')}>
        <div className="rail__card rail__card--brand"><p className="rail__h">{t('bp.inv')}</p>
          <div className="rail__stat"><span>{t('bp.sviluppo')}</span><b>{euro(investimento.sviluppo)}</b></div>
          <div className="rail__stat"><span>{t('bp.amPrimo')}</span><b>{euro(investimento.amPrimoAnno)}</b></div>
          <div className="rail__stat"><span>{t('bp.daRecuperare')}</span><b>{euro(inv)}</b></div>
        </div>
        <div className="rail__card"><p className="rail__h">{t('bp.costiPiattaforma')}</p>
          <div className="rail__stat"><span>{t('bp.attivaDal')}</span><b>{nomeMese(pf.dal)}</b></div>
          <div className="rail__stat"><span>{t('bp.alMese')}</span><b>{euro(pf.mese)}</b></div>
          <div className="rail__stat"><span>{t('bp.finoAOggi')}</span><b>{euro(costoPiattaformaAl(pf, oggi))}</b></div>
          <div className="rail__stat"><span>{t('bp.nettoA', { a: fineOrizzonte.getUTCFullYear() - 1 })}</span><b>{euro(-costoPf)}</b></div>
        </div>
        <div className="rail__card"><p className="rail__h">{t('bp.confronto')}</p>
          <div className="rail__stat"><span>{t('bp.selezione')}</span><b>{piano.pareggio ?? t('bp.nonRaggiunto')}</b></div>
          <div className="rail__stat"><span>{t('bp.tutti')}</span><b>{pianoTutti.pareggio ?? t('bp.nonRaggiunto')}</b></div>
          <div className="rail__stat"><span>{t('bp.soloApprovati')}</span><b>{pianoApprovati.pareggio ?? t('bp.nonRaggiunto')}</b></div>
        </div>
      </aside>
    </div>
  );
}
