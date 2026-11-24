'use client';

import { euro } from '@/lib/ui/formato';
import { useT } from '@/lib/i18n/client';

export interface BarraProgetto { id: string; cliente: string; inizio: Date; durataMesi: number; inCorso: boolean; colore: string; licenzaAnnua: number }
export interface BarraServizio { id: 'reevo' | 'n8n' | 'ams'; dal: Date }

interface Marcatore { id: string; x: number; testo: string; tipo: 'progetto' | 'costo' | 'oggi' | 'pareggio'; colore: string; livello: number }

/** Gantt: una riga per contratto (tratteggiato se bozza), poi i servizi di piattaforma dal loro avvio.
    Linee verticali: avvio di ogni progetto (nel suo colore), avvio di ogni costo (rosso), oggi e pareggio.
    Le etichette stanno sotto, su più righe se si sfiorano. */
export function TimelineBP({ progetti, servizi, sviluppo, da, anni, pareggioIndice, pareggioEtichetta, oggi, nomeMese }: {
  progetti: BarraProgetto[]; servizi: BarraServizio[]; sviluppo: Date[]; da: Date; anni: number; pareggioIndice: number; pareggioEtichetta: string | null;
  oggi: Date; nomeMese: (d: Date) => string;
}) {
  const t = useT();
  const fineOrizzonte = new Date(Date.UTC(da.getUTCFullYear() + anni, 0, 1));
  const span = fineOrizzonte.getTime() - da.getTime();
  const pos = (d: Date) => Math.min(1, Math.max(0, (d.getTime() - da.getTime()) / span));
  const dentro = (d: Date) => d >= da && d < fineOrizzonte;
  const barra = (inizio: Date, durata: number) => {
    const fine = new Date(Date.UTC(inizio.getUTCFullYear(), inizio.getUTCMonth() + durata, 1));
    if (inizio >= fineOrizzonte || fine <= da) return null;
    const l = pos(inizio), r = pos(fine);
    return { left: l * 100, width: Math.max(0.6, (r - l) * 100), fine: new Date(Date.UTC(fine.getUTCFullYear(), fine.getUTCMonth() - 1, 1)) };
  };
  const trimestri = anni * 4;

  /* marcatori verticali, con livelli di etichetta assegnati in ordine di posizione per evitare sovrapposizioni */
  const grezzi: Omit<Marcatore, 'livello'>[] = [
    ...progetti.filter((p) => dentro(p.inizio)).map((p) => ({ id: `p-${p.id}`, x: pos(p.inizio) * 100, testo: p.cliente, tipo: 'progetto' as const, colore: p.colore })),
    ...servizi.filter((s) => dentro(s.dal)).map((s) => ({ id: `s-${s.id}`, x: pos(s.dal) * 100, testo: t(`bp.svc.${s.id}` as 'bp.svc.reevo'), tipo: 'costo' as const, colore: 'var(--signal-negative)' })),
    ...[...new Set(sviluppo.filter(dentro).map((d) => d.getTime()))].map((ms) => ({ id: `v-${ms}`, x: pos(new Date(ms)) * 100, testo: t('bp.sviluppoBreve'), tipo: 'costo' as const, colore: 'var(--signal-negative)' })),
    ...(dentro(oggi) ? [{ id: 'oggi', x: pos(oggi) * 100, testo: t('bp.oggi'), tipo: 'oggi' as const, colore: 'var(--accent-azure-text)' }] : []),
    ...(pareggioIndice >= 0 ? [{ id: 'pari', x: ((pareggioIndice + 1) / trimestri) * 100, testo: t('bp.pareggioIl', { q: pareggioEtichetta ?? '' }), tipo: 'pareggio' as const, colore: 'var(--signal-positive)' }] : [])
  ].sort((a, b) => a.x - b.x);
  const fine: number[] = [];   // fine occupata di ogni livello, in % della traccia
  const marcatori: Marcatore[] = grezzi.map((m) => {
    const w = m.testo.length * 1.05 + 1.5;
    const verso = m.x > 72 ? -1 : 1;
    const [a, b] = verso === 1 ? [m.x, m.x + w] : [m.x - w, m.x];
    let l = 0;
    while (fine[l] !== undefined && fine[l] > a) l++;
    fine[l] = b;
    return { ...m, livello: l };
  });
  const livelli = Math.max(1, fine.length);
  const pieFooter = livelli * 15 + 8;
  const y0 = da.getUTCFullYear();
  return (
    <div className="gnt" role="img" aria-label={t('bp.timeline')} style={{ ['--foot' as string]: `${pieFooter}px` }}>
      <div className="gnt__h">
        <span className="gnt__n" />
        <span className="gnt__anni">{Array.from({ length: anni }, (_, i) => <b key={i}>{y0 + i}</b>)}</span>
      </div>
      <div className="gnt__ov" aria-hidden="true">
        {Array.from({ length: trimestri - 1 }, (_, i) => <i key={i} className={(i + 1) % 4 === 0 ? 'anno' : undefined} style={{ left: `${((i + 1) / trimestri) * 100}%` }} />)}
        {marcatori.map((m) => (
          <u key={m.id} className={`mk ${m.tipo}`} style={{ left: `${m.x}%`, ['--c' as string]: m.colore }}>
            <span className={m.x > 72 ? 'sx' : undefined} style={{ bottom: `${pieFooter - 15 * (m.livello + 1) - 2}px` }}>{m.testo}</span>
          </u>
        ))}
      </div>
      {progetti.map((p) => {
        const b = barra(p.inizio, p.durataMesi);
        const testo = `${nomeMese(p.inizio)} → ${b ? nomeMese(b.fine) : ''} · ${euro(p.licenzaAnnua)}${t('sp.anno')}`;
        return (
          <div key={p.id} className="gnt__r">
            <span className={`gnt__n${p.inCorso ? ' in-corso' : ''}`} title={p.cliente}>{p.cliente}</span>
            <span className="gnt__t">
              {b && <span className={`gnt__b${p.inCorso ? ' in-corso' : ''}`} style={{ left: `${b.left}%`, width: `${b.width}%`, ['--c' as string]: p.colore }} title={testo}>{testo}</span>}
            </span>
          </div>
        );
      })}
      {servizi.map((s, i) => {
        const b = barra(s.dal, 1200);
        return (
          <div key={s.id} className={`gnt__r${i === 0 ? ' gnt__sep' : ''}`}>
            <span className="gnt__n">{t(`bp.svc.${s.id}` as 'bp.svc.reevo')}</span>
            <span className="gnt__t">
              {b && <span className="gnt__b servizio" style={{ left: `${b.left}%`, width: `${b.width}%` }} title={`${nomeMese(s.dal)} →`}>{nomeMese(s.dal)} →</span>}
            </span>
          </div>
        );
      })}
      <div className="gnt__f" />
    </div>
  );
}
