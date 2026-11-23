import 'server-only';
import { supabaseServer } from '@/lib/supabase/server';
import { sintesi, type Config, type Offerta } from '@/lib/engine';

export interface RigaOfferta {
  id: string;
  cliente: string;
  titolo: string | null;
  stato: 'bozza' | 'in_approvazione' | 'approvata' | 'archiviata';
  approccio: 'saas' | 'on_premise' | 'entrambi';
  dati: Offerta;
  /** non più usato: la colonna resta per lo storico */
  stati_valore: Record<string, string>;
  vincoli: Record<string, boolean>;
  sintesi: ReturnType<typeof import('@/lib/engine').sintesi> | null;
  config_versione: number | null;
  origine_id: string | null;
  aggiornata_il: string;
  approvata_il: string | null;
  avviata_il: string | null;
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

/** Parametri con cui si calcola un'offerta: una bozza usa sempre l'ultima versione;
   dall'invio in approvazione in poi la versione è congelata. `ultima` serve all'avviso di versione superata. */
export async function configOfferta(o: { stato: RigaOfferta['stato']; config_versione: number | null }) {
  const attiva = await configAttiva();
  if (o.stato === 'bozza') return { ...attiva, ultima: attiva.versione, congelata: false };
  const v = await configVersione(o.config_versione);
  return { ...v, ultima: attiva.versione, congelata: true };
}

export async function elencoOfferte(): Promise<RigaOfferta[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb.from('offerte').select('*').neq('stato', 'archiviata').order('aggiornata_il', { ascending: false });
  if (error) throw error;
  const righe = (data ?? []) as RigaOfferta[];
  /* le bozze si mostrano con i parametri attuali, come nell'editor */
  if (!righe.some((r) => r.stato === 'bozza')) return righe;
  const { versione, dati: cfg } = await configAttiva();
  return righe.map((r) => r.stato === 'bozza'
    ? { ...r, config_versione: versione, sintesi: sintesi(cfg, r.dati) as RigaOfferta['sintesi'] } : r);
}

export async function offerta(id: string): Promise<RigaOfferta | null> {
  const sb = await supabaseServer();
  const { data } = await sb.from('offerte').select('*').eq('id', id).maybeSingle();
  return data as RigaOfferta | null;
}
