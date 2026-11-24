'use client';

import { importo } from '@/lib/ui/formato';

export interface TestiCurva { tutti: string; approvati: string; oggi: string; esposizione: string; pareggio: string }

/** Netto cumulato per trimestre: la selezione contro i soli approvati, con esposizione massima, oggi e linea del pareggio. */
export function CurvaNetto({ etichette, tutti, approvati, oggi, testi, aria }: {
  etichette: string[]; tutti: number[]; approvati: number[]; oggi: number | null; testi: TestiCurva; aria: string;
}) {
  const N = etichette.length;
  const X0 = 88, X1 = 490, Y0 = 28, Y1 = 300;
  const TOP = Math.max(...tutti) > 0 ? (Math.floor(Math.max(...tutti) / 100000) + 1) * 100000 : 20000;
  const BOT = Math.min(...approvati, ...tutti) - 40000;
  const x = (i: number) => X0 + (i * (X1 - X0)) / Math.max(1, N - 1);
  const y = (v: number) => Y0 + ((TOP - v) / (TOP - BOT)) * (Y1 - Y0);
  const griglia: number[] = [];
  for (let v = Math.trunc(TOP / 100000) * 100000; v > Math.trunc(BOT / 100000) * 100000; v -= 100000) griglia.push(v);
  const linea = (a: number[]) => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const banda = `${linea(tutti)} ${tutti.map((_, i) => N - 1 - i).map((i) => `${x(i).toFixed(1)},${y(approvati[i]).toFixed(1)}`).join(' ')}`;
  const mi = tutti.indexOf(Math.min(...tutti));
  const ly = y(BOT + 20000);
  const adDestra = mi > N * 0.6;
  const stessa = Math.abs(tutti[N - 1] - approvati[N - 1]) < 1;
  const ox = oggi === null ? null : x(oggi);
  const NAVY = 'var(--surface-brand)', NEG = 'var(--signal-negative)', AZ = 'var(--accent-azure)', MUT = 'var(--ink-muted)';
  return (
    <svg viewBox={`0 0 640 ${Y1 + 34}`} width="100%" role="img" aria-label={aria} style={{ display: 'block', fontFamily: 'Metropolis, Arial, sans-serif' }}>
      {griglia.map((v) => (
        <g key={v}>
          <line x1={X0} x2={X1 + 30} y1={y(v)} y2={y(v)} stroke={v === 0 ? NAVY : 'var(--line-soft)'} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={X0 - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={MUT}>{importo(v)}</text>
        </g>
      ))}
      {etichette.map((l, i) => <text key={l} x={x(i)} y={Y1 + 22} textAnchor="middle" fontSize="11" fill={MUT}>{l}</text>)}
      <polygon points={banda} fill={AZ} fillOpacity={0.1} />
      <polyline points={linea(approvati)} fill="none" stroke={NEG} strokeWidth={2.5} strokeDasharray="6 4" />
      <polyline points={linea(tutti)} fill="none" stroke={AZ} strokeWidth={3} />
      {ox !== null && (
        <g>
          <line x1={ox} x2={ox} y1={Y0 - 10} y2={Y1} stroke={AZ} strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={ox + 6} y={Y0 - 14} fontSize="11" fontWeight={700} fill="var(--accent-azure-text)">{testi.oggi}</text>
        </g>
      )}
      <circle cx={x(mi)} cy={y(tutti[mi])} r={5} fill="var(--surface-card)" stroke={NEG} strokeWidth={2.5} />
      <line x1={x(mi)} x2={x(mi)} y1={y(tutti[mi]) + 6} y2={ly - 14} stroke={NEG} strokeWidth={1} strokeDasharray="2 3" />
      <text x={x(mi) + (adDestra ? -6 : 6)} y={ly} textAnchor={adDestra ? 'end' : 'start'} fontSize="11" fontWeight={700} fill={NEG}>{testi.esposizione} {importo(tutti[mi])}</text>
      <circle cx={x(N - 1)} cy={y(tutti[N - 1])} r={5} fill={AZ} />
      <text x={x(N - 1) + 10} y={y(tutti[N - 1]) - 6} fontSize="12" fontWeight={700} fill="var(--accent-azure-text)">{testi.tutti}</text>
      <text x={x(N - 1) + 10} y={y(tutti[N - 1]) + 9} fontSize="12" fontWeight={700} fill="var(--accent-azure-text)">{importo(tutti[N - 1])}</text>
      {!stessa && (
        <g>
          <circle cx={x(N - 1)} cy={y(approvati[N - 1])} r={5} fill={NEG} />
          <text x={x(N - 1) + 10} y={y(approvati[N - 1]) - 6} fontSize="12" fontWeight={700} fill={NEG}>{testi.approvati}</text>
          <text x={x(N - 1) + 10} y={y(approvati[N - 1]) + 9} fontSize="12" fontWeight={700} fill={NEG}>{importo(approvati[N - 1])}</text>
        </g>
      )}
      <text x={X1 + 30} y={y(0) - 6} textAnchor="end" fontSize="11" fontWeight={700} fill={NAVY}>{testi.pareggio}</text>
    </svg>
  );
}
