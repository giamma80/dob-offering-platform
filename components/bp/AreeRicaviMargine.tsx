'use client';

import { importo } from '@/lib/ui/formato';
import { passoTacche } from '@/components/grafici';

export interface SerieProgetto { id: string; nome: string; colore: string; bozza: boolean; valori: number[] }
export interface TestiAree { margine: string; costi: string; piattaforma: string; ricavi: string; oggi: string }

/** Ricavi per progetto in aree impilate (le bozze tratteggiate), con il margine di contribuzione e i costi come linee. */
export function AreeRicaviMargine({ etichette, serie, ricavi, margine, costi, piattaforma, oggi, testi, aria }: {
  etichette: string[]; serie: SerieProgetto[]; ricavi: number[]; margine: number[]; costi: number[]; piattaforma: number[]; oggi: number | null; testi: TestiAree; aria: string;
}) {
  const N = etichette.length;
  const AW = 1240, AH = 432, AX0 = 104, AX1 = 1090, AY0 = 20, AY1 = 360;
  const massimo = Math.max(...ricavi, ...margine, ...costi, ...piattaforma, 1);
  const passo = passoTacche(massimo);
  const ymax = (Math.floor(massimo / passo) + 1) * passo;
  const ax = (i: number) => AX0 + (i * (AX1 - AX0)) / Math.max(1, N - 1);
  const ay = (v: number) => AY1 - (v / ymax) * (AY1 - AY0);
  const tacche: number[] = [];
  for (let v = 0; v <= ymax; v += passo) tacche.push(v);
  let base = new Array(N).fill(0) as number[];
  const aree = serie.map((s) => {
    const alto = base.map((b, i) => b + s.valori[i]);
    const punti = `${alto.map((v, i) => `${ax(i).toFixed(1)},${ay(v).toFixed(1)}`).join(' ')} ${base.map((_, i) => N - 1 - i).map((i) => `${ax(i).toFixed(1)},${ay(base[i]).toFixed(1)}`).join(' ')}`;
    const el = <polygon key={s.id} points={punti} fill={s.bozza ? `url(#bpn-h-${s.id})` : s.colore} fillOpacity={s.bozza ? 1 : 0.9} stroke={s.colore} strokeWidth={1.5} strokeLinejoin="round"><title>{s.nome}</title></polygon>;
    base = alto;
    return el;
  });
  const linea = (vals: number[], col: string, tratteggio?: string) => {
    const p = vals.map((v, i) => `${ax(i).toFixed(1)},${ay(v).toFixed(1)}`).join(' ');
    return (
      <g>
        <polyline points={p} fill="none" stroke="var(--surface-card)" strokeWidth={6} strokeLinejoin="round" />
        <polyline points={p} fill="none" stroke={col} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray={tratteggio} />
        {vals.map((v, i) => <circle key={etichette[i]} cx={ax(i)} cy={ay(v)} r={3.5} fill="var(--surface-card)" stroke={col} strokeWidth={2} />)}
      </g>
    );
  };
  const MARG = 'var(--surface-brand-deep)', NEG = 'var(--signal-negative)', SETUP = 'var(--signal-open-ink)';
  const fine = [
    { y: ay(margine[N - 1]), n: testi.margine, v: margine[N - 1], c: MARG },
    { y: ay(costi[N - 1]), n: testi.costi, v: costi[N - 1], c: SETUP },
    { y: ay(piattaforma[N - 1]), n: testi.piattaforma, v: piattaforma[N - 1], c: NEG },
    { y: ay(ricavi[N - 1]), n: testi.ricavi, v: ricavi[N - 1], c: 'var(--ink-secondary)' }
  ].sort((a, b) => b.y - a.y);
  let ultimo = AY1 - 22;
  const etich = fine.map((e) => { const yy = Math.min(e.y, ultimo); ultimo = yy - 34; return { ...e, y: yy }; });
  const ox = oggi === null ? null : ax(oggi);
  return (
    <svg viewBox={`0 0 ${AW} ${AH}`} width="100%" role="img" aria-label={aria} style={{ display: 'block', fontFamily: 'Metropolis, Arial, sans-serif' }}>
      <defs>
        {serie.filter((s) => s.bozza).map((s) => (
          <pattern key={s.id} id={`bpn-h-${s.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="var(--surface-card)" /><rect width="4" height="8" fill={s.colore} fillOpacity={0.85} />
          </pattern>
        ))}
      </defs>
      {tacche.map((v) => (
        <g key={v}>
          <line x1={AX0} x2={AX1 + 10} y1={ay(v)} y2={ay(v)} stroke={v === 0 ? 'var(--surface-brand)' : 'var(--line-soft)'} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={AX0 - 10} y={ay(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-muted)">{importo(v)}</text>
        </g>
      ))}
      {etichette.map((l, i) => <text key={l} x={ax(i)} y={AY1 + 22} textAnchor="middle" fontSize="11" fill="var(--ink-muted)">{l}</text>)}
      {aree}
      {ox !== null && (
        <g>
          <line x1={ox} x2={ox} y1={AY0 - 8} y2={AY1} stroke="var(--accent-azure)" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={ox + 6} y={AY0 - 10} fontSize="11" fontWeight={700} fill="var(--accent-azure-text)">{testi.oggi}</text>
        </g>
      )}
      {linea(costi, SETUP, '2 4')}
      {linea(piattaforma, NEG, '6 4')}
      {linea(margine, MARG)}
      {etich.map((e) => (
        <g key={e.n}>
          <text x={AX1 + 16} y={e.y - 3} fontSize="12" fontWeight={700} fill={e.c}>{e.n}</text>
          <text x={AX1 + 16} y={e.y + 12} fontSize="12" fontWeight={700} fill={e.c}>{importo(e.v)}</text>
        </g>
      ))}
    </svg>
  );
}
