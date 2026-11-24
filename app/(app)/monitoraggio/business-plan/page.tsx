import { configAttiva, configVersione, elencoOfferte } from '@/lib/dati';
import { costiPiattaforma, quotaPiattaforma, sviluppoTotale } from '@/lib/engine';
import { VistaBusinessPlan, type ProgettoBP } from './VistaBusinessPlan';

/* Recupero dell'investimento di piattaforma: progetti approvati (dall'avvio reale, o dall'approvazione se manca) e,
   a scelta, le offerte in corso (avvio stimato al trimestre successivo). Durata contratto 36 mesi.
   I costi di piattaforma escono interi dal mese di attivazione; i progetti contribuiscono al lordo della quota condivisa.
   Per le offerte storiche, che non registrano la quota, si ricava dalla versione dei parametri con cui sono calcolate. */
export default async function BusinessPlan() {
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
      margineAnnuo: s.margineAnnuo, marginePrimoAnno: s.marginePrimoAnno, licenzaAnnua: s.licenza, durataMesi: 36,
      quotaPiattaformaAnnua: q.annua, quotaPiattaformaUnaTantum: q.unaTantum
    };
  });
  const pf = costiPiattaforma(cfg);
  return <VistaBusinessPlan investimento={{ sviluppo: sviluppoTotale(cfg), amPrimoAnno: cfg.investimento.amPrimoAnno }} progetti={progetti}
    piattaforma={{
      dal: pf.dal.toISOString(), mese: pf.mese, unaTantum: pf.unaTantum,
      voci: (pf.voci ?? []).map((v) => ({ ...v, dal: v.dal.toISOString() }))
    }} />;
}
