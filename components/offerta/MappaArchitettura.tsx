'use client';

import type { AreaArchitettura, StatoArea } from '@/lib/engine';
import { Icona } from '@/components/Icona';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';
import { numero } from '@/lib/ui/formato';

export interface DatiMappa {
  terzi: { id: AreaArchitettura; stato: StatoArea; voci?: { nome: string; gg: number }[] }[];
  piattaforma: { id: AreaArchitettura; stato: StatoArea; voci?: { nome: string; gg: number }[] }[];
  cliente: { id: AreaArchitettura; stato: StatoArea; voci?: { nome: string; gg: number }[] }[];
  moduli: { id: string; nome: string; stato: StatoArea }[];
  deployment: { saas: boolean; onPremise: boolean };
}

const ICONE: Record<AreaArchitettura, string> = {
  kyc: 'identita', aml: 'aml', firma: 'firma', doc: 'documenti', notifiche: 'notifiche',
  componibile: 'componibile', workflow: 'workflow', design: 'design', multifornitore: 'multifornitore',
  core: 'banca', crm: 'crm', dms: 'dms', bi: 'bi', altri: 'altri'
};

/** Architettura della soluzione: le caselle si accendono con la configurazione dell'offerta.
   In modalità cliente non ci sono tooltip con le voci: solo incluso o no. */
export function MappaArchitettura({ dati, cliente = false, attiva, onAttiva }: {
  dati: DatiMappa;
  cliente?: boolean;
  attiva?: AreaArchitettura | null;
  onAttiva?: (a: AreaArchitettura | null) => void;
}) {
  const t = useT();
  const titolo = (x: DatiMappa['terzi'][number]) => {
    const nome = t(`arch.${x.id}` as Chiave);
    if (cliente || !x.voci?.length) return `${nome} · ${t(`arch.stato.${x.stato}` as Chiave)}`;
    return `${nome}\n${x.voci.map((v) => `${v.nome} · ${numero(v.gg)} gg`).join('\n')}`;
  };
  const casella = (x: DatiMappa['terzi'][number], grande = false) => (
    <li key={x.id}
      className={`mappa__c mappa__c--${x.stato}${grande ? ' mappa__c--pil' : ''}${attiva === x.id ? ' is-attiva' : ''}`}
      title={titolo(x)} tabIndex={cliente ? undefined : 0}
      onMouseEnter={() => onAttiva?.(x.id)} onMouseLeave={() => onAttiva?.(null)}
      onFocus={() => onAttiva?.(x.id)} onBlur={() => onAttiva?.(null)}>
      <Icona nome={ICONE[x.id]} size={grande ? 20 : 18} />
      <span>{t(`arch.${x.id}` as Chiave)}</span>
      {!cliente && x.stato === 'sviluppo' && x.voci && (
        <small className="mappa__gg">{numero(x.voci.reduce((a, v) => a + v.gg, 0))} gg</small>
      )}
    </li>
  );
  return (
    <div className="mappa">
      <section className="mappa__col">
        <h4>{t('arch.terzi')}</h4>
        <ul>{dati.terzi.map((x) => casella(x))}</ul>
      </section>
      <div className="mappa__freccia" aria-hidden="true">⇄</div>
      <section className="mappa__centro">
        <h4>{t('arch.piattaforma')}</h4>
        <ul className="mappa__pil">
          {dati.piattaforma.slice(0, 2).map((x) => casella(x, true))}
          <li className="mappa__journey" aria-hidden="true"><Icona nome="journey" size={28} /><b>{t('arch.journey')}</b></li>
          {dati.piattaforma.slice(2).map((x) => casella(x, true))}
        </ul>
        {dati.moduli.length > 0 && <ol className="mappa__moduli" aria-label={t('as.moduli')}>
          {dati.moduli.map((m, i) => (
            <li key={m.id} className={`mappa__m mappa__m--${m.stato}`} title={`${String(i + 1).padStart(2, '0')} ${m.nome} · ${t(`arch.stato.${cliente && m.stato === 'sviluppo' ? 'incluso' : m.stato}` as Chiave)}`}>
              {String(i + 1).padStart(2, '0')}
            </li>
          ))}
        </ol>}
        <div className="mappa__dep">
          <span className={dati.deployment.saas ? 'is-on' : undefined}><Icona nome="cloud" />SaaS</span>
          <span className={dati.deployment.onPremise ? 'is-on' : undefined}><Icona nome="database" />On-premise</span>
        </div>
      </section>
      <div className="mappa__freccia" aria-hidden="true">⇄</div>
      <section className="mappa__col">
        <h4>{t('arch.cliente')}</h4>
        <ul>{dati.cliente.map((x) => casella(x))}</ul>
      </section>
      {!cliente && (
        <p className="mappa__leg" aria-hidden="true">
          <span className="mappa__l mappa__l--incluso" />{t('arch.stato.incluso')}
          <span className="mappa__l mappa__l--sviluppo" />{t('arch.stato.sviluppo')}
          <span className="mappa__l mappa__l--spento" />{t('arch.stato.spento')}
        </p>
      )}
    </div>
  );
}
