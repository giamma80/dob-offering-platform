import 'server-only';
import { configAttiva, configVersione, elencoOfferte } from '@/lib/dati';
import { costiPiattaforma, costiSistema, quotaPiattaforma, sviluppoTotale, type Progetto, type VocePiattaforma } from '@/lib/engine';

export type ProgettoBP = Omit<Progetto, 'inizio'> & { inizio: string };
export interface DatiBP {
  investimento: { sviluppo: number; amPrimoAnno: number; mesiSviluppo: string[] };
  progetti: ProgettoBP[];
  piattaforma: { dal: string; mese: number; unaTantum: number; voci?: (Omit<VocePiattaforma, 'dal'> & { dal: string })[] };
}

/* Unico punto che trasforma offerte e parametri negli input del business plan: lo usano sia "Business plan" sia
   "Business plan new", così i due calcolano sugli stessi numeri. Progetti approvati dall'avvio reale (o dall'approvazione),
   offerte in corso dal trimestre successivo; durata contratto 36 mesi. I costi di piattaforma escono interi dal mese di
   attivazione; i progetti contribuiscono al lordo della quota condivisa. Le offerte storiche registrano la quota a zero
   (metodo dell'Excel): il ripiego dalla versione dei parametri vale solo per sintesi che non la riportano. */
export async function caricaBusinessPlan(): Promise<DatiBP> {
  const [{ dati: cfg }, offerte] = await Promise.all([configAttiva(), elencoOfferte()]);
  const oggi = new Date();
  const prossimoTrimestre = new Date(Date.UTC(oggi.getUTCFullYear(), Math.floor(oggi.getUTCMonth() / 3) * 3 + 3, 1));
  const valide = offerte.filter((o) => o.sintesi && (o.sintesi.saas || o.sintesi.onPremise));
  const versioni = [...new Set(valide.filter((o) => o.sintesi!.saas && o.sintesi!.saas.quotaPiattaformaAnnua === undefined).map((o) => o.config_versione))];
  const cfgVersioni = new Map(await Promise.all(versioni.map(async (v) => [v, (await configVersione(v)).dati] as const)));
  const progetti: ProgettoBP[] = valide.map((o) => {
    const s = o.sintesi!.saas ?? o.sintesi!.onPremise!;
    const approvata = o.stato === 'approvata';
    const q = o.sintesi!.saas
      ? (s.quotaPiattaformaAnnua !== undefined
        ? { annua: s.quotaPiattaformaAnnua, unaTantum: s.quotaPiattaformaUnaTantum ?? 0 }
        : quotaPiattaforma(cfgVersioni.get(o.config_versione) ?? cfg))
      : { annua: 0, unaTantum: 0 };
    return {
      id: o.id, cliente: o.cliente, inCorso: !approvata,
      inizio: (approvata ? new Date(o.avviata_il ?? o.approvata_il ?? o.creata_il) : prossimoTrimestre).toISOString(),
      margineAnnuo: s.margineAnnuo, marginePrimoAnno: s.marginePrimoAnno, licenzaAnnua: s.licenza, prezzoPrimoAnno: s.primoAnno, durataMesi: 36,
      quotaPiattaformaAnnua: q.annua, quotaPiattaformaUnaTantum: q.unaTantum
    };
  });
  const pf = costiPiattaforma(cfg);
  return {
    investimento: { sviluppo: sviluppoTotale(cfg), amPrimoAnno: cfg.investimento.amPrimoAnno, mesiSviluppo: costiSistema(cfg).sviluppo.map((v) => v.mese) },
    progetti,
    piattaforma: { dal: pf.dal.toISOString(), mese: pf.mese, unaTantum: pf.unaTantum, voci: (pf.voci ?? []).map((v) => ({ ...v, dal: v.dal.toISOString() })) }
  };
}
