'use client';

import { euro } from '@/lib/ui/formato';
import { useT } from '@/lib/i18n/client';
import { passoTacche } from '@/components/grafici';
import type { Piano } from '@/lib/engine';

export interface VoceProgetto { id: string; nome: string; colore: string }

const k = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000).toLocaleString('it-IT')} k` : `${Math.round(v)}`);
const X0 = 70, X1 = 624, W = 660;

function assi(lo: number, hi: number, y0: number, y1: number) {
  const passo = passoTacche(hi - lo);
  const bassa = Math.floor(lo / passo) * passo, alta = Math.max(passo, Math.ceil(hi / passo) * passo);
  const tacche: number[] = [];
  for (let v = bassa; v <= alta + passo / 2; v += passo) tacche.push(Math.round(v));
  return { bassa, alta, tacche, py: (v: number) => y1 - ((v - bassa) / (alta - bassa)) * (y1 - y0) };
}

/** Margine cumulato per progetto in aree impilate sopra lo zero; sotto lo zero investimento e costi di piattaforma.
    La linea è il netto: dove sale sopra lo zero c'è il pareggio. */
export function AreeMargine({ piano, progetti, etichetta }: { piano: Piano; progetti: VoceProgetto[]; etichetta: string }) {
  const t = useT();
  const tr = piano.trimestri, n = tr.length;
  const y0 = 20, y1 = 204, H = 244;
  const sopra = tr.map((q) => q.progetti.reduce((a, p) => a + p.margineCum, 0));
  const sotto = tr.map((q) => q.investimento + q.piattaformaCum);
  const { alta, tacche, py } = assi(-Math.max(...sotto, 1), Math.max(...sopra, 1), y0, y1);
  const px = (i: number) => X0 + (i * (X1 - X0)) / Math.max(1, n - 1);
  const poli = (alto: number[], basso: number[]) =>
    `${alto.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')} ${basso.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).reverse().join(' ')}`;
  let base = new Array(n).fill(0) as number[];
  const aree = progetti.map((p) => {
    const alto = base.map((b, i) => b + (tr[i].progetti.find((x) => x.id === p.id)?.margineCum ?? 0));
    const el = <polygon key={p.id} points={poli(alto, base)} fill={p.colore} opacity={0.9}><title>{p.nome}</title></polygon>;
    base = alto;
    return el;
  });
  const inv = tr.map((q) => -q.investimento), tot = tr.map((q) => -(q.investimento + q.piattaformaCum));
  const ip = piano.indicePareggio;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', maxHeight: 340 }} role="img" aria-label={etichetta}>
      <g fontFamily="Metropolis, Arial">
        {tacche.map((v) => (
          <g key={v}>
            {v !== 0 && <line x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke="var(--line-soft)" strokeWidth={0.75} strokeDasharray="2 3" />}
            <text x={X0 - 7} y={py(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{v > 0 ? '+' : ''}{k(v)}</text>
          </g>
        ))}
        {aree}
        <polygon points={poli(inv, new Array(n).fill(0))} fill="var(--line-strong)" opacity={0.35}><title>{t('bp.investimentoRiga')}</title></polygon>
        <polygon points={poli(tot, inv)} fill="var(--signal-negative)" opacity={0.3}><title>{t('bp.costiPiattaforma')}</title></polygon>
        <line x1={X0} y1={py(0)} x2={X1} y2={py(0)} stroke="var(--ink-primary)" strokeWidth={1.2} />
        <polyline points={tr.map((q, i) => `${px(i).toFixed(1)},${py(q.netto).toFixed(1)}`).join(' ')} fill="none" stroke="var(--ink-primary)" strokeWidth={2.2} strokeLinejoin="round" />
        {ip >= 0 && (
          <>
            <line x1={px(ip)} y1={y0} x2={px(ip)} y2={y1} stroke="var(--signal-positive)" strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={px(ip)} cy={py(tr[ip].netto)} r={4.5} fill="var(--ink-primary)" stroke="var(--surface-card)" strokeWidth={2} />
            <text x={px(ip) + (ip > n * 0.7 ? -6 : 6)} y={y0 + 10} textAnchor={ip > n * 0.7 ? 'end' : 'start'} fontSize="10.5" fontWeight={700} fill="var(--signal-positive)">{t('bp.pareggioIl', { q: piano.pareggio! })}</text>
          </>
        )}
        {tr.map((q, i) => (
          <g key={q.etichetta}>
            <line x1={px(i)} y1={y1} x2={px(i)} y2={y1 + 4} stroke="var(--line-strong)" />
            {i % 2 === 0 && <text x={px(i)} y={y1 + 18} textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">{q.etichetta}</text>}
            <rect x={px(i) - (X1 - X0) / (2 * (n - 1))} y={y0} width={(X1 - X0) / (n - 1)} height={y1 - y0} fill="transparent">
              <title>{[q.etichetta, ...progetti.map((p) => `${p.nome}: ${euro(q.progetti.find((x) => x.id === p.id)?.margineCum ?? 0)}`),
                `${t('bp.investimentoRiga')}: ${euro(-q.investimento)}`, `${t('bp.costiPiattaforma')}: ${euro(-q.piattaformaCum)}`, `${t('bp.nettoLinea')}: ${euro(q.netto)}`].join('\n')}</title>
            </rect>
          </g>
        ))}
        <text x={X0 - 7} y={y0 - 8} textAnchor="end" fontSize="9" fill="var(--ink-muted)">{alta > 0 ? '€' : ''}</text>
      </g>
    </svg>
  );
}

/** Per trimestre: a sinistra i ricavi impilati per progetto, a destra i costi (diretti e di piattaforma). */
export function RicaviCosti({ piano, progetti, etichetta }: { piano: Piano; progetti: VoceProgetto[]; etichetta: string }) {
  const t = useT();
  const tr = piano.trimestri, n = tr.length;
  const y0 = 16, y1 = 204, H = 236;
  const max = Math.max(1, ...tr.map((q) => Math.max(q.ricavi, q.costiDiretti + q.piattaforma)));
  const { alta, tacche, py } = assi(0, max, y0, y1);
  const passo = (X1 - X0) / n, bw = Math.min(14, passo * 0.34);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', maxHeight: 320 }} role="img" aria-label={etichetta}>
      <g fontFamily="Metropolis, Arial">
        {tacche.map((v) => (
          <g key={v}>
            <line x1={X0} y1={py(v)} x2={X1} y2={py(v)} stroke={v === 0 ? 'var(--ink-primary)' : 'var(--line-soft)'} strokeWidth={v === 0 ? 1.2 : 0.75} strokeDasharray={v === 0 ? undefined : '2 3'} />
            <text x={X0 - 7} y={py(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{k(v)}</text>
          </g>
        ))}
        {tr.map((q, i) => {
          const cx = X0 + passo * (i + 0.5);
          let yR = py(0), yC = py(0);
          const ricavi = progetti.map((p) => {
            const v = Math.max(0, q.progetti.find((x) => x.id === p.id)?.ricavi ?? 0), h = py(0) - py(v);
            yR -= h;
            return <rect key={p.id} x={cx - bw - 1} y={yR} width={bw} height={h} fill={p.colore} />;
          });
          const costo = (v: number, fill: string, key: string) => { const h = py(0) - py(Math.max(0, v)); yC -= h; return <rect key={key} x={cx + 1} y={yC} width={bw} height={h} fill={fill} />; };
          return (
            <g key={q.etichetta}>
              {ricavi}
              {costo(q.costiDiretti, 'var(--ink-muted)', 'd')}
              {costo(q.piattaforma, 'var(--signal-negative)', 'p')}
              {i % 2 === 0 && <text x={cx} y={y1 + 16} textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">{q.etichetta}</text>}
              <rect x={cx - passo / 2} y={y0} width={passo} height={y1 - y0} fill="transparent">
                <title>{[q.etichetta, `${t('bp.ricavi')}: ${euro(q.ricavi)}`, `${t('bp.costiDiretti')}: ${euro(q.costiDiretti)}`, `${t('bp.costiPiattaforma')}: ${euro(q.piattaforma)}`, `${t('bp.margine')}: ${euro(q.margine)}`].join('\n')}</title>
              </rect>
            </g>
          );
        })}
        <text x={X0 - 7} y={y0 - 5} textAnchor="end" fontSize="9" fill="var(--ink-muted)">{alta > 0 ? '€' : ''}</text>
      </g>
    </svg>
  );
}
