import 'server-only';
import { cookies } from 'next/headers';
import { traduttore, type Lingua } from './dizionari';

export async function lingua(): Promise<Lingua> {
  const c = (await cookies()).get('lingua')?.value;
  return c === 'en' ? 'en' : 'it';
}

export async function t() {
  return traduttore(await lingua());
}
