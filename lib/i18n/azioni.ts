'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function impostaLingua(l: 'it' | 'en') {
  (await cookies()).set('lingua', l === 'en' ? 'en' : 'it', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  revalidatePath('/', 'layout');
}
