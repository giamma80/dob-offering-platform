-- DOB Offering Platform — schema
-- Due oggetti: la configurazione di sistema (una riga per versione) e le offerte.
-- Gli input di un'offerta vivono in un documento jsonb: il motore di calcolo (lib/engine)
-- li legge così come sono, e lo schema non va migrato ogni volta che si aggiunge una leva.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- accesso
-- Solo utenti autenticati con email @alten.it. È l'unico controllo di accesso dell'app:
-- ogni policy passa da questa funzione.
create or replace function public.is_alten()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%@alten.it', false)
$$;

-- Rifiuta la registrazione di indirizzi esterni (hook "before user created").
-- Va attivato da Authentication > Hooks nella dashboard Supabase.
create or replace function public.hook_solo_alten(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  if lower(event -> 'user' ->> 'email') like '%@alten.it' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403, 'message', 'Accesso riservato agli indirizzi @alten.it'));
end;
$$;
grant execute on function public.hook_solo_alten(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_solo_alten(jsonb) from authenticated, anon, public;

-- ---------------------------------------------------------- configurazione
-- Parametri di sistema: costi delle figure, margine sul venduto, costi condivisi,
-- catalogo connettori/CI-CD, modalità AI. Ogni salvataggio crea una nuova versione;
-- la versione attiva è l'ultima. Un'offerta registra la versione con cui è stata calcolata.
create table public.configurazione (
  versione     bigint generated always as identity primary key,
  dati         jsonb       not null,
  nota         text,
  creata_il    timestamptz not null default now(),
  creata_da    uuid        references auth.users (id) default auth.uid()
);

create view public.configurazione_attiva
with (security_invoker = true) as
  select * from public.configurazione order by versione desc limit 1;

-- ------------------------------------------------------------------ offerte
create type public.stato_offerta as enum ('bozza', 'in_approvazione', 'approvata', 'archiviata');
create type public.approccio as enum ('saas', 'on_premise', 'entrambi');

create table public.offerte (
  id                 uuid primary key default gen_random_uuid(),
  cliente            text not null,
  titolo             text,
  stato              public.stato_offerta not null default 'bozza',
  approccio          public.approccio     not null default 'entrambi',
  -- input dell'offerta: volumi, soluzione, stima, leve. Forma: lib/engine/types.ts → Offerta
  dati               jsonb not null default '{}'::jsonb,
  -- stato di ogni valore: { "<percorso>": "assunto" | "dichiarato" | "confermato" }
  stati_valore       jsonb not null default '{}'::jsonb,
  -- vincoli di progetto attivi: { "<id_vincolo>": true | false }
  vincoli            jsonb not null default '{}'::jsonb,
  -- risultato dell'ultimo calcolo, per elenchi e business plan senza ricalcolare
  sintesi            jsonb,
  config_versione    bigint references public.configurazione (versione),
  origine_id         uuid references public.offerte (id) on delete set null,  -- offerta da cui è stata richiamata
  creata_da          uuid references auth.users (id) default auth.uid(),
  creata_il          timestamptz not null default now(),
  aggiornata_il      timestamptz not null default now(),
  approvata_da       uuid references auth.users (id),
  approvata_il       timestamptz
);
create index offerte_stato_idx on public.offerte (stato);
create index offerte_aggiornata_idx on public.offerte (aggiornata_il desc);
create index offerte_origine_idx on public.offerte (origine_id);
create index offerte_config_idx on public.offerte (config_versione);
create index offerte_creata_da_idx on public.offerte (creata_da);
create index offerte_approvata_da_idx on public.offerte (approvata_da);
create index configurazione_creata_da_idx on public.configurazione (creata_da);

-- storico: uno snapshot a ogni salvataggio esplicito o cambio di stato
create table public.offerte_versioni (
  id           bigint generated always as identity primary key,
  offerta_id   uuid not null references public.offerte (id) on delete cascade,
  stato        public.stato_offerta not null,
  dati         jsonb not null,
  stati_valore jsonb not null,
  vincoli      jsonb not null,
  sintesi      jsonb,
  creata_il    timestamptz not null default now(),
  creata_da    uuid references auth.users (id) default auth.uid()
);
create index offerte_versioni_offerta_idx on public.offerte_versioni (offerta_id, creata_il desc);
create index offerte_versioni_creata_da_idx on public.offerte_versioni (creata_da);

create or replace function public.tocca_offerta()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.aggiornata_il := now();
  return new;
end;
$$;
create trigger offerte_aggiornata before update on public.offerte
  for each row execute function public.tocca_offerta();

-- ---------------------------------------------------------------------- RLS
alter table public.configurazione   enable row level security;
alter table public.offerte          enable row level security;
alter table public.offerte_versioni enable row level security;

create policy "alten legge la configurazione" on public.configurazione
  for select to authenticated using ((select public.is_alten()));
create policy "alten versiona la configurazione" on public.configurazione
  for insert to authenticated with check ((select public.is_alten()));

create policy "alten legge le offerte" on public.offerte
  for select to authenticated using ((select public.is_alten()));
create policy "alten crea offerte" on public.offerte
  for insert to authenticated with check ((select public.is_alten()));
create policy "alten modifica offerte" on public.offerte
  for update to authenticated using ((select public.is_alten())) with check ((select public.is_alten()));
create policy "alten elimina bozze" on public.offerte
  for delete to authenticated using ((select public.is_alten()) and stato = 'bozza');

create policy "alten legge lo storico" on public.offerte_versioni
  for select to authenticated using ((select public.is_alten()));
create policy "alten scrive lo storico" on public.offerte_versioni
  for insert to authenticated with check ((select public.is_alten()));

revoke all on public.configurazione, public.offerte, public.offerte_versioni from anon;
revoke all on public.configurazione_attiva from anon;
