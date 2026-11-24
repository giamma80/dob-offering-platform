'use client';

import { euro } from '@/lib/ui/formato';
import { passoTacche } from '@/components/grafici';
import { indiceOggi } from '@/components/bp/GraficiBP';
import type { Piano } from '@/lib/engine';

export interface SerieArea { id: string; nome: string; colore: string; valori: number[] }

const k = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000).toLocaleString('it-IT')} k` : `${Math.round(v)}`);
const X0 = 64, X1 = 636, W = 660, Y0 = 16, Y1 = 196, H = 236;

/** Aree impilate trimestre per trimestre, collegate da una spezzata: una serie per progetto (e per i costi comuni). */
export function AreeTimeline({ piano, serie, etichetta, oggi }: { piano: Piano; serie: SerieArea[]; etichetta: string; oggi?: Date }) {
  const tr = piano.trimestri, n = tr.length;
  const tot = tr.map((_, i) => serie.reduce((a, s) => a + s.valori[i], 0));
  const passo = passoTacche(Math.max(...tot, 1));
  const alta = Math.max(passo, Math.ceil(Math.max(...tot, 1) / passo) * passo);
  const tacche: number[] = [];
  for (let v = 0; v <= alta + passo / 2; v += passo) tacche.push(Math.round(v));
  const py = (v: number) => Y1 - (v / alta) * (Y1 - Y0);
  const px = (i: number) => X0 + (i * (X1 - X0)) / Math.max(1, n - 1);
  let base = new Array(n).fill(0) as number[];
  const aree = serie.map((s) => {
    const alto = base.map((b, i) => b + s.valori[i]);
    const punti = `${alto.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')} ${base.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).reverse().join(' ')}`;
    const el = <polygon key={s.id} points={punti} fill={s.colore} opacity={0.88} stroke="var(--surface-card)" strokeWidth={0.75}><title>{s.nome}</title></polygon>;
    base = alto;
    return el;
  });
  const io = oggi ? indiceOggi(piano, oggi) : null;
  const ip = piano.indicePareggio;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', maxHeight: 320 }} role="img" aria-label={etichetta}>
      <g fontFamily="Metropolis, Arial">
        {tacche.map((v) => (
          <g key={v}>
            {v !== 0 && <line x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke="var(--line-soft)" strokeWidth={0.75} strokeDasharray="2 3" />}
            <text x={X0 - 7} y={py(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{k(v)}</text>
          </g>
        ))}
        {aree}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--ink-primary)" strokeWidth={1} />
        {tr.map((q, i) => {
          const [a, qq] = q.etichetta.split(' ');
          return (
            <g key={q.etichetta}>
              <text x={px(i)} y={Y1 + 13} textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">{qq}</text>
              {qq === 'Q1' && <text x={px(i)} y={Y1 + 26} textAnchor="middle" fontSize="10" fontWeight={700} fill="var(--ink-secondary)">{a}</text>}
              <title>{`${q.etichetta}: ${euro(tot[i])}`}</title>
            </g>
          );
        })}
        {ip >= 0 && <line x1={px(ip)} y1={Y0} x2={px(ip)} y2={Y1} stroke="var(--signal-positive)" strokeWidth={1.5} strokeDasharray="4 3" />}
        {io !== null && <line x1={px(io)} y1={Y0} x2={px(io)} y2={Y1} stroke="var(--accent-azure)" strokeWidth={1.5} strokeDasharray="2 3" />}
      </g>
    </svg>
  );
}
