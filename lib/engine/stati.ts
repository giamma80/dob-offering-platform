import type { Offerta } from './types';
import { calcola, moduliAttivi } from './calcola';
import { architetturaCliente } from './architettura';
import type { Config } from './types';

/* Fasi dell'offerta. Nessun controllo di completezza: l'invio in approvazione è libero. */

export type Fase = 'assessment' | 'soluzione' | 'stima' | 'prezzo' | 'resoconto';

export const FASI: { id: Fase; nome: string }[] = [
  { id: 'assessment', nome: 'Assessment' },
  { id: 'soluzione', nome: 'Soluzione' },
  { id: 'stima', nome: 'Stima' },
  { id: 'prezzo', nome: 'Prezzo' },
  { id: 'resoconto', nome: 'Resoconto' }
];

const QUOTE_PIATTAFORMA = ['reevo', 'n8n', 'ams', 'supp'];

/** Sintesi salvata in offerte.sintesi: alimenta elenco offerte e business plan. */
export function sintesi(cfg: Config, o: Offerta) {
  const r = calcola(cfg, o);
  const s = (x: typeof r.saas) => x.attivo ? {
    setup: x.setup.prezzo, customizzazione: x.customizzazione.prezzo, licenza: x.licenza.totale,
    primoAnno: x.primoAnno.prezzo, margineAnnuo: x.annuo.margine, marginePrimoAnno: x.primoAnno.margine,
    /* quota dei costi di piattaforma già nel margine: il business plan la riaggiunge */
    quotaPiattaformaAnnua: x.ricorrenti.filter((v) => QUOTE_PIATTAFORMA.includes(v.id)).reduce((a, v) => a + v.costo, 0),
    quotaPiattaformaUnaTantum: x.setup.reevoServizi
  } : null;
  return {
    saas: s(r.saas),
    onPremise: s(r.onPremise)
  };
}

/* ------------------------------------------------------------- specchietto
   Si genera dal dettaglio e contiene SOLO ciò che il cliente può vedere: nessuna giornata,
   nessun costo, nessun margine, nessun fornitore terzo. È l'unica funzione che l'export usa. */
export interface Specchietto {
  cliente: string;
  scenario: 'saas' | 'on_premise';
  /** voci principali con le sottovoci mostrabili al cliente: solo importi, niente giornate, costi o fornitori */
  righe: { id: 'messa' | 'infra' | 'canone'; voce: string; importo: number; ricorrente: boolean; nota?: string;
    sottovoci: { id: string; voce?: string; importo: number }[] }[];
  totalePrimoAnno: number;
  extra: { voce: string; importo: number }[];
  /** moduli DOB inclusi: è tutto ciò che il cliente ha scelto */
  moduli: string[];
  light: boolean;
  /** grafico dell'architettura: solo caselle accese o spente */
  architettura: ReturnType<typeof architetturaCliente>;
}

export function specchietto(cfg: Config, o: Offerta, sc: 'saas' | 'on_premise'): Specchietto {
  const r = calcola(cfg, o);
  const x = sc === 'saas' ? r.saas : r.onPremise;
  const note = cfg.vincoli.filter((v) => o.vincoli[v.id] && v.specchietto && v.effetto.tipo === 'ricorrente_fisso')
    .map((v) => v.specchietto as string);
  /* sottovoci: id traducibili; `voce` solo per nomi propri che il cliente conosce (il suo target CI/CD) */
  const base = x.setup.righe.filter((v) => !x.setup.infrastruttura.includes(v));
  const custom = (g: string) => x.customizzazione.righe.filter((v) => (v.gruppo ?? 'catalogo') === g).reduce((a, v) => a + v.prezzo, 0);
  const quote = [...x.setup.quote, ...x.customizzazione.quote];
  const nonZero = <T extends { importo: number }>(xs: T[]) => xs.filter((y) => Math.abs(y.importo) > 0.004);
  const infraRighe = x.setup.infrastruttura.map((v, i) => ({
    id: v.id === 'ambienti-saas' ? 'ambienti' : 'adeguamento',
    voce: v.id === 'ambienti-saas' ? undefined : v.nome.replace(/^Adeguamento\s+/, ''),
    /* la quota dei servizi di piattaforma una tantum sta nella prima voce, senza nominarla */
    importo: v.prezzo + (i === 0 ? x.infrastruttura.prezzo - x.setup.infrastruttura.reduce((a, y) => a + y.prezzo, 0) : 0)
  }));
  const righe: Specchietto['righe'] = [
    { id: 'messa', voce: 'Messa in opera', importo: x.messaInOpera.prezzo, ricorrente: false, sottovoci: nonZero([
      { id: 'base', importo: base.reduce((a, v) => a + v.prezzo, 0) },
      { id: 'integrazioni', importo: custom('integrazioni') },
      { id: 'catalogo', importo: custom('catalogo') },
      { id: 'moduli', importo: custom('moduli') },
      { id: 'stima', importo: custom('stima') },
      { id: 'parametriche', importo: quote.reduce((a, v) => a + v.prezzo, 0) }
    ]) },
    { id: 'infra', voce: 'Adeguamento infrastruttura', importo: x.infrastruttura.prezzo, ricorrente: false, sottovoci: nonZero(infraRighe) },
    { id: 'canone', voce: 'Canone annuo', importo: x.licenza.totale, ricorrente: true, nota: note.join(' · ') || undefined, sottovoci: nonZero([
      { id: 'software', importo: x.licenza.software },
      { id: 'consumo', importo: x.licenza.consumo },
      { id: 'manutenzione', importo: x.licenza.manutenzione },
      { id: 'ai', importo: x.licenza.aiRifatturata }
    ]) }
  ].filter((rr) => rr.id !== 'infra' || Math.abs(rr.importo) > 0.004) as Specchietto['righe'];
  return {
    cliente: o.cliente,
    scenario: sc,
    righe,
    totalePrimoAnno: righe.reduce((a, rr) => a + rr.importo, 0),
    extra: r.vincoliUnaTantum.map((u) => ({ voce: u.nome, importo: u.prezzo })),
    moduli: (cfg.moduli ?? []).filter((m) => moduliAttivi(cfg, o).includes(m.id)).map((m) => m.nome),
    light: !!o.assessment.light,
    architettura: architetturaCliente(cfg, o)
  };
}
