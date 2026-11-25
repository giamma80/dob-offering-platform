import { conferma } from './actions';
import { t as traduci } from '@/lib/i18n/server';
import { SelettoreLingua } from '@/components/SelettoreLingua';

export default async function Conferma({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string }> }) {
  const { token_hash, type } = await searchParams;
  const t = await traduci();
  return (
    <main className="alt-root login">
      <div className="login__top"><SelettoreLingua /></div>
      <div className="login__card">
        <img src="/alten-mark.png" alt="ALTEN" width={24} height={36} />
        <h1>{t('app.nome')}</h1>
        <form action={conferma}>
          <input type="hidden" name="token_hash" value={token_hash ?? ''} />
          <input type="hidden" name="type" value={type ?? 'email'} />
          <button className="alt-btn alt-btn--primary" type="submit">{t('login.accedi')}</button>
        </form>
      </div>
    </main>
  );
}
