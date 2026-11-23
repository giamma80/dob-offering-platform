'use client';

import {
  composizioneMargine, composizioneRicavo, sensibilitaClienti, serieMensile,
  type Config, type Offerta, type Risultato, type Scenario
} from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';
import { euro, numero, perc } from '@/lib/ui/formato';
import { AnelloGrande, AreaCumulata, BarraComposizione, CardVista, Legenda, type Scen } from '@/components/grafici';
import { Icona } from '@/components/Icona';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';

const COL = { brand: 'var(--surface-brand)', azure: 'var(--accent-azure)', pale: 'var(--accent-azure-mid)', grigio: 'var(--line-strong)', verde: 'var(--signal-positive)' };

type Props = { cfg: Config; o: Offerta; r: Risultato; definito: number; critici: string[] };

function scenariAttivi(r: Risultato): Scen[] {
  const s: Scen[] = [];
  if (r.saas.attivo) s.push('saas');
  if (r.onPremise.attivo) s.push('on_premise');
  if (s.length === 2) s.push('confronto');
  return s;
}

/* ---------------------------------------------------------------- Sintesi */
export function Sintesi({ r, definito, critici, inviaApprovazione }: Props & { inviaApprovazione?: React.ReactNode }) {
  const t = useT();
  const sc = (x: Scen): Scenario => (x === 'on_premise' ? r.onPremise : r.saas);
  const extra = r.vincoliUnaTantum;
  const ricavo = (s: Scenario) => {
    const serie = serieMensile(s, extra);
    return (
      <>
        <AreaCumulata etichetta={t('re.ricavo36')} etichettaCosti={t('gr.costi')}
          livelli={[
            { colore: COL.brand, nome: t('gr.setupCustom'), valori: serie.map((p) => p.unaTantum) },
            { colore: COL.azure, nome: t('re.licenza'), valori: serie.map((p) => p.licenza) },
            { colore: COL.pale, nome: t('gr.extra'), valori: serie.map((p) => p.extra) }
          ]}
          costo={serie.map((p) => p.costo)} />
        <Legenda voci={[
          { colore: COL.brand, nome: t('gr.setupCustom'), valore: euro(serie[0].unaTantum) },
          { colore: COL.azure, nome: t('re.licenza'), valore: euro(serie[36].licenza) },
          { colore: COL.pale, nome: t('gr.extra'), valore: euro(serie[36].extra) },
          { colore: '', nome: t('gr.costi'), valore: euro(serie[36].costo), tratteggio: true }
        ]} />
      </>
    );
  };
  const barre = (s: Scenario) => {
    const c = composizioneRicavo(s, extra);
    const nomi: Record<string, Chiave> = { custom: 're.custom', setup: 're.setup', licenza: 'gr.licenza3', extra: 'gr.extra' };
    const cls: Record<string, string> = { custom: 's2', setup: 's1', licenza: 's3', extra: 's4' };
    return <BarraComposizione etichetta={t('re.ricavo36')} parti={c.map((f) => ({ cls: cls[f.id], nome: t(nomi[f.id]), valore: f.valore }))} />;
  };
  return (
    <>
      <div className="alt-card stato-appr">
        <div className="stato-appr__r">
          <AnelloGrande pct={definito} />
          <div><div className="stato-appr__n">{definito}%</div><div className="stato-appr__l">{t('fase.definitoBreve')}</div></div>
        </div>
        <div className="stato-appr__c">
          {critici.map((c) => <span key={c} className="alt-badge alt-badge--aperto">{t(`crit.${c}` as Chiave)}</span>)}
        </div>
        <div style={{ marginLeft: 'auto' }}>{inviaApprovazione}</div>
      </div>
      <CardVista id="r-area" titolo={t('re.ricavo36')} icona={<Icona nome="sintesi" />} scenari={scenariAttivi(r)}
        render={(x, vista) => x === 'confronto'
          ? <div className="confronto">{(['saas', 'on_premise'] as const).map((k) => (
              <div key={k}><h3 className="alt-card__title" style={{ marginBottom: 6 }}>{t(`approccio.${k}` as Chiave)}</h3>{vista === 'area' ? ricavo(sc(k)) : barre(sc(k))}</div>
            ))}</div>
          : vista === 'area' ? ricavo(sc(x)) : barre(sc(x))} />
      <div className="alt-card" id="r-anno">
        <div className="alt-card__head"><h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome="costi" />{t('re.primoAnnoTit')}</h2></div>
        <div className="alt-card__body">
          <table className="alt-table">
            <thead><tr><th>{t('st.voce')}</th>{r.saas.attivo && <th className="is-num">SaaS</th>}{r.onPremise.attivo && <th className="is-num">On-premise</th>}</tr></thead>
            <tbody>
              {([['re.setup', (x: Scenario) => x.setup.prezzo], ['re.custom', (x: Scenario) => x.customizzazione.prezzo],
                ['re.licenza', (x: Scenario) => x.licenza.totale]] as const).map(([k, f]) => (
                <tr key={k}><td>{t(k)}</td>
                  {r.saas.attivo && <td className="is-num">{euro(f(r.saas))}</td>}
                  {r.onPremise.attivo && <td className="is-num">{euro(f(r.onPremise))}</td>}</tr>
              ))}
            </tbody>
            <tfoot><tr className="is-total"><td>{t('re.primoAnno')}</td>
              {r.saas.attivo && <td className="is-num">{euro(r.saas.primoAnno.prezzo)}</td>}
              {r.onPremise.attivo && <td className="is-num">{euro(r.onPremise.primoAnno.prezzo)}</td>}</tr></tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

export function RailSintesi({ r, o, cfg }: Props) {
  const t = useT();
  const tre = (s: Scenario) => composizioneRicavo(s, r.vincoliUnaTantum).reduce((a, f) => a + f.valore, 0);
  const marg = (s: Scenario) => { const c = composizioneMargine(s, r.vincoliUnaTantum); const tot = c.reduce((a, f) => a + f.valore, 0); return tot ? c[2].valore / tot : 0; };
  const attivi = cfg.vincoli.filter((v) => o.vincoli[v.id]).length;
  return (
    <>
      <div className="rail__card rail__card--brand"><p className="rail__h">{t('re.treAnni')}</p>
        {r.saas.attivo && <div className="rail__stat"><span>SaaS</span><b>{euro(tre(r.saas))}</b></div>}
        {r.onPremise.attivo && <div className="rail__stat"><span>On-premise</span><b>{euro(tre(r.onPremise))}</b></div>}
        {r.saas.attivo && r.onPremise.attivo && <div className="rail__stat"><span>{t('re.differenza')}</span><b>{euro(tre(r.onPremise) - tre(r.saas))}</b></div>}
      </div>
      <div className="rail__card"><p className="rail__h">{t('re.margine')}</p>
        {r.saas.attivo && <div className="rail__stat"><span>SaaS</span><b>{perc(marg(r.saas))}</b></div>}
        {r.onPremise.attivo && <div className="rail__stat"><span>On-premise</span><b>{perc(marg(r.onPremise))}</b></div>}
      </div>
      <div className="rail__card"><p className="rail__h">{t('as.vincoli')}</p>
        <div className="rail__stat"><span>{t('re.vincoliAttivi')}</span><b>{attivi}</b></div>
        <div className="rail__stat"><span>{t('re.vincoliSpenti')}</span><b>{cfg.vincoli.length - attivi}</b></div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- Sostenibilità */
export function Sostenibilita({ cfg, o, r }: Props) {
  const t = useT();
  const sc = (x: Scen): Scenario => (x === 'on_premise' ? r.onPremise : r.saas);
  const extra = r.vincoliUnaTantum;
  const area = (s: Scenario) => {
    const serie = serieMensile(s, extra);
    const ult = serie[36];
    return (
      <>
        <AreaCumulata etichetta={t('re.costiMargine36')}
          livelli={[
            { colore: COL.grigio, nome: t('gr.costi'), valori: serie.map((p) => p.costo) },
            { colore: COL.verde, nome: t('re.margine'), valori: serie.map((p) => Math.max(0, p.margine)) }
          ]} />
        <Legenda voci={[
          { colore: COL.grigio, nome: t('gr.costi'), valore: euro(ult.costo), nota: perc(ult.ricavo ? ult.costo / ult.ricavo : 0) },
          { colore: COL.verde, nome: t('re.margine'), valore: euro(ult.margine), nota: perc(ult.ricavo ? ult.margine / ult.ricavo : 0) }
        ]} />
      </>
    );
  };
  const barre = (s: Scenario) => {
    const c = composizioneMargine(s, extra);
    const nomi: Record<string, Chiave> = { giornate: 'gr.giornateCosto', ricorrenti: 'gr.ricorrenti3', margine: 're.margine' };
    const cls: Record<string, string> = { giornate: 's2', ricorrenti: 's3', margine: 'sm' };
    return <BarraComposizione etichetta={t('re.costiMargine36')} parti={c.map((f) => ({ cls: cls[f.id], nome: t(nomi[f.id]), valore: f.valore }))} />;
  };
  const n = cfg.costiCondivisi.clientiAttivi + 1;
  const divisori = Array.from(new Set([1, 3, n, n + 3])).sort((a, b) => a - b);
  const sens = sensibilitaClienti(cfg, o, divisori);
  return (
    <>
      <div className="alt-confid"><span className="alt-badge alt-badge--riservato">{t('re.riservato')}</span></div>
      <CardVista id="x-area" titolo={t('re.costiMargine36')} icona={<Icona nome="sostenib" />} scenari={scenariAttivi(r)}
        render={(x, vista) => x === 'confronto'
          ? <div className="confronto">{(['saas', 'on_premise'] as const).map((k) => (
              <div key={k}><h3 className="alt-card__title" style={{ marginBottom: 6 }}>{t(`approccio.${k}` as Chiave)}</h3>{vista === 'area' ? area(sc(k)) : barre(sc(k))}</div>
            ))}</div>
          : vista === 'area' ? area(sc(x)) : barre(sc(x))} />
      {r.saas.attivo && (
        <div className="alt-card" id="x-sens">
          <div className="alt-card__head"><h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome="figure" />{t('re.sensibilita')}</h2></div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('re.clienti'), num: true }, { nome: t('re.quotaRic'), num: true }, { nome: t('bp.margineAnnuo'), num: true }]}
              righe={sens.map((s) => ({
                key: String(s.divisore), className: s.divisore === n ? 'is-sub' : undefined,
                celle: [
                  { v: s.divisore, html: s.divisore === n ? t('re.attuale', { n: s.divisore }) : numero(s.divisore) },
                  { v: s.quotaRicorrente, html: euro(s.quotaRicorrente) },
                  { v: s.margineAnnuo, html: euro(s.margineAnnuo) }
                ]
              }))}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function RailSostenibilita({ r }: Props) {
  const t = useT();
  const v = (id: string) => r.onPremise.ricorrenti.find((x) => x.id === id)?.costo ?? 0;
  return (
    <>
      <div className="rail__card rail__card--brand"><p className="rail__h">{t('re.ricorrentiAnnui')}</p>
        {r.saas.attivo && <div className="rail__stat"><span>SaaS</span><b>{euro(r.saas.costoRicorrente)}</b></div>}
        {r.onPremise.attivo && <div className="rail__stat"><span>On-premise</span><b>{euro(r.onPremise.costoRicorrente)}</b></div>}
      </div>
      {r.onPremise.attivo && (
        <div className="rail__card"><p className="rail__h">On-premise</p>
          <div className="rail__stat"><span>{t('so.manutenzione')}</span><b>{euro(v('manutenzione'))}</b></div>
          <div className="rail__stat"><span>{t('par.aiTitolo')}</span><b>{euro(v('ai'))}</b></div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Dettaglio costi */
export function DettaglioCosti({ r }: Props) {
  const t = useT();
  const tabella = (k: 'saas' | 'on_premise', s: Scenario) => {
    const vincoliRic = s.ricorrenti.filter((x) => ['normativo', 'kpi', 'audit'].includes(x.id)).reduce((a, x) => a + x.costo, 0);
    const extra = r.vincoliUnaTantum;
    const righe = [
      { id: 'custom', nome: t('re.custom'), gg: s.customizzazione.gg, costo: s.customizzazione.costo, prezzo: s.customizzazione.prezzo },
      { id: 'setup', nome: t('re.setup'), gg: s.setup.gg, costo: s.setup.costo, prezzo: s.setup.prezzo },
      { id: 'lic', nome: t('gr.licenza3'), gg: null, costo: (s.costoRicorrente - vincoliRic) * 3, prezzo: s.licenza.totale * 3 },
      { id: 'vinc', nome: t('re.vincoliRic3'), gg: null, costo: vincoliRic * 3, prezzo: null },
      ...extra.map((e) => ({ id: e.id, nome: e.nome, gg: e.gg, costo: e.costo, prezzo: e.prezzo }))
    ];
    const tot = { gg: righe.reduce((a, x) => a + (x.gg ?? 0), 0), costo: righe.reduce((a, x) => a + x.costo, 0), prezzo: righe.reduce((a, x) => a + (x.prezzo ?? 0), 0) };
    const m = (p: number | null, c: number) => (p ? perc((p - c) / p) : '—');
    return (
      <div className="alt-card" id={`d-${k}`} key={k}>
        <div className="alt-card__head"><h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome="costi" />{k === 'saas' ? 'A · SaaS' : 'B · On-premise'}</h2></div>
        <div className="alt-card__body">
          <TabellaOrdinabile
            colonne={[{ nome: t('st.voce') }, { nome: t('st.giornate'), num: true }, { nome: t('pr.costo'), num: true }, { nome: t('pr.prezzo'), num: true }, { nome: t('re.margine'), num: true }]}
            righe={righe.map((x) => ({
              key: x.id,
              celle: [{ v: x.nome }, { v: x.gg ?? -1, html: x.gg === null ? '—' : numero(x.gg) }, { v: x.costo, html: euro(x.costo) },
                { v: x.prezzo ?? -1, html: x.prezzo === null ? '—' : euro(x.prezzo) }, { v: x.prezzo ? (x.prezzo - x.costo) / x.prezzo : -1, html: m(x.prezzo, x.costo) }]
            }))}
            totale={[{ v: t('comune.totale') }, { v: tot.gg, html: numero(tot.gg) }, { v: tot.costo, html: euro(tot.costo) }, { v: tot.prezzo, html: euro(tot.prezzo) }, { v: 0, html: m(tot.prezzo, tot.costo) }]}
          />
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="alt-confid"><span className="alt-badge alt-badge--riservato">{t('re.riservato')}</span></div>
      {r.saas.attivo && tabella('saas', r.saas)}
      {r.onPremise.attivo && tabella('on_premise', r.onPremise)}
    </>
  );
}

export function RailDettaglio({ r }: Props) {
  const t = useT();
  return r.saas.attivo ? (
    <div className="rail__card rail__card--brand" title={t('re.reevoTip')}><p className="rail__h">{t('re.setupSaas')}</p>
      <div className="rail__stat"><span>{t('re.margine')}</span><b>{perc(r.saas.setup.prezzo ? (r.saas.setup.prezzo - r.saas.setup.costo) / r.saas.setup.prezzo : 0)}</b></div>
    </div>
  ) : null;
}
