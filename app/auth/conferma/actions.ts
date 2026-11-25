'use server';

import { redirect } from 'next/navigation';
import { emailAmmessa, supabaseServer } from '@/lib/supabase/server';

const TIPI = ['email', 'magiclink', 'signup', 'recovery'] as const;
type Tipo = (typeof TIPI)[number];

/* Il token si consuma solo qui, con un clic della persona: un controllo automatico del link nella posta
   (che apre l'indirizzo ma non preme il pulsante) non lo brucia. */
export async function conferma(form: FormData) {
  const tokenHash = String(form.get('token_hash') || '');
  const tipo = String(form.get('type') || 'email') as Tipo;
  if (!tokenHash || !TIPI.includes(tipo)) redirect('/login?stato=errore');
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
  if (error || !emailAmmessa(data.user?.email)) {
    if (!error) await supabase.auth.signOut();
    redirect('/login?stato=errore');
  }
  redirect('/monitoraggio/offerte');
}
