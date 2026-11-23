'use client';

import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { esci } from '@/app/login/actions';
import { Icona } from '@/components/Icona';
import { useT } from '@/lib/i18n/client';

const Ctx = createContext('');

export function UtenteProvider({ email, children }: { email: string; children: React.ReactNode }) {
  return <Ctx.Provider value={email}>{children}</Ctx.Provider>;
}

/** Utente collegato, in fondo alla colonna di sinistra. Il menu si apre verso l'alto. */
export function MenuUtente() {
  const email = useContext(Ctx);
  const t = useT();
  const [aperto, setAperto] = useState(false);
  const radice = useRef<HTMLDivElement>(null);
  const pulsante = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const idMenu = useId();

  const chiudi = (rifocalizza = true) => { setAperto(false); if (rifocalizza) pulsante.current?.focus(); };

  useEffect(() => {
    if (!aperto) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const fuori = (e: PointerEvent) => { if (!radice.current?.contains(e.target as Node)) chiudi(false); };
    document.addEventListener('pointerdown', fuori);
    return () => document.removeEventListener('pointerdown', fuori);
  }, [aperto]);

  const tasti = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); chiudi(); return; }
    if (e.key === 'Tab') { chiudi(false); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const voci = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = voci.indexOf(document.activeElement as HTMLElement);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? voci.length - 1
      : (i + (e.key === 'ArrowDown' ? 1 : -1) + voci.length) % voci.length;
    voci[j]?.focus();
  };

  const iniziale = (email.split('@')[0]?.[0] ?? '?').toUpperCase();

  return (
    <div className="utente" ref={radice}>
      {aperto && (
        <div className="utente__menu" role="menu" id={idMenu} ref={menu} aria-label={t('utente.menu')} onKeyDown={tasti}>
          <div className="utente__chi" title={email}>{email}</div>
          <form action={esci}>
            <button type="submit" role="menuitem" className="utente__voce">
              <Icona nome="uscita" />{t('comune.esci')}
            </button>
          </form>
        </div>
      )}
      <button ref={pulsante} type="button" className="utente__btn" title={email}
        aria-haspopup="menu" aria-expanded={aperto} aria-controls={aperto ? idMenu : undefined} aria-label={t('utente.menu')}
        onClick={() => setAperto((a) => !a)}
        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setAperto(true); } }}>
        <span className="utente__avatar" aria-hidden="true">{iniziale}</span>
        <span className="utente__email">{email}</span>
      </button>
    </div>
  );
}
