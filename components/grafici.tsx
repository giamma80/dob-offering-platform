'use client';

import { useState } from 'react';
import { euro, perc } from '@/lib/ui/formato';
import { useT } from '@/lib/i18n/client';
import type { PuntoTrimestre } from '@/lib/engine';

/* Grafici del mockup (cvv2/area.py, m5.py) portati in React. SVG puro, colori dai token. */

const k = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000).toLocaleString('it-IT')} k` : `${Math.round(v)}`);

export interface Livello { colore: string; nome: string; valori: number[] }

/** Area impilata cumulata sui mesi, con linea tratteggiata dei costi. */
export function AreaCumulata({ livelli, costo, etichettaCosti, etichetta, h = 260, w = 900 }: {
  livelli: Livello[]; costo?: number[]; etichettaCosti?: string; etichetta: string; h?: number; w?: number;
}) {
  const t = useT();
  const mesi = livelli[0].valori.length - 1;
  const x0 = 58, x1 = w - 92, y0 = 14, y1 = h - 34;
  const tot = (m: number) => livelli.reduce((a, l) => a + l.valori[m], 0);
  const ymax = Math.max(tot(mesi), costo ? Math.max(...costo) : 0, 1) * 1.08;
  const px = (m: number) => x0 + (m * (x1 - x0)) / mesi;
  const py = (v: number) => y1 - (v / ymax) * (y1 - y0);
  let base = new Array(mesi + 1).fill(0) as number[];
  const poligoni = livelli.map((l) => {
    const top = base.map((b, m) => b + l.valori[m]);
    const pts = top.map((v, m) => `${px(m).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
    const bot = base.map((v, m) => `${px(m).toFixed(1)},${py(v).toFixed(1)}`).reverse().join(' ');
    base = top;
    return <polygon key={l.nome} points={`${pts} ${bot}`} fill={l.colore} opacity={0.92}><title>{l.nome}</title></polygon>;
  });
  const contorno = base.map((v, m) => `${px(m).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', height: 'auto', maxHeight: 320 }} role="img" aria-label={etichetta}>
      <g fontFamily="Metropolis, Arial" fontSize="10" fill="var(--ink-muted)">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (ymax * i) / 4;
          return (
            <g key={i}>
              <line x1={x0} y1={py(v)} x2={x1} y2={py(v)} stroke="var(--line-soft)" opacity={0.6} />
              <text x={x0 - 7} y={py(v) + 3} textAnchor="end">{k(v)}</text>
            </g>
          );
        })}
        {poligoni}
        <polyline points={contorno} fill="none" stroke="var(--surface-brand)" strokeWidth={1.6} />
        {costo && (
          <>
            <polyline points={costo.map((v, m) => `${px(m).toFixed(1)},${py(v).toFixed(1)}`).join(' ')}
              fill="none" stroke="var(--signal-negative)" strokeWidth={2} strokeDasharray="5 4" />
            <text x={x1 + 8} y={py(costo[mesi]) + 4} fontWeight={700} fill="var(--signal-negative)">{etichettaCosti} {k(costo[mesi])}</text>
          </>
        )}
        <text x={x1 + 8} y={py(base[mesi]) + 4} fontWeight={800} fill="var(--surface-brand)">{k(base[mesi])}</text>
        {[0, 12, 24, 36].filter((m) => m <= mesi).map((m) => (
          <g key={m}>
            <line x1={px(m)} y1={y1} x2={px(m)} y2={y1 + 4} stroke="var(--line-strong)" />
            <text x={px(m)} y={y1 + 16} textAnchor="middle">{m === 0 ? t('gr.avvio') : t('gr.anno', { n: m / 12 })}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Legenda({ voci }: { voci: { colore: string; nome: string; valore: string; nota?: string; tratteggio?: boolean }[] }) {
  return (
    <div className="legenda">
      {voci.map((v) => (
        <span key={v.nome}>
          <i style={v.tratteggio ? { background: 'none', border: '2px dashed var(--signal-negative)' } : { background: v.colore }} />
          {v.nome} <b>{v.valore}</b>{v.nota && <small>{v.nota}</small>}
        </span>
      ))}
    </div>
  );
}

/** Barra orizzontale spezzata con legenda; toggle € / % per mettere a fuoco cifre o percentuali. */
export function BarraComposizione({ parti, etichetta }: { parti: { cls: string; nome: string; valore: number }[]; etichetta: string }) {
  const [modo, setModo] = useState<'eur' | 'pct'>('eur');
  const tot = parti.reduce((a, p) => a + Math.max(0, p.valore), 0) || 1;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <span className="seg" role="radiogroup" aria-label={etichetta}>
          {(['eur', 'pct'] as const).map((m) => (
            <b key={m} role="radio" tabIndex={0} aria-checked={modo === m} className={modo === m ? 'on' : undefined}
              onClick={() => setModo(m)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setModo(m)}>{m === 'eur' ? '€' : '%'}</b>
          ))}
        </span>
      </div>
      <div className="bar" role="img" aria-label={etichetta}>
        {parti.filter((p) => p.valore > 0).map((p) => {
          const q = p.valore / tot;
          return <span key={p.nome} className={p.cls} style={{ flex: q }} title={`${p.nome}: ${euro(p.valore)} · ${perc(q)}`}>
            {q >= 0.11 ? (modo === 'eur' ? euro(p.valore) : perc(q)) : ''}
          </span>;
        })}
      </div>
      <div className="lg">
        {parti.map((p) => (
          <div key={p.nome} className={`lg__v ${p.cls}`}>
            <span className="lg__n">{p.nome}</span>
            <span className="lg__a">{modo === 'eur' ? euro(p.valore) : perc(p.valore / tot)}</span>
            <span className="lg__b">{modo === 'eur' ? perc(p.valore / tot) : euro(p.valore)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const IcArea = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 13L6 7l3 3 5-6v9z" fill="currentColor" fillOpacity=".25" /></svg>;
const IcBar = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="2" y="5" width="12" height="6" rx="1" /><path d="M7 5v6M11 5v6" /></svg>;

export type Scen = 'saas' | 'on_premise' | 'confronto';

/** Card con due letture dello stesso dato (area nel tempo o barra di composizione) e scelta dello scenario. */
export function CardVista({ id, titolo, icona, scenari, render }: {
  id: string; titolo: string; icona?: React.ReactNode; scenari: Scen[];
  render: (scenario: Scen, vista: 'area' | 'barre') => React.ReactNode;
}) {
  const t = useT();
  const [sc, setSc] = useState<Scen>(scenari[0]);
  const [vista, setVista] = useState<'area' | 'barre'>('area');
  const scelto = scenari.includes(sc) ? sc : scenari[0];
  return (
    <div className="alt-card" id={id}>
      <div className="alt-card__head">
        <h2 className="alt-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icona}{titolo}</h2>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          {scenari.length > 1 && (
            <span className="seg" role="radiogroup" aria-label={t('off.approccio')}>
              {scenari.map((s) => (
                <b key={s} role="radio" tabIndex={0} aria-checked={scelto === s} className={scelto === s ? 'on' : undefined}
                  onClick={() => setSc(s)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSc(s)}>
                  {t(s === 'confronto' ? 'gr.confronto' : s === 'saas' ? 'approccio.saas' : 'approccio.on_premise')}
                </b>
              ))}
            </span>
          )}
          <span className="seg" role="radiogroup" aria-label={t('gr.vista')}>
            <b role="radio" tabIndex={0} aria-checked={vista === 'area'} className={vista === 'area' ? 'on' : undefined}
              onClick={() => setVista('area')} onKeyDown={(e) => e.key === 'Enter' && setVista('area')}><IcArea /> {t('gr.area')}</b>
            <b role="radio" tabIndex={0} aria-checked={vista === 'barre'} className={vista === 'barre' ? 'on' : undefined}
              onClick={() => setVista('barre')} onKeyDown={(e) => e.key === 'Enter' && setVista('barre')}><IcBar /> {t('gr.barre')}</b>
          </span>
        </span>
      </div>
      <div className="alt-card__body">{render(scelto, vista)}</div>
    </div>
  );
}

/** Curva del margine cumulato contro l'investimento, con zona positiva/negativa e linea di pareggio. */
/** Passo "rotondo" per le tacche dell'asse: 1, 2, 2,5 o 5 × 10^n. */
function passoTacche(intervallo: number, tacche = 5) {
  const grezzo = intervallo / tacche || 1;
  const p = Math.pow(10, Math.floor(Math.log10(grezzo)));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= grezzo) ?? 10) * p;
}

export function CurvaRecupero({ punti, pareggio, etichetta }: { punti: PuntoTrimestre[]; pareggio: string | null; etichetta: string }) {
  const t = useT();
  const xs0 = 70, xs1 = 624, y0 = 24, y1 = 196;
  const vals = punti.map((p) => p.cumulato);
  const passo = passoTacche(Math.max(0, ...vals) - Math.min(0, ...vals));
  const lo = Math.floor(Math.min(0, ...vals) / passo) * passo;
  const hi = Math.max(passo, Math.ceil(Math.max(0, ...vals) / passo) * passo);
  const tacche: number[] = [];
  for (let v = lo; v <= hi + passo / 2; v += passo) tacche.push(Math.round(v));
  const px = (i: number) => xs0 + (i * (xs1 - xs0)) / Math.max(1, punti.length - 1);
  const py = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
  const zero = py(0);
  const pts = punti.map((p, i) => `${px(i).toFixed(0)},${py(p.cumulato).toFixed(0)}`).join(' ');
  const ip = pareggio ? punti.findIndex((p) => p.etichetta === pareggio) : -1;
  return (
    <svg viewBox="0 0 660 232" width="100%" style={{ display: 'block', height: 'auto', maxHeight: 340 }} role="img" aria-label={etichetta}>
      <g fontFamily="Metropolis, Arial">
        <rect x={xs0} y={y0} width={xs1 - xs0} height={Math.max(0, zero - y0)} fill="var(--signal-positive-soft)" />
        <rect x={xs0} y={zero} width={xs1 - xs0} height={Math.max(0, y1 - zero)} fill="var(--signal-negative-soft)" />
        {tacche.map((v) => (
          <g key={v}>
            {v !== 0 && <line x1={xs0} y1={py(v)} x2={xs1} y2={py(v)} stroke="var(--line-soft)" strokeWidth={0.75} strokeDasharray="2 3" />}
            <line x1={xs0 - 4} y1={py(v)} x2={xs0} y2={py(v)} stroke="var(--line-strong)" strokeWidth={1} />
            <text x={xs0 - 7} y={py(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {v > 0 ? '+' : ''}{passo % 1000 === 0 || Math.abs(v) < 1000 ? k(v) : `${(v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} k`}
            </text>
          </g>
        ))}
        <line x1={xs0} y1={y0} x2={xs0} y2={y1} stroke="var(--line-strong)" strokeWidth={1} />
        <line x1={xs0} y1={zero} x2={xs1} y2={zero} stroke="var(--line-strong)" strokeWidth={1.5} />
        <polygon points={`${xs0},${zero.toFixed(0)} ${pts} ${xs1},${zero.toFixed(0)}`} fill="var(--accent-azure)" opacity={0.12} />
        <polyline points={pts} fill="none" stroke="var(--accent-azure)" strokeWidth={2.5} />
        {punti.map((p, i) => (
          <circle key={p.etichetta} cx={px(i)} cy={py(p.cumulato)} r={3} fill={p.cumulato >= 0 ? 'var(--signal-positive)' : 'var(--surface-brand)'}>
            <title>{`${p.etichetta}: ${euro(p.cumulato)}`}</title>
          </circle>
        ))}
        {ip >= 0 && (
          <>
            <line x1={px(ip)} y1={y0} x2={px(ip)} y2={y1} stroke="var(--signal-positive)" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={px(ip) + 6} y={38} fontSize="10.5" fontWeight={700} fill="var(--signal-positive)">{t('bp.pareggioIl', { q: pareggio! })}</text>
          </>
        )}
        {punti.map((p, i) => (
          <g key={p.etichetta}>
            <line x1={px(i)} y1={y1} x2={px(i)} y2={y1 + 4} stroke="var(--line-strong)" strokeWidth={1} />
            {i % 2 === 0 && <text x={px(i)} y={212} textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">{p.etichetta}</text>}
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Anello grande dello stato di approvazione. */
export function AnelloGrande({ pct }: { pct: number }) {
  const c = 2 * Math.PI * 20;
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--line-soft)" strokeWidth="5" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--accent-azure)" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
    </svg>
  );
}
