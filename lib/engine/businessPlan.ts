/* Recupero dell'investimento di piattaforma (design v2 §9).
   Ogni progetto contribuisce dal mese di avvio: la parte una tantum del margine all'avvio,
   poi il margine ricorrente mese per mese per la durata del contratto.
   I costi di piattaforma (ReeVo, n8n, AMS, supporto) sono una riga a sé: escono per intero ogni mese
   dall'attivazione, qualunque sia il numero di clienti. Per non contarli due volte, il contributo
   dei progetti è al lordo della quota condivisa che il prezzo divide per N + 1. */

import type { Config } from './types';

export interface Progetto {
  id: string;
  cliente: string;
  inizio: Date;
  margineAnnuo: number;
  marginePrimoAnno: number;   // include la parte una tantum
  licenzaAnnua: number;
  /** prezzo del primo anno (include la parte una tantum): serve a ricavare i ricavi */
  prezzoPrimoAnno?: number;
  durataMesi: number;
  inCorso: boolean;           // offerta non ancora approvata
  /** quota dei costi condivisi già sottratta dal margine (÷ N + 1): si riaggiunge */
  quotaPiattaformaAnnua?: number;
  quotaPiattaformaUnaTantum?: number;
}

/** Una voce dei costi di piattaforma con il suo mese di partenza. */
export interface VocePiattaforma { id: 'reevo' | 'n8n' | 'ams'; dal: Date; mese: number; unaTantum: number }

/** Costi di piattaforma per il business plan: una tantum all'attivazione, poi un importo al mese.
   `dal` è la prima partenza, `mese` il totale a regime; `voci` dà la partenza di ciascun servizio. */
export interface CostiPiattaforma { dal: Date; mese: number; unaTantum: number; voci?: VocePiattaforma[] }

const dataMese = (aaaaMm: string) => {
  const [a, m] = aaaaMm.split('-').map(Number);
  return new Date(Date.UTC(a, (m || 1) - 1, 1));
};

/** Costi di sistema letti dalla configurazione, con i ripieghi per le versioni storiche
   (senza registro: lo sviluppo è l'unico numero di `investimento`; senza mesi propri: tutto parte da `attivaDal`). */
export function costiSistema(cfg: Config) {
  const attiva = cfg.piattaforma?.attivaDal ?? '2026-07';
  const cs = cfg.costiSistema;
  return {
    sviluppo: cs?.sviluppo ?? [{ id: 'sv-0', mese: attiva, importo: cfg.investimento.sviluppo, nota: '' }],
    reevoDal: cs?.reevoDal ?? attiva,
    n8nDal: cs?.n8nDal ?? attiva,
    amsDal: attiva
  };
}

/** Sviluppo da recuperare: somma del registro. */
export function sviluppoTotale(cfg: Config): number {
  return costiSistema(cfg).sviluppo.reduce((a, v) => a + v.importo, 0);
}

/** Costi di piattaforma interi dalla configurazione (non divisi per i clienti), ciascun servizio dal suo mese. */
export function costiPiattaforma(cfg: Config): CostiPiattaforma {
  const cc = cfg.costiCondivisi;
  const cs = costiSistema(cfg);
  const voci: VocePiattaforma[] = [
    { id: 'reevo', dal: dataMese(cs.reevoDal), mese: cc.reevo.reduce((x, r) => x + r.mese, 0), unaTantum: cc.reevoServiziUnaTantum },
    { id: 'n8n', dal: dataMese(cs.n8nDal), mese: cc.n8nOcrMese, unaTantum: 0 },
    { id: 'ams', dal: dataMese(cs.amsDal), mese: cc.amsSaasAnno / 12 + cc.supportoAnno / 12, unaTantum: 0 }
  ];
  return {
    dal: new Date(Math.min(...voci.map((v) => v.dal.getTime()))),
    mese: voci.reduce((x, v) => x + v.mese, 0),
    unaTantum: cc.reevoServiziUnaTantum,
    voci
  };
}

/** Quota condivisa che il prezzo di un'offerta SaaS attribuisce al progetto (÷ N + 1). */
export function quotaPiattaforma(cfg: Config): { annua: number; unaTantum: number } {
  const cc = cfg.costiCondivisi;
  const n = Math.max(1, cc.clientiAttivi + 1);
  return {
    annua: (cc.reevo.reduce((x, r) => x + r.mese, 0) * 12 + cc.n8nOcrMese * 12 + cc.amsSaasAnno + cc.supportoAnno) / n,
    unaTantum: cc.reevoServiziUnaTantum / n
  };
}

/** Costi di piattaforma cumulati fino al mese di `fine` compreso. */
export function costoPiattaformaAl(c: CostiPiattaforma, fine: Date): number {
  const voci = c.voci ?? [{ dal: c.dal, mese: c.mese, unaTantum: c.unaTantum }];
  return voci.reduce((a, v) => {
    const mesi = meseIndice(fine) - meseIndice(v.dal) + 1;
    return a + (mesi <= 0 ? 0 : v.unaTantum + v.mese * mesi);
  }, 0);
}

export interface PuntoTrimestre { etichetta: string; cumulato: number }

const meseIndice = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();


export function contributoAl(p: Progetto, fine: Date): number {
  const mesi = Math.min(p.durataMesi, meseIndice(fine) - meseIndice(p.inizio) + 1);
  if (mesi <= 0) return 0;
  const annuo = p.margineAnnuo + (p.quotaPiattaformaAnnua ?? 0);
  const unaTantum = Math.max(0, p.marginePrimoAnno - p.margineAnnuo) + (p.quotaPiattaformaUnaTantum ?? 0);
  return unaTantum + (annuo * mesi) / 12;
}

/** Margine cumulato meno investimento, a fine di ogni trimestre da `da`. */
export function curvaRecupero(investimento: number, progetti: Progetto[], da: Date, trimestri: number, piattaforma?: CostiPiattaforma): PuntoTrimestre[] {
  const y0 = da.getUTCFullYear(), q0 = Math.floor(da.getUTCMonth() / 3);
  return Array.from({ length: trimestri }, (_, i) => {
    const q = q0 + i, anno = y0 + Math.floor(q / 4), tq = q % 4;
    const fine = new Date(Date.UTC(anno, tq * 3 + 2, 1));
    const somma = progetti.reduce((a, p) => a + contributoAl(p, fine), 0);
    const pf = piattaforma ? costoPiattaformaAl(piattaforma, fine) : 0;
    return { etichetta: `${anno} Q${tq + 1}`, cumulato: somma - investimento - pf };
  });
}

export function pareggio(curva: PuntoTrimestre[]): string | null {
  return curva.find((p) => p.cumulato >= 0)?.etichetta ?? null;
}

/* ---------------------------------------------------------------- piano trimestrale
   Una sola fonte per grafici, timeline e tabella: ricavi, costi diretti e margine di ogni progetto,
   costi comuni (investimento e piattaforma) e netto, trimestre per trimestre.
   Ricavi = una tantum (primo anno meno canone) all'avvio + canone mese per mese.
   Margine di progetto = contributo prima dei costi comuni (margine + quota piattaforma già sottratta dal prezzo).
   Costi diretti = ricavi meno margine di progetto. */

/** Ricavi cumulati di un progetto fino al mese di `fine` compreso. */
export function ricaviAl(p: Progetto, fine: Date): number {
  const mesi = Math.min(p.durataMesi, meseIndice(fine) - meseIndice(p.inizio) + 1);
  if (mesi <= 0) return 0;
  const unaTantum = Math.max(0, (p.prezzoPrimoAnno ?? p.licenzaAnnua) - p.licenzaAnnua);
  return unaTantum + (p.licenzaAnnua * mesi) / 12;
}

export interface RigaProgettoTrimestre {
  id: string;
  ricavi: number; costiDiretti: number; margine: number;           // del trimestre
  ricaviCum: number; costiDirettiCum: number; margineCum: number;  // dall'inizio
}

export interface Trimestre {
  etichetta: string;
  fine: Date;
  progetti: RigaProgettoTrimestre[];
  ricavi: number; costiDiretti: number; margine: number;       // somma dei progetti, del trimestre
  piattaforma: number; piattaformaCum: number;                 // costi comuni del trimestre e cumulati
  investimento: number;                                        // da recuperare, sempre per intero
  margineCum: number;
  netto: number;                                               // margine cumulato − investimento − piattaforma
}

export interface Piano { trimestri: Trimestre[]; pareggio: string | null; indicePareggio: number }

export function pianoTrimestrale(investimento: number, progetti: Progetto[], da: Date, trimestri: number, piattaforma?: CostiPiattaforma): Piano {
  const y0 = da.getUTCFullYear(), q0 = Math.floor(da.getUTCMonth() / 3);
  const precedente = new Map<string, { r: number; m: number }>();
  let pfPrec = 0;
  const righe: Trimestre[] = Array.from({ length: trimestri }, (_, i) => {
    const q = q0 + i, anno = y0 + Math.floor(q / 4), tq = q % 4;
    const fine = new Date(Date.UTC(anno, tq * 3 + 2, 1));
    const rp = progetti.map((p) => {
      const rCum = ricaviAl(p, fine), mCum = contributoAl(p, fine);
      const prev = precedente.get(p.id) ?? { r: 0, m: 0 };
      precedente.set(p.id, { r: rCum, m: mCum });
      return { id: p.id, ricavi: rCum - prev.r, margine: mCum - prev.m, costiDiretti: (rCum - prev.r) - (mCum - prev.m),
        ricaviCum: rCum, margineCum: mCum, costiDirettiCum: rCum - mCum };
    });
    const pfCum = piattaforma ? costoPiattaformaAl(piattaforma, fine) : 0;
    const margineCum = rp.reduce((a, x) => a + x.margineCum, 0);
    const t: Trimestre = {
      etichetta: `${anno} Q${tq + 1}`, fine, progetti: rp,
      ricavi: rp.reduce((a, x) => a + x.ricavi, 0), costiDiretti: rp.reduce((a, x) => a + x.costiDiretti, 0), margine: rp.reduce((a, x) => a + x.margine, 0),
      piattaforma: pfCum - pfPrec, piattaformaCum: pfCum, investimento, margineCum, netto: margineCum - investimento - pfCum
    };
    pfPrec = pfCum;
    return t;
  });
  const indicePareggio = righe.findIndex((t) => t.netto >= 0);
  return { trimestri: righe, pareggio: indicePareggio >= 0 ? righe[indicePareggio].etichetta : null, indicePareggio };
}
