'use client';

import { euro } from '@/lib/ui/formato';
import { useT } from '@/lib/i18n/client';

export interface BarraProgetto { id: string; cliente: string; inizio: Date; durataMesi: number; inCorso: boolean; colore: string; licenzaAnnua: number }
export interface BarraServizio { id: 'reevo' | 'n8n' | 'ams'; dal: Date }

const mi = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

/** Gantt: una riga per contratto (tratteggiato se bozza), poi i servizi di piattaforma dal loro avvio.
    Linee verticali per oggi e per il pareggio; griglia a trimestri, anni in evidenza. */
export function TimelineBP({ progetti, servizi, da, anni, pareggioIndice, pareggioEtichetta, oggi, nomeMese }: {
  progetti: BarraProgetto[]; servizi: BarraServizio[]; da: Date; anni: number; pareggioIndice: number; pareggioEtichetta: string | null;
  oggi: Date; nomeMese: (d: Date) => string;
}) {
  const t = useT();
  const fineOrizzonte = new Date(Date.UTC(da.getUTCFullYear() + anni, 0, 1));
  const span = fineOrizzonte.getTime() - da.getTime();
  const pos = (d: Date) => Math.min(1, Math.max(0, (d.getTime() - da.getTime()) / span));
  const barra = (inizio: Date, durata: number) => {
    const fine = new Date(Date.UTC(inizio.getUTCFullYear(), inizio.getUTCMonth() + durata, 1));
    if (inizio >= fineOrizzonte || fine <= da) return null;
    const l = pos(inizio), r = pos(fine);
    return { left: l * 100, width: Math.max(0.6, (r - l) * 100), fine: new Date(Date.UTC(fine.getUTCFullYear(), fine.getUTCMonth() - 1, 1)) };
  };
  const trimestri = anni * 4;
  const xPareggio = pareggioIndice >= 0 ? ((pareggioIndice + 1) / trimestri) * 100 : null;
  const xOggi = oggi >= da && oggi < fineOrizzonte ? pos(oggi) * 100 : null;
  const y0 = da.getUTCFullYear();
  return (
    <div className="gnt" role="img" aria-label={t('bp.timeline')}>
      <div className="gnt__h">
        <span className="gnt__n" />
        <span className="gnt__anni">{Array.from({ length: anni }, (_, i) => <b key={i}>{y0 + i}</b>)}</span>
      </div>
      <div className="gnt__ov" aria-hidden="true">
        {Array.from({ length: trimestri - 1 }, (_, i) => <i key={i} className={(i + 1) % 4 === 0 ? 'anno' : undefined} style={{ left: `${((i + 1) / trimestri) * 100}%` }} />)}
        {xOggi !== null && <u className="oggi" style={{ left: `${xOggi}%` }}><span>{t('bp.oggi')}</span></u>}
        {xPareggio !== null && <u className="pari" style={{ left: `${xPareggio}%` }}><span className={xPareggio > 70 ? 'sx' : undefined}>{t('bp.pareggioIl', { q: pareggioEtichetta ?? '' })}</span></u>}
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
