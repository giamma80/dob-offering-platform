/* Recupero dell'investimento di piattaforma (design v2 §9).
   Ogni progetto contribuisce dal mese di avvio: la parte una tantum del margine all'avvio,
   poi il margine ricorrente mese per mese per la durata del contratto. */

export interface Progetto {
  id: string;
  cliente: string;
  inizio: Date;
  margineAnnuo: number;
  marginePrimoAnno: number;   // include la parte una tantum
  licenzaAnnua: number;
  durataMesi: number;
  inCorso: boolean;           // offerta non ancora approvata
}

export interface PuntoTrimestre { etichetta: string; cumulato: number }

const meseIndice = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

export function contributoAl(p: Progetto, fine: Date): number {
  const mesi = Math.min(p.durataMesi, meseIndice(fine) - meseIndice(p.inizio) + 1);
  if (mesi <= 0) return 0;
  const unaTantum = Math.max(0, p.marginePrimoAnno - p.margineAnnuo);
  return unaTantum + (p.margineAnnuo * mesi) / 12;
}

/** Margine cumulato meno investimento, a fine di ogni trimestre da `da`. */
export function curvaRecupero(investimento: number, progetti: Progetto[], da: Date, trimestri: number): PuntoTrimestre[] {
  const y0 = da.getUTCFullYear(), q0 = Math.floor(da.getUTCMonth() / 3);
  return Array.from({ length: trimestri }, (_, i) => {
    const q = q0 + i, anno = y0 + Math.floor(q / 4), tq = q % 4;
    const fine = new Date(Date.UTC(anno, tq * 3 + 2, 1));
    const somma = progetti.reduce((a, p) => a + contributoAl(p, fine), 0);
    return { etichetta: `${anno} Q${tq + 1}`, cumulato: somma - investimento };
  });
}

export function pareggio(curva: PuntoTrimestre[]): string | null {
  return curva.find((p) => p.cumulato >= 0)?.etichetta ?? null;
}
