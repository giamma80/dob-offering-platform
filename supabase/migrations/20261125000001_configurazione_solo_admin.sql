-- Solo gianmarco.morelli@alten.it salva nuove versioni della configurazione di sistema
-- (costi e parametri). La lettura resta a tutti gli @alten.it: serve al calcolo delle offerte.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'gianmarco.morelli@alten.it', false)
$$;

drop policy if exists "alten versiona la configurazione" on public.configurazione;
create policy "admin versiona la configurazione" on public.configurazione
  for insert to authenticated with check ((select public.is_admin()));
