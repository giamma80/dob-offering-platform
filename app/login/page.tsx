import { inviaLink } from './actions';
import { t as traduci } from '@/lib/i18n/server';
import { SelettoreLingua } from '@/components/SelettoreLingua';

export default async function Login({ searchParams }: { searchParams: Promise<{ stato?: string }> }) {
  const { stato } = await searchParams;
  const t = await traduci();
  return (
    <main className="alt-root login">
      <div className="login__top"><SelettoreLingua /></div>
      <div className="login__card">
        <img src="/alten-mark.png" alt="ALTEN" width={24} height={36} />
        <h1>{t('app.nome')}</h1>
        {stato === 'inviato' ? (
          <p role="status">{t('login.inviato')}</p>
        ) : (
          <form action={inviaLink}>
            <label className="campo">
              <span>{t('login.email')}</span>
              <span className="alt-inputwrap">
                <input className="alt-input" type="email" name="email" required autoComplete="email"
                  aria-invalid={stato === 'dominio' || stato === 'errore' ? true : undefined}
                  aria-describedby={stato ? 'login-err' : undefined} />
              </span>
            </label>
            {stato === 'dominio' && <p id="login-err" className="alt-field__msg alt-field--err">{t('login.dominio')}</p>}
            {stato === 'errore' && <p id="login-err" className="alt-field__msg alt-field--err">{t('login.errore')}</p>}
            <button className="alt-btn alt-btn--primary" type="submit">{t('login.invia')}</button>
          </form>
        )}
      </div>
    </main>
  );
}
