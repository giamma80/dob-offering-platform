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
  durataMesi: number;
  inCorso: boolean;           // offerta non ancora approvata
  /** quota dei costi condivisi già sottratta dal margine (÷ N + 1): si riaggiunge */
  quotaPiattaformaAnnua?: number;
  quotaPiattaformaUnaTantum?: number;
}

/** Costi di piattaforma per il business plan: una tantum all'attivazione, poi un importo al mese. */
export interface CostiPiattaforma { dal: Date; mese: number; unaTantum: number }

/** Costi di piattaforma interi dalla configurazione (non divisi per i clienti). */
export function costiPiattaforma(cfg: Config): CostiPiattaforma {
  const cc = cfg.costiCondivisi;
  const [a, m] = (cfg.piattaforma?.attivaDal ?? '2026-07').split('-').map(Number);
  return {
    dal: new Date(Date.UTC(a, (m || 1) - 1, 1)),
    mese: cc.reevo.reduce((x, r) => x + r.mese, 0) + cc.n8nOcrMese + cc.amsSaasAnno / 12 + cc.supportoAnno / 12,
    unaTantum: cc.reevoServiziUnaTantum
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
  const mesi = meseIndice(fine) - meseIndice(c.dal) + 1;
  return mesi <= 0 ? 0 : c.unaTantum + c.mese * mesi;
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
