import type { AreaArchitettura, Config, Offerta, TipoSistema } from './types';
import { moduliAttivi, sistemi, vociCustomizzazione } from './calcola';

/* Grafico dell'architettura (Digital Onboarding follow up, slide 3): ogni casella è spenta,
   inclusa nella piattaforma standard, oppure ha lavoro da sviluppare (customizzazione o integrazione).
   Nessuna aritmetica sugli importi: solo lo stato delle caselle e le voci che lo determinano. */

export type StatoArea = 'spento' | 'incluso' | 'sviluppo';

export interface Area {
  id: AreaArchitettura;
  stato: StatoArea;
  /** voci di customizzazione che accendono la casella (id e nome; le giornate restano nel dettaglio) */
  voci: { id: string; nome: string; gg: number }[];
}

export interface Architettura {
  terzi: Area[];
  piattaforma: Area[];
  cliente: Area[];
  moduli: { id: string; nome: string; stato: StatoArea }[];
  deployment: { saas: boolean; onPremise: boolean };
}

const TERZI: AreaArchitettura[] = ['kyc', 'aml', 'firma', 'doc', 'notifiche'];
const PIATTAFORMA: AreaArchitettura[] = ['componibile', 'workflow', 'design', 'multifornitore'];
const CLIENTE: TipoSistema[] = ['core', 'crm', 'dms', 'bi', 'altri'];

/** Area del grafico a cui appartiene una voce di customizzazione, o null. */
export function areaVoce(cfg: Config, o: Offerta, id: string): AreaArchitettura | null {
  const s = sistemi(o).find((x) => x.id === id);
  if (s) return s.tipo ?? 'altri';
  const con = cfg.catalogo.connettori.find((c) => c.id === id);
  if (con) {
    if (con.area) return con.area;
    const att = moduliAttivi(cfg, o);
    const mods = (cfg.moduli ?? []).filter((m) => (m.connettori ?? []).includes(id));
    return (mods.find((m) => att.includes(m.id)) ?? mods[0])?.area ?? 'multifornitore';
  }
  const int = cfg.catalogo.integrazioni.find((c) => c.id === id);
  if (int) return int.area ?? 'workflow';
  const mod = (cfg.moduli ?? []).find((m) => m.opzioneClassi?.id === id || m.customizzazione?.id === id);
  if (mod) return mod.area ?? null;
  if (o.soluzione.connettoriCustom.some((c) => c.id === id) || o.soluzione.integrazioniCustom.some((c) => c.id === id)) return 'multifornitore';
  return null;
}

/** Moduli legati a una voce (per accendere i chip dei moduli). */
function moduliVoce(cfg: Config, id: string): string[] {
  return (cfg.moduli ?? []).filter((m) => (m.connettori ?? []).includes(id) || (m.integrazioni ?? []).includes(id)
    || m.opzioneClassi?.id === id || m.customizzazione?.id === id).map((m) => m.id);
}

export function architettura(cfg: Config, o: Offerta): Architettura {
  const att = moduliAttivi(cfg, o);
  const voci = vociCustomizzazione(cfg, o).filter((v) => v.gruppo !== 'stima');
  const perArea = new Map<AreaArchitettura, Area['voci']>();
  for (const v of voci) {
    const a = areaVoce(cfg, o, v.id);
    if (a) perArea.set(a, [...(perArea.get(a) ?? []), { id: v.id, nome: v.nome, gg: v.gg }]);
  }
  /* configurazioni precedenti ai moduli: piattaforma completa */
  const senzaModuli = !(cfg.moduli ?? []).length;
  const areeModuli = new Set((cfg.moduli ?? []).filter((m) => att.includes(m.id) && m.area).map((m) => m.area));
  const area = (id: AreaArchitettura, accesa: boolean): Area => {
    const v = perArea.get(id) ?? [];
    return { id, voci: v, stato: v.length ? 'sviluppo' : accesa ? 'incluso' : 'spento' };
  };

  const sis = sistemi(o);
  const cliente = CLIENTE.map((t) => {
    const di = sis.filter((s) => (s.tipo ?? 'altri') === t);
    return area(t, di.length > 0);
  });

  const voceIds = new Set(voci.map((v) => v.id));
  return {
    terzi: TERZI.map((a) => area(a, senzaModuli || areeModuli.has(a))),
    piattaforma: PIATTAFORMA.map((a) => area(a, true)),
    cliente,
    moduli: (cfg.moduli ?? []).map((m) => ({
      id: m.id, nome: m.nome,
      stato: !att.includes(m.id) ? 'spento' as const
        : voci.some((v) => moduliVoce(cfg, v.id).includes(m.id) && voceIds.has(v.id)) ? 'sviluppo' as const : 'incluso' as const
    })),
    deployment: { saas: o.approccio !== 'on_premise', onPremise: o.approccio !== 'saas' }
  };
}

/** Versione per il cliente: solo spento / incluso, nessuna voce, nessuna giornata, nessun fornitore. */
export function architetturaCliente(cfg: Config, o: Offerta) {
  const a = architettura(cfg, o);
  const semplice = (x: Area[]) => x.map((y) => ({ id: y.id, incluso: y.stato !== 'spento' }));
  return {
    terzi: semplice(a.terzi),
    piattaforma: semplice(a.piattaforma),
    cliente: semplice(a.cliente),
    moduli: a.moduli.map((m) => ({ id: m.id, nome: m.nome, incluso: m.stato !== 'spento' })),
    deployment: a.deployment
  };
}
