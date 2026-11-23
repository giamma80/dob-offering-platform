'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { eliminaOfferta } from '@/lib/azioni';
import { useT } from '@/lib/i18n/client';
import { Toast, useToast } from '@/components/Toast';

/** Elimina con conferma in due passi: il primo clic arma il pulsante, il secondo elimina. */
export function EliminaOfferta({ id, cliente }: { id: string; cliente: string }) {
  const t = useT();
  const { toast, mostra } = useToast();
  const router = useRouter();
  const [armato, setArmato] = useState(false);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <>
    <Toast toast={toast} />
    <button type="button" disabled={pending}
      className={`alt-btn ${armato ? 'alt-btn--danger' : 'alt-btn--ghost'}`}
      title={armato ? t('off.eliminaConferma', { v: cliente }) : t('off.elimina')}
      aria-label={armato ? t('off.eliminaConferma', { v: cliente }) : `${t('off.elimina')} ${cliente}`}
      onBlur={() => setArmato(false)}
      onClick={() => {
        if (!armato) {
          setArmato(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setArmato(false), 4000);
          return;
        }
        start(async () => {
          const r = await eliminaOfferta(id);
          if (r.errore) mostra({ tipo: 'errore', testo: r.errore });
          else router.refresh();
        });
      }}>
      {armato ? t('off.eliminaSi') : t('off.elimina')}
    </button>
    </>
  );
}
