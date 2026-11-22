import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/* Rinnova la sessione Supabase a ogni richiesta e manda al login chi non è autenticato
   o non ha un indirizzo del dominio ammesso. */
export async function middleware(req: NextRequest) {
  /* Se Supabase rimanda al Site URL invece che al callback, il codice arriva su "/":
     lo inoltriamo al callback invece di perderlo nel redirect al login. */
  const code = req.nextUrl.searchParams.get('code');
  if (code && !req.nextUrl.pathname.startsWith('/auth')) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/callback';
    url.search = `?code=${encodeURIComponent(code)}`;
    return NextResponse.redirect(url);
  }
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        }
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const pubblico = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/auth');
  const dominio = (process.env.NEXT_PUBLIC_DOMINIO_AMMESSO || 'alten.it').toLowerCase();
  const ok = !!user?.email && user.email.toLowerCase().endsWith('@' + dominio);
  if (!ok && !pubblico) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|alten-mark.png|icon.png|apple-icon.png).*)']
};
