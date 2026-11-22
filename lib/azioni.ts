'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { configAttiva, configVersione, offerta } from '@/lib/dati';
import { bloccanti, nuovaOfferta, sintesi, type Config, type Offerta, type StatoValore } from '@/lib/engine';

export async function creaOfferta(form: FormData) {
  const cliente = String(form.get('cliente') || '').trim();
  if (!cliente) redirect('/monitoraggio/offerte?errore=cliente');
  const { versione, dati: cfg } = await configAttiva();
  const o = nuovaOfferta(cfg, cliente);
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').insert({
    cliente, approccio: o.approccio, dati: o, vincoli: o.vincoli, stati_valore: {},
    sintesi: sintesi(cfg, o, {}), config_versione: versione
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Creazione non riuscita');
  redirect(`/offerta/${data.id}/assessment`);
}

/** Duplica: i default della nuova offerta arrivano da quella di origine, non dal sistema. */
export async function duplicaOfferta(id: string) {
  const src = await offerta(id);
  if (!src) throw new Error('Offerta non trovata');
  const { versione, dati: cfg } = await configAttiva();
  const dati: Offerta = { ...src.dati, cliente: `${src.cliente} (copia)` };
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').insert({
    cliente: dati.cliente, approccio: dati.approccio, dati, vincoli: dati.vincoli,
    stati_valore: src.stati_valore, sintesi: sintesi(cfg, dati, src.stati_valore),
    config_versione: versione, origine_id: src.id
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Duplicazione non riuscita');
  redirect(`/offerta/${data.id}/assessment`);
}

export async function salvaOfferta(id: string, dati: Offerta, stati: Record<string, StatoValore>, snapshot = false) {
  const sb = await supabaseServer();
  const corrente = await offerta(id);
  if (!corrente) return { errore: 'Offerta non trovata' };
  if (corrente.stato === 'approvata') return { errore: "Un'offerta approvata non si modifica: duplicala" };
  const { dati: cfg } = await configVersione(corrente.config_versione);
  const s = sintesi(cfg, dati, stati);
  const { error } = await sb.from('offerte').update({
    cliente: dati.cliente, approccio: dati.approccio, dati, vincoli: dati.vincoli, stati_valore: stati, sintesi: s
  }).eq('id', id);
  if (error) return { errore: error.message };
  if (snapshot) {
    await sb.from('offerte_versioni').insert({
      offerta_id: id, stato: corrente.stato, dati, stati_valore: stati, vincoli: dati.vincoli, sintesi: s
    });
  }
  revalidatePath('/monitoraggio/offerte');
  return { ok: true };
}

export async function inviaInApprovazione(id: string) {
  const o = await offerta(id);
  if (!o) return { errore: 'Offerta non trovata' };
  const b = bloccanti(o.dati, o.stati_valore);
  if (b.length) return { bloccanti: b.length };
  return cambiaStato(id, 'in_approvazione');
}

/* Chi approva non è ancora definito (design v2 §15.3): per ora qualunque utente ALTEN.
   Quando il ruolo sarà deciso, il controllo va qui e in una policy RLS dedicata. */
export async function approva(id: string) {
  const o = await offerta(id);
  if (!o || o.stato !== 'in_approvazione') return { errore: "L'offerta non è in approvazione" };
  return cambiaStato(id, 'approvata');
}

async function cambiaStato(id: string, stato: 'in_approvazione' | 'approvata' | 'bozza') {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const o = await offerta(id);
  if (!o) return { errore: 'Offerta non trovata' };
  const extra = stato === 'approvata' ? { approvata_da: user?.id, approvata_il: new Date().toISOString() } : {};
  const { error } = await sb.from('offerte').update({ stato, ...extra }).eq('id', id);
  if (error) return { errore: error.message };
  await sb.from('offerte_versioni').insert({
    offerta_id: id, stato, dati: o.dati, stati_valore: o.stati_valore, vincoli: o.vincoli, sintesi: o.sintesi
  });
  revalidatePath(`/offerta/${id}`, 'layout');
  revalidatePath('/monitoraggio/offerte');
  return { ok: true };
}

export async function salvaConfig(dati: Config, nota: string) {
  if (!(dati.margineVenduto >= 0 && dati.margineVenduto < 1)) return { errore: 'Il margine deve stare fra 0 e 99%' };
  if (dati.figure.some((f) => !(f.costo > 0))) return { errore: 'Ogni figura deve avere un costo positivo' };
  if (!(dati.costiCondivisi.clientiAttivi >= 0)) return { errore: 'Clienti attivi non valido' };
  const sb = await supabaseServer();
  const { error } = await sb.from('configurazione').insert({ dati, nota: nota || null });
  if (error) return { errore: error.message };
  revalidatePath('/monitoraggio', 'layout');
  return { ok: true };
}
