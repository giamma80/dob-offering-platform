import 'server-only';
import { supabaseServer } from '@/lib/supabase/server';
import type { Config, Offerta, StatoValore } from '@/lib/engine';

export interface RigaOfferta {
  id: string;
  cliente: string;
  titolo: string | null;
  stato: 'bozza' | 'in_approvazione' | 'approvata' | 'archiviata';
  approccio: 'saas' | 'on_premise' | 'entrambi';
  dati: Offerta;
  stati_valore: Record<string, StatoValore>;
  vincoli: Record<string, boolean>;
  sintesi: ReturnType<typeof import('@/lib/engine').sintesi> | null;
  config_versione: number | null;
  origine_id: string | null;
  aggiornata_il: string;
  approvata_il: string | null;
  creata_il: string;
}

export async function configAttiva(): Promise<{ versione: number; dati: Config }> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from('configurazione_attiva').select('versione, dati').single();
  if (error || !data) throw new Error('Configurazione di sistema non disponibile');
  return data as { versione: number; dati: Config };
}

/** Configurazione con cui un'offerta è stata calcolata: un'offerta approvata non cambia se cambiano i parametri. */
export async function configVersione(versione: number | null) {
  if (!versione) return configAttiva();
  const sb = await supabaseServer();
  const { data } = await sb.from('configurazione').select('versione, dati').eq('versione', versione).single();
  return (data as { versione: number; dati: Config } | null) ?? configAttiva();
}

export async function elencoOfferte(): Promise<RigaOfferta[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').select('*').neq('stato', 'archiviata').order('aggiornata_il', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RigaOfferta[];
}

export async function offerta(id: string): Promise<RigaOfferta | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from('offerte').select('*').eq('id', id).maybeSingle();
  return data as RigaOfferta | null;
}
