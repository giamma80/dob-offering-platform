'use client';

import { leggiNumero } from '@/lib/ui/numero';
import { useEffect, useState } from 'react';
import type { ModalitaAi, Offerta, Risultato } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import { euro } from '@/lib/ui/formato';

/* Leve commerciali: footer fisso su due righe, etichette sopra e controlli sotto (mockup guscio.py FOOTER). */
function Leva({ etichetta, valore, max, onChange, disabilitata }: {
  etichetta: string; valore: number; max: number; onChange: (v: number) => void; disabilitata?: boolean;
}) {
  const [testo, setTesto] = useState(valore.toLocaleString('it-IT'));
  useEffect(() => setTesto(valore.toLocaleString('it-IT')), [valore]);
  const conferma = () => {
    const v = leggiNumero(testo);
    if (Number.isFinite(v) && v >= 0) onChange(v); else setTesto(valore.toLocaleString('it-IT'));
  };
  return (
    <div className="foot__c">
      <span className="foot__v">
        <input value={testo} aria-label={etichetta} disabled={disabilitata} inputMode="decimal"
          onChange={(e) => setTesto(e.target.value)} onBlur={conferma} onKeyDown={(e) => e.key === 'Enter' && conferma()} />
        <span>€</span>
      </span>
      <input className="foot__r" type="range" min={0} max={max} step={1000} value={valore} disabled={disabilitata}
        aria-label={etichetta} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function Footer({ o, r, solaLettura, onCanone, onSoftware, onAi }: {
  o: Offerta; r: Risultato; solaLettura: boolean;
  onCanone: (v: number) => void; onSoftware: (v: number) => void; onAi: (m: ModalitaAi) => void;
}) {
  const t = useT();
  const saas = o.approccio !== 'on_premise';
  const onp = o.approccio !== 'saas';
  return (
    <footer className="foot" aria-label={t('leva.canoneSaas')}>
      <span className="foot__n">{t('leva.canoneSaas')}</span>
      <span className="foot__n" title={onp ? `${t('pr.software')} ${euro(r.onPremise.licenza.software)} + ${t('so.manutenzione')} ${euro(r.onPremise.licenza.manutenzione)} + ${t('pr.aiRif')} ${euro(r.onPremise.licenza.aiRifatturata)}` : undefined}>
        {t('leva.softwareOnp')}
        {onp && r.onPremise.licenza.totale !== o.leve.softwareOnPremise && (
          <span className="foot__lic"> · {t('leva.licenzaOnp', { v: euro(r.onPremise.licenza.totale) })}</span>
        )}
      </span>
      <span className="foot__n">{t('leva.aiOnp')}</span>
      <span className="foot__n r">{t('leva.primoSaas')}</span>
      <span className="foot__n r">{t('leva.primoOnp')}</span>
      <Leva etichetta={t('leva.canoneSaas')} valore={r.saas.licenza.software} max={300000} onChange={onCanone} disabilitata={solaLettura || !saas} />
      <Leva etichetta={t('leva.softwareOnp')} valore={o.leve.softwareOnPremise} max={200000} onChange={onSoftware} disabilitata={solaLettura || !onp} />
      <div className="foot__c">
        <span className="foot__seg" role="radiogroup" aria-label={t('leva.aiOnp')}>
          {(['incluso', 'proxy', 'cliente'] as const).map((m) => (
            <b key={m} role="radio" tabIndex={0} aria-checked={o.leve.aiOnPremise === m}
              className={o.leve.aiOnPremise === m ? 'on' : undefined}
              aria-disabled={solaLettura || !onp}
              onClick={() => !solaLettura && onp && onAi(m)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !solaLettura && onp && onAi(m)}>
              {t(`leva.ai.${m}`)}
            </b>
          ))}
        </span>
      </div>
      <span className="foot__t">{saas ? euro(r.saas.primoAnno.prezzo) : '—'}</span>
      <span className="foot__t">{onp ? euro(r.onPremise.primoAnno.prezzo) : '—'}</span>
    </footer>
  );
}
