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
  righe: { voce: string; importo: number; ricorrente: boolean; nota?: string }[];
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
  const righe = [
    { voce: 'Setup e impianto', importo: x.setup.prezzo, ricorrente: false },
    { voce: 'Customizzazione', importo: x.customizzazione.prezzo, ricorrente: false },
    { voce: 'Canone annuo', importo: x.licenza.totale, ricorrente: true, nota: note.join(' · ') || undefined }
  ];
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
