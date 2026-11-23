import type { Offerta, StatoValore } from './types';
import { calcola, moduliAttivi } from './calcola';
import { architetturaCliente } from './architettura';
import type { Config } from './types';

/* Stato dei valori (design v2 §4). Nessuna fase è bloccata: ogni valore esiste e dichiara
   quanto ci si può fidare di lui. Il blocco sta sull'approvazione. */

export type Fase = 'assessment' | 'soluzione' | 'stima' | 'prezzo' | 'resoconto';

export const FASI: { id: Fase; nome: string }[] = [
  { id: 'assessment', nome: 'Assessment' },
  { id: 'soluzione', nome: 'Soluzione' },
  { id: 'stima', nome: 'Stima' },
  { id: 'prezzo', nome: 'Prezzo' },
  { id: 'resoconto', nome: 'Resoconto' }
];

/** Percorsi dei valori che contano per l'avanzamento di ogni fase. */
export function campiFase(o: Offerta, fase: Fase): string[] {
  switch (fase) {
    case 'assessment':
      return ['assessment.moduli', 'assessment.volumeAnnuo', 'assessment.crescita', 'assessment.documentiPerPratica', 'vincoli'];
    case 'soluzione':
      return ['approccio', 'soluzione.connettori', 'soluzione.integrazioni',
        ...(o.approccio !== 'saas' ? ['soluzione.cicd', 'leve.aiOnPremise', 'leve.manutenzioneOnPremise'] : [])];
    case 'stima':
      return [...o.stima.base.map((b) => `stima.base.${b.id}`), 'stima.custom', 'stima.quote', 'stima.messa'];
    case 'prezzo':
      return ['prezzo.margineVenduto', 'prezzo.scaglioni', 'prezzo.metrica',
        ...(o.approccio !== 'on_premise' ? ['leve.canoneSaas'] : []),
        ...(o.approccio !== 'saas' ? ['leve.softwareOnPremise'] : [])];
    case 'resoconto':
      return (['assessment', 'soluzione', 'stima', 'prezzo'] as Fase[]).flatMap((f) => campiFase(o, f));
  }
}

/** Voci critiche: assunte, impediscono l'approvazione. */
export function campiCritici(o: Offerta): string[] {
  return ['assessment.volumeAnnuo', 'prezzo.metrica', 'prezzo.scaglioni',
    ...(o.approccio !== 'saas' ? ['leve.aiOnPremise', 'soluzione.cicd'] : [])];
}

export function stato(stati: Record<string, StatoValore>, campo: string): StatoValore {
  return stati[campo] ?? 'assunto';
}

/** Quota di valori non più assunti, 0–100. */
export function avanzamento(o: Offerta, stati: Record<string, StatoValore>, fase: Fase): number {
  const c = campiFase(o, fase);
  if (!c.length) return 100;
  return Math.round((c.filter((k) => stato(stati, k) !== 'assunto').length / c.length) * 100);
}

export function bloccanti(o: Offerta, stati: Record<string, StatoValore>): string[] {
  return campiCritici(o).filter((k) => stato(stati, k) === 'assunto');
}

const QUOTE_PIATTAFORMA = ['reevo', 'n8n', 'ams', 'supp'];

/** Sintesi salvata in offerte.sintesi: alimenta elenco offerte e business plan. */
export function sintesi(cfg: Config, o: Offerta, stati: Record<string, StatoValore>) {
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
    onPremise: s(r.onPremise),
    avanzamento: avanzamento(o, stati, 'resoconto'),
    bloccanti: bloccanti(o, stati).length
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
    { voce: 'Licenza annuale', importo: x.licenza.totale, ricorrente: true, nota: note.join(' · ') || undefined }
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
