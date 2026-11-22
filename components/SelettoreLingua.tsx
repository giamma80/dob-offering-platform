'use client';

import { useTransition } from 'react';
import { impostaLingua } from '@/lib/i18n/azioni';
import { useLingua, useT } from '@/lib/i18n/client';

/** Selettore lingua in alto a destra: segmented control IT / EN. */
export function SelettoreLingua({ suScuro = true }: { suScuro?: boolean }) {
  const l = useLingua();
  const t = useT();
  const [, start] = useTransition();
  return (
    <nav className={`area${suScuro ? '' : ' area--chiaro'}`} aria-label={t('comune.lingua')}>
      {(['it', 'en'] as const).map((x) => (
        <button key={x} type="button" lang={x} aria-current={l === x ? 'true' : undefined}
          onClick={() => start(() => impostaLingua(x))}>{x.toUpperCase()}</button>
      ))}
    </nav>
  );
}
