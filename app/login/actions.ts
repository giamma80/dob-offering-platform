'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { emailAmmessa, supabaseServer } from '@/lib/supabase/server';

export async function inviaLink(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (!emailAmmessa(email)) redirect('/login?stato=dominio');
  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: true }
  });
  if (error?.status === 429 || error?.code === 'over_email_send_rate_limit') redirect('/login?stato=limite');
  redirect(error ? '/login?stato=errore' : '/login?stato=inviato');
}

export async function esci() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
