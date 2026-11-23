'use client';

import { useEffect, useId, useState } from 'react';
import type { StatoValore } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';

const fmt = (v: number) => (Number.isFinite(v) ? v.toLocaleString('it-IT', { useGrouping: 'always', maximumFractionDigits: 4 }) : '');

/** Campo numerico del design system: virgola decimale, errore sotto il campo (componente Validation). */
export function CampoNumero({ etichetta, valore, onChange, suffisso, min, max, passo, compatto, stato, onStato }: {
  etichetta: string;
  valore: number;
  onChange: (v: number) => void;
  suffisso?: string;
  min?: number;
  max?: number;
  passo?: number;
  compatto?: boolean;
  stato?: StatoValore;
  onStato?: (s: StatoValore) => void;
}) {
  const id = useId();
  const t = useT();
  const [testo, setTesto] = useState(fmt(valore));
  const [errore, setErrore] = useState<string | null>(null);
  useEffect(() => { setTesto(fmt(valore)); }, [valore]);

  const conferma = (s: string) => {
    const v = Number(s.replace(/\./g, '').replace(',', '.'));
    if (s.trim() === '' || !Number.isFinite(v)) return setErrore(t('val.numero'));
    if (min !== undefined && v < min) return setErrore(t('val.min', { v: fmt(min) }));
    if (max !== undefined && v > max) return setErrore(t('val.max', { v: fmt(max) }));
    setErrore(null);
    if (v !== valore) { onChange(v); if (onStato && stato === 'assunto') onStato('dichiarato'); }
  };

  const input = (
    <span className={`alt-inputwrap${stato === 'assunto' ? ' st-a' : stato === 'confermato' ? ' st-c' : ''}`}
      style={compatto ? { maxWidth: suffisso && suffisso.length > 2 ? 160 : 120, display: 'inline-flex' } : undefined} data-err={errore ? '' : undefined}>
      <input id={id} className="alt-input" inputMode="decimal" value={testo} step={passo}
        aria-label={compatto ? etichetta : undefined}
        aria-invalid={errore ? true : undefined} aria-describedby={errore ? `${id}-e` : undefined}
        onChange={(e) => setTesto(e.target.value)} onBlur={(e) => conferma(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') conferma((e.target as HTMLInputElement).value); }}
        style={{ textAlign: 'right' }} />
      {suffisso && <span className="alt-inputwrap__suffix">{suffisso}</span>}
    </span>
  );
  const err = errore ? <span id={`${id}-e`} className="alt-field__msg alt-field--err">{errore}</span> : null;
  if (compatto) return <>{input}{err}</>;
  return (
    <label className="campo" htmlFor={id}>
      <span>{etichetta}{onStato && stato && <StatoPulsanti stato={stato} onStato={onStato} />}</span>
      {input}{err}
    </label>
  );
}

export function StatoPulsanti({ stato, onStato }: { stato: StatoValore; onStato: (s: StatoValore) => void }) {
  const t = useT();
  return (
    <span className="stv" role="group" aria-label={t('val.statoValore')}>
      <button type="button" title={t('val.assunto')} aria-label={t('val.assunto')} aria-pressed={stato === 'assunto'} onClick={() => onStato('assunto')}>A</button>
      <button type="button" title={t('val.dichiarato')} aria-label={t('val.dichiarato')} aria-pressed={stato === 'dichiarato'} onClick={() => onStato('dichiarato')}>D</button>
      <button type="button" className="c" title={t('val.confermato')} aria-label={t('val.confermato')} aria-pressed={stato === 'confermato'} onClick={() => onStato('confermato')}>✓</button>
    </span>
  );
}
