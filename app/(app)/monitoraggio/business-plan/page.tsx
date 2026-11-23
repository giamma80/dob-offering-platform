import { configAttiva, elencoOfferte } from '@/lib/dati';
import { VistaBusinessPlan, type ProgettoBP } from './VistaBusinessPlan';

/* Recupero dell'investimento di piattaforma: progetti approvati (dalla data di approvazione) e,
   a scelta, le offerte in corso (avvio stimato al trimestre successivo). Durata contratto 36 mesi. */
export default async function BusinessPlan() {
  const [{ dati: cfg }, offerte] = await Promise.all([configAttiva(), elencoOfferte()]);
  const oggi = new Date();
  const prossimoTrimestre = new Date(Date.UTC(oggi.getUTCFullYear(), Math.floor(oggi.getUTCMonth() / 3) * 3 + 3, 1));
  const progetti: ProgettoBP[] = offerte.filter((o) => o.sintesi && (o.sintesi.saas || o.sintesi.onPremise)).map((o) => {
    const s = o.sintesi!.saas ?? o.sintesi!.onPremise!;
    const approvata = o.stato === 'approvata';
    return {
      id: o.id, cliente: o.cliente, inCorso: !approvata,
      inizio: (approvata ? new Date(o.approvata_il ?? o.creata_il) : prossimoTrimestre).toISOString(),
      margineAnnuo: s.margineAnnuo, marginePrimoAnno: s.marginePrimoAnno, licenzaAnnua: s.licenza, durataMesi: 36
    };
  });
  return <VistaBusinessPlan investimento={cfg.investimento} progetti={progetti} />;
}
