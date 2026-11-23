-- Data di avvio reale del progetto: il business plan conta i contributi da qui.
-- Se manca, vale la data di approvazione.
alter table public.offerte add column if not exists avviata_il date;
comment on column public.offerte.avviata_il is 'Avvio reale del progetto; se nullo il business plan usa approvata_il';
