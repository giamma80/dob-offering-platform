'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { attendiSalvataggio } from '@/lib/ui/salvataggio';
import { FASI, type Fase } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';

function Anello({ corrente }: { corrente: boolean }) {
  const r = 16, c = 2 * Math.PI * r, off = corrente ? 0 : c;
  const col = 'var(--accent-azure)';
  return (
    <svg viewBox="0 0 38 38" width="38" height="38" aria-hidden="true">
      <circle cx="19" cy="19" r={r} fill="none" stroke="var(--line-soft)" strokeWidth="4" />
      <circle cx="19" cy="19" r={r} fill="none" stroke={col} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 19 19)" />
    </svg>
  );
}

export function Timeline({ id, corrente }: { id: string; corrente: Fase }) {
  const t = useT();
  const router = useRouter();
  const ic = FASI.findIndex((f) => f.id === corrente);
  return (
    <nav className="tl" aria-label="Fasi">
      {FASI.map((f, i) => (
        <span key={f.id} style={{ display: 'contents' }}>
          {i > 0 && <span className={`tl__s${i <= ic ? ' on' : ''}`} />}
          <Link className="tl__n" href={`/offerta/${id}/${f.id}`}
            onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); void attendiSalvataggio().then(() => router.push(`/offerta/${id}/${f.id}`)); }}
            aria-current={f.id === corrente ? 'step' : undefined}>
            <span className="tl__r"><Anello corrente={f.id === corrente} /><b>{i + 1}</b></span>
            <span className="tl__t"><strong>{t(`fase.${f.id}` as Chiave)}</strong></span>
          </Link>
        </span>
      ))}
    </nav>
  );
}
