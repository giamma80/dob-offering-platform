'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { configAttiva, configOfferta, offerta } from '@/lib/dati';
import { nuovaOfferta, sintesi, sviluppoTotale, type Config, type Offerta } from '@/lib/engine';

export async function creaOfferta(form: FormData) {
  const cliente = String(form.get('cliente') || '').trim();
  if (!cliente) redirect('/monitoraggio/offerte?errore=cliente');
  const { versione, dati: cfg } = await configAttiva();
  const o = nuovaOfferta(cfg, cliente);
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').insert({
    cliente, approccio: o.approccio, dati: o, vincoli: o.vincoli, stati_valore: {},
    sintesi: sintesi(cfg, o), config_versione: versione
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Creazione non riuscita');
  redirect(`/offerta/${data.id}/assessment`);
}

/** Duplica: i default della nuova offerta arrivano da quella di origine, non dal sistema. */
/** Elimina un'offerta in qualunque stato, con il suo storico. Irreversibile: la conferma sta nell'interfaccia. */
export async function eliminaOfferta(id: string) {
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').delete().eq('id', id).select('id');
  if (error) return { errore: error.message };
  if (!data?.length) return { errore: 'Offerta non trovata' };
  revalidatePath('/monitoraggio', 'layout');
  return { ok: true };
}

export async function duplicaOfferta(id: string) {
  const src = await offerta(id);
  if (!src) throw new Error('Offerta non trovata');
  const { versione, dati: cfg } = await configAttiva();
  const dati: Offerta = { ...src.dati, cliente: `${src.cliente} (copia)` };
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').insert({
    cliente: dati.cliente, approccio: dati.approccio, dati, vincoli: dati.vincoli,
    stati_valore: {}, sintesi: sintesi(cfg, dati),
    config_versione: versione, origine_id: src.id
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Duplicazione non riuscita');
  redirect(`/offerta/${data.id}/assessment`);
}

export async function salvaOfferta(id: string, dati: Offerta, snapshot = false) {
  const sb = await supabaseServer();
  const corrente = await offerta(id);
  if (!corrente) return { errore: 'Offerta non trovata' };
  if (corrente.stato === 'approvata') return { errore: "Un'offerta approvata non si modifica: duplicala" };
  /* una bozza si ricalcola sempre con l'ultima versione dei parametri e la registra */
  const { versione, dati: cfg } = await configOfferta(corrente);
  const s = sintesi(cfg, dati);
  const { error } = await sb.from('offerte').update({
    cliente: dati.cliente, approccio: dati.approccio, dati, vincoli: dati.vincoli, sintesi: s,
    ...(corrente.stato === 'bozza' ? { config_versione: versione } : {})
  }).eq('id', id);
  if (error) return { errore: error.message };
  if (snapshot) {
    await sb.from('offerte_versioni').insert({
      offerta_id: id, stato: corrente.stato, dati, stati_valore: {}, vincoli: dati.vincoli, sintesi: s
    });
  }
  revalidatePath('/monitoraggio/offerte');
  return { ok: true };
}

export async function inviaInApprovazione(id: string) {
  const o = await offerta(id);
  if (!o) return { errore: 'Offerta non trovata' };
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
  const extra: Record<string, unknown> = stato === 'approvata' ? { approvata_da: user?.id, approvata_il: new Date().toISOString() } : {};
  /* all'invio in approvazione la versione dei parametri si congela: l'ultima, con la sintesi ricalcolata */
  if (stato === 'in_approvazione' && o.stato === 'bozza') {
    const { versione, dati: cfg } = await configAttiva();
    extra.config_versione = versione;
    extra.sintesi = sintesi(cfg, o.dati);
  }
  const { error } = await sb.from('offerte').update({ stato, ...extra }).eq('id', id);
  if (error) return { errore: error.message };
  await sb.from('offerte_versioni').insert({
    offerta_id: id, stato, dati: o.dati, stati_valore: o.stati_valore, vincoli: o.vincoli, sintesi: o.sintesi
  });
  revalidatePath(`/offerta/${id}`, 'layout');
  revalidatePath('/monitoraggio/offerte');
  return { ok: true };
}

/** Salva una nuova versione dei parametri. `base` è la versione da cui la pagina è partita:
   se nel frattempo ne è uscita un'altra, il salvataggio si rifiuta invece di sovrascriverla. */
export async function salvaConfig(dati: Config, nota: string, base: number) {
  if (!(dati.margineVenduto >= 0 && dati.margineVenduto < 1)) return { errore: 'Il margine deve stare fra 0 e 99%' };
  if (dati.figure.some((f) => !(f.costo > 0))) return { errore: 'Ogni figura deve avere un costo positivo' };
  if (!(dati.costiCondivisi.clientiAttivi >= 0)) return { errore: 'Clienti attivi non valido' };
  const pesi = (dati.moduli ?? []).reduce((a, m) => a + m.peso, 0);
  if (dati.moduli?.length && Math.abs(pesi - 100) > 0.001) return { errore: 'I pesi dei moduli devono sommare a 100%' };
  const mese = /^\d{4}-(0[1-9]|1[0-2])$/;
  const cs = dati.costiSistema;
  if (cs && ![cs.reevoDal, cs.n8nDal, ...cs.sviluppo.map((v) => v.mese)].every((m) => mese.test(m))) return { errore: 'Indica un mese valido' };
  if (cs?.sviluppo.some((v) => !(v.importo >= 0))) return { errore: 'Ogni voce di sviluppo deve avere un importo non negativo' };
  if (dati.capacita && !(dati.capacita.pratichePerAnno > 0 && dati.capacita.praticheImpegnate >= 0)) return { errore: 'Capacità o pratiche impegnate non valide' };
  if (dati.consumo && !(dati.consumo.margineMinimo >= 0 && dati.consumo.margineMinimo < 1 && dati.consumo.costoExtraPratica >= 0)) return { errore: 'Margine minimo o costo extra non validi' };
  const attiva = await configAttiva();
  if (attiva.versione !== base) return { superata: attiva.versione };
  /* il totale dello sviluppo resta anche in `investimento.sviluppo`, per chi legge la versione senza il registro */
  if (cs) dati = { ...dati, investimento: { ...dati.investimento, sviluppo: sviluppoTotale(dati) } };
  const sb = await supabaseServer();
  const { data, error } = await sb.from('configurazione').insert({ dati, nota: nota || null }).select('versione').single();
  if (error) return { errore: error.message };
  revalidatePath('/monitoraggio', 'layout');
  revalidatePath('/offerta', 'layout');
  return { ok: true, versione: (data as { versione: number } | null)?.versione };
}
