-- Le offerte si possono eliminare in qualunque stato (lo storico se ne va con loro, on delete cascade).
drop policy if exists "alten elimina bozze" on public.offerte;
create policy "alten elimina offerte" on public.offerte
  for delete to authenticated using ((select public.is_alten()));
create policy "alten elimina lo storico" on public.offerte_versioni
  for delete to authenticated using ((select public.is_alten()));
