'use client';

import { importo } from '@/lib/ui/formato';

export interface PassoCascata { nome: string; da: number; valore: number; colore: string; tipo: 'totale' | 'delta' }

/** Cascata dai ricavi al netto: totali dallo zero, variazioni dal livello precedente. I nomi vanno a capo dove c'è «|». */
export function CascataBP({ passi, aria }: { passi: PassoCascata[]; aria: string }) {
  const WX0 = 14, WX1 = 546, WY0 = 30, WY1 = 284;
  const tutti = passi.flatMap((p) => [p.tipo === 'totale' ? 0 : p.da, p.tipo === 'totale' ? p.valore : p.da + p.valore]);
  const netto = passi[passi.length - 1].valore;
  const WT = Math.max(...tutti, 1) * 1.05, WB = Math.min(netto, 0) - (netto < 0 ? 120000 : 20000);
  const wy = (v: number) => WY0 + ((WT - v) / (WT - WB)) * (WY1 - WY0);
  const slot = (WX1 - WX0) / passi.length, bw = 58;
  return (
    <svg viewBox="0 0 560 340" width="100%" role="img" aria-label={aria} style={{ display: 'block', fontFamily: 'Metropolis, Arial, sans-serif' }}>
      <line x1={WX0} x2={WX1} y1={wy(0)} y2={wy(0)} stroke="var(--surface-brand)" strokeWidth={1.5} />
      {passi.map((p, k) => {
        const cx = WX0 + slot * (k + 0.5);
        const a = p.tipo === 'totale' ? 0 : p.da, b = p.tipo === 'totale' ? p.valore : p.da + p.valore;
        const alto = wy(Math.max(a, b)), basso = wy(Math.min(a, b));
        const sotto = p.tipo === 'totale' && p.valore < 0;
        return (
          <g key={p.nome}>
            <rect x={cx - bw / 2} y={alto} width={bw} height={Math.max(basso - alto, 2)} rx={3} fill={p.colore} />
            <text x={cx} y={sotto ? basso + 14 : alto - 6} textAnchor="middle" fontSize="11" fontWeight={700}
              fill={p.colore === 'var(--ink-muted)' ? 'var(--ink-secondary)' : p.colore}>{importo(p.valore)}</text>
            {p.nome.split('|').map((r, j) => <text key={r} x={cx} y={WY1 + 36 + j * 13} textAnchor="middle" fontSize="11" fill="var(--ink-secondary)">{r}</text>)}
            {k < passi.length - 1 && (
              <line x1={cx + bw / 2} x2={WX0 + slot * (k + 1.5) - bw / 2} y1={wy(b)} y2={wy(b)} stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="2 3" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
