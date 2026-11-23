'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approva, inviaInApprovazione } from '@/lib/azioni';
import { useT } from '@/lib/i18n/client';
import { Toast, useToast } from '@/components/Toast';

export function AzioniOfferta({ id, stato }: { id: string; stato: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const { toast, mostra } = useToast();
  const esegui = (f: () => Promise<{ errore?: string; ok?: boolean }>) => start(async () => {
    const r = await f();
    if (r.errore) mostra({ tipo: 'errore', testo: r.errore });
    else router.refresh();
  });
  const stile = { background: 'var(--brand-ochre)', color: 'var(--surface-brand)', borderColor: 'var(--brand-ochre)' };
  return (
    <>
      {stato === 'bozza' && (
        <button className="alt-btn alt-btn--primary" type="button" style={stile} disabled={pending}
          onClick={() => esegui(() => inviaInApprovazione(id))}>{t('az.inviaApprovazione')}</button>
      )}
      {stato === 'in_approvazione' && (
        <button className="alt-btn alt-btn--primary" type="button" style={stile} disabled={pending}
          onClick={() => esegui(() => approva(id))}>{t('az.approva')}</button>
      )}
      <Toast toast={toast} />
    </>
  );
}
