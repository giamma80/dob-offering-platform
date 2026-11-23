import type { Config, FiguraId, Offerta, Quota, RigaGg, Scaglione, Sistema } from './types';

/* Regole di calcolo DOB, versione 2. Riferimento: docs/design-v2.md §5–§7, §13–§14.

   - tariffa = costo ÷ (1 − margine sul venduto), arrotondata al centesimo (listino)
   - costi condivisi ricorrenti ÷ (N + 1), N = clienti già attivi
   - tre voci per il cliente: Setup e impianto, Customizzazione, Licenza annuale */

export const r2 = (v: number) => Math.round(v * 100) / 100;

export interface Riga extends RigaGg {
  costo: number;
  prezzo: number;
}

export interface Blocco {
  righe: Riga[];
  quote: Riga[];
  gg: number;
  costo: number;
  prezzo: number;
}

export interface VoceRicorrente { id: string; nome: string; costo: number }

export interface Scenario {
  attivo: boolean;
  setup: Blocco & { reevoServizi: number };
  customizzazione: Blocco;
  licenza: { totale: number; software: number; consumo: number; manutenzione: number; aiRifatturata: number };
  ricorrenti: VoceRicorrente[];
  costoRicorrente: number;
  primoAnno: { prezzo: number; costo: number; margine: number; marginePct: number };
  annuo: { margine: number; marginePct: number };
  soglia: number;            // canone minimo: sotto, avviso
  sottoSoglia: boolean;
}

export interface Risultato {
  tariffe: Record<FiguraId, number>;
  n: number;
  consumo: { fasce: (Scaglione & { tx: number; importo: number })[]; totale: number };
  aiAnno: number;
  saas: Scenario;
  onPremise: Scenario;
  /** voci una tantum dai vincoli (es. supporto on demand): si quotano a parte, fuori dal primo anno */
  vincoliUnaTantum: Riga[];
}

export function tariffe(cfg: Config, o: Offerta): Record<FiguraId, number> {
  const m = o.prezzo.margineVenduto;
  return Object.fromEntries(
    cfg.figure.map((f) => [f.id, o.prezzo.tariffe[f.id] ?? (m >= 1 ? 0 : r2(f.costo / (1 - m)))])
  ) as Record<FiguraId, number>;
}

function costoFigura(cfg: Config, id: FiguraId) {
  return cfg.figure.find((f) => f.id === id)?.costo ?? 0;
}

function riga(cfg: Config, t: Record<FiguraId, number>, v: RigaGg): Riga {
  return { ...v, costo: v.gg * costoFigura(cfg, v.figura), prezzo: v.gg * t[v.figura] };
}

/** Quote a cascata: ognuna si applica al cumulato che la precede. */
function blocco(cfg: Config, t: Record<FiguraId, number>, voci: RigaGg[], quote: Quota[], pct: Offerta['stima']['quote']): Blocco {
  const righe = voci.map((v) => riga(cfg, t, v));
  let gg = righe.reduce((a, r) => a + r.gg, 0);
  const qs = quote.map((q) => {
    const qgg = Math.round(gg * (pct[q.id] ?? q.pct));
    gg += qgg;
    return riga(cfg, t, { id: q.id, nome: q.nome, gg: qgg, figura: q.figura });
  });
  const tutte = [...righe, ...qs];
  return {
    righe, quote: qs, gg,
    costo: tutte.reduce((a, r) => a + r.costo, 0),
    prezzo: tutte.reduce((a, r) => a + r.prezzo, 0)
  };
}

export function consumo(scaglioni: Scaglione[], volume: number) {
  const fasce = scaglioni.map((s) => {
    const alto = s.a === null ? Infinity : s.a;
    const tx = Math.max(0, Math.min(volume, alto) - s.da + 1);
    return { ...s, tx, importo: tx * s.prezzo };
  });
  return { fasce, totale: fasce.reduce((a, f) => a + f.importo, 0) };
}

/* ------------------------------------------------------------------ moduli DOB */

/** Moduli inclusi: tutti nella piattaforma completa, quelli scelti in configurazione light. */
export function moduliAttivi(cfg: Config, o: Offerta): string[] {
  const mod = cfg.moduli ?? [];
  if (!o.assessment.light) return mod.map((m) => m.id);
  return mod.filter((m) => m.nativo || (o.assessment.moduli ?? []).includes(m.id)).map((m) => m.id);
}

/** Quota dell'impianto pagata: somma dei pesi dei moduli inclusi sul totale (1 = piattaforma completa). */
export function fattoreImpianto(cfg: Config, o: Offerta): number {
  const mod = cfg.moduli ?? [];
  const tot = mod.reduce((a, m) => a + m.peso, 0);
  if (!o.assessment.light || !tot) return 1;
  const att = moduliAttivi(cfg, o);
  return mod.filter((m) => att.includes(m.id)).reduce((a, m) => a + m.peso, 0) / tot;
}

/** Il modulo spento che blocca una voce di catalogo, se c'è. Una voce condivisa da più moduli
   (es. Cleverchain: Screening AML e Rischio di Credito) resta disponibile finché almeno uno è incluso. */
export function moduloBloccante(cfg: Config, o: Offerta, tipo: 'connettori' | 'integrazioni', id: string) {
  const att = moduliAttivi(cfg, o);
  const legati = (cfg.moduli ?? []).filter((m) => (m[tipo] ?? []).includes(id));
  if (!legati.length || legati.some((m) => att.includes(m.id))) return null;
  return legati[0];
}

/** Base applicativa (impianto della piattaforma), ridotta in proporzione ai moduli inclusi. */
export function vociBase(cfg: Config, o: Offerta): RigaGg[] {
  const f = fattoreImpianto(cfg, o);
  return o.stima.base.map((b) => ({ ...b, gg: f === 1 ? b.gg : Math.round(b.gg * f * 10) / 10 }));
}

/** Sistemi da integrare normalizzati: accetta anche il formato precedente (solo nome). */
export function sistemi(o: Offerta): Sistema[] {
  return (o.assessment.sistemi ?? []).map((x, i) =>
    typeof x === 'string' ? { id: `sis-${i}-${x.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, nome: x, complessita: 'media' as const, tipo: 'altri' as const } : x);
}

/** Connettore di catalogo che copre davvero un sistema (selezionabile: non bloccato da moduli, sezione accesa). */
export function coperturaSistema(cfg: Config, o: Offerta, s: Sistema): string | null {
  if (!s.copertoDa) return null;
  if ((o.soluzione.sezioniOff ?? []).includes('connettori')) return null;
  if (!cfg.catalogo.connettori.some((c) => c.id === s.copertoDa)) return null;
  if (moduloBloccante(cfg, o, 'connettori', s.copertoDa)) return null;
  return s.copertoDa;
}

/** Voci di customizzazione, ognuna con gruppo e origine. La base applicativa non è qui: sta in Setup e impianto.
   1. integrazioni: una per sistema da integrare non coperto da un connettore
   2. catalogo: connettori e integrazioni scelti (o che coprono un sistema), voci custom di Soluzione
   3. moduli: voci fisse e opzioni a classi dei moduli inclusi
   4. stima: voci aggiunte dal delivery */
export function vociCustomizzazione(cfg: Config, o: Offerta): RigaGg[] {
  const gg = (id: string, def: number) => o.stima.gg[id] ?? def;
  const sso = !!o.vincoli.sso;
  const off = o.soluzione.sezioniOff ?? [];
  const conOn = !off.includes('connettori'), intOn = !off.includes('integrazioni');
  const att = moduliAttivi(cfg, o);
  const nomeModulo = (tipo: 'connettori' | 'integrazioni', id: string) =>
    (cfg.moduli ?? []).find((m) => att.includes(m.id) && (m[tipo] ?? []).includes(id))?.nome;

  /* 1. sistemi */
  const sis = sistemi(o);
  const coperture = new Map<string, string[]>();
  const integrazioniSistema: RigaGg[] = [];
  const is = cfg.integrazioneSistema ?? { bassa: 5, media: 10, alta: 20, figura: 'dev' as const };
  for (const s of sis) {
    const c = coperturaSistema(cfg, o, s);
    if (c) coperture.set(c, [...(coperture.get(c) ?? []), s.nome]);
    else integrazioniSistema.push({
      id: s.id, nome: `Integrazione ${s.nome}`, gg: gg(s.id, is[s.complessita] ?? is.media), figura: is.figura,
      gruppo: 'integrazioni', origine: `sistema:${s.nome}`
    });
  }

  /* 2. catalogo */
  const con = conOn ? cfg.catalogo.connettori.filter((c) =>
    (o.soluzione.connettori.includes(c.id) || coperture.has(c.id)) && !moduloBloccante(cfg, o, 'connettori', c.id)) : [];
  const int = intOn ? cfg.catalogo.integrazioni.filter(
    (c) => o.soluzione.integrazioni.includes(c.id) && (c.vincolo !== 'sso' || sso) && !moduloBloccante(cfg, o, 'integrazioni', c.id)
  ) : [];
  const catalogo: RigaGg[] = [
    ...con.map((c) => ({ id: c.id, nome: c.nome, gg: gg(c.id, c.gg), figura: c.figura, gruppo: 'catalogo' as const,
      origine: coperture.has(c.id) ? `copre:${coperture.get(c.id)!.join(', ')}` : nomeModulo('connettori', c.id) ? `modulo:${nomeModulo('connettori', c.id)}` : 'catalogo' })),
    ...int.map((c) => ({ id: c.id, nome: c.nome, gg: gg(c.id, c.gg), figura: c.figura, gruppo: 'catalogo' as const,
      origine: c.vincolo === 'sso' ? 'vincolo:SSO' : nomeModulo('integrazioni', c.id) ? `modulo:${nomeModulo('integrazioni', c.id)}` : 'catalogo' })),
    ...(conOn ? o.soluzione.connettoriCustom : []).map((c) => ({ ...c, gruppo: 'catalogo' as const, origine: 'soluzione' })),
    ...(intOn ? o.soluzione.integrazioniCustom : []).map((c) => ({ ...c, gruppo: 'catalogo' as const, origine: 'soluzione' }))
  ];

  /* 3. moduli */
  const moduli: RigaGg[] = [];
  for (const m of cfg.moduli ?? []) {
    if (!att.includes(m.id)) continue;
    if (m.customizzazione) moduli.push({ ...m.customizzazione, gg: gg(m.customizzazione.id, m.customizzazione.gg), gruppo: 'moduli', origine: `modulo:${m.nome}` });
    const op = m.opzioneClassi, scelta = o.assessment.opzioniModuli?.[m.id];
    if (op && scelta?.attiva) {
      const def = op.impianto + op.perClasse * Math.max(0, scelta.classi);
      moduli.push({ id: op.id, nome: `${op.nome} · ${scelta.classi} classi`, gg: gg(op.id, def), figura: op.figura, gruppo: 'moduli', origine: `modulo:${m.nome}` });
    }
  }

  /* 4. aggiunte in stima */
  const extra = (o.stima.extra ?? []).map((c) => ({ ...c, gruppo: 'stima' as const, origine: 'stima' }));

  return [...integrazioniSistema, ...catalogo, ...moduli, ...extra];
}

export function calcola(cfg: Config, o: Offerta): Risultato {
  const t = tariffe(cfg, o);
  const m = o.prezzo.margineVenduto;
  const cc = cfg.costiCondivisi;
  const n = Math.max(1, cc.clientiAttivi + 1);
  const volume = o.assessment.volumeAnnuo;
  const quoteCust = cfg.quote.filter((q) => q.ambito === 'customizzazione');
  /* il setup comprende l'impianto della piattaforma: prende testing, PM e contingenza, più la garanzia */
  const quoteSetup = cfg.quote;
  const base = vociBase(cfg, o);

  /* Customizzazione: identica nei due scenari */
  const customizzazione = blocco(cfg, t, vociCustomizzazione(cfg, o), quoteCust, o.stima.quote);

  /* Setup SaaS: ambienti sul nostro cloud + quota dei servizi ReeVo */
  const amb = cfg.catalogo.ambientiSaas;
  const setupSaasBase = blocco(cfg, t,
    [...base, { id: 'ambienti-saas', nome: 'Ambienti SaaS', gg: o.stima.gg['ambienti-saas'] ?? amb.numero * amb.ggPerAmbiente, figura: amb.figura }],
    quoteSetup, o.stima.quote);
  const reevoServizi = cc.reevoServiziUnaTantum / n;
  const setupSaas = {
    ...setupSaasBase,
    reevoServizi,
    costo: setupSaasBase.costo + reevoServizi,
    prezzo: setupSaasBase.prezzo + (m >= 1 ? 0 : reevoServizi / (1 - m))
  };

  /* Setup on-premise: adeguamento al target CI/CD del cliente + passaggio di consegne */
  const target = cfg.catalogo.cicd.find((c) => c.id === o.soluzione.cicd) ?? cfg.catalogo.cicd[0];
  const pc = cfg.catalogo.passaggioConsegne;
  const cicdOn = !(o.soluzione.sezioniOff ?? []).includes('cicd');
  const vociOnp: RigaGg[] = [
    ...base,
    ...(cicdOn ? [{ id: target.id, nome: `Adeguamento ${target.nome}`, gg: o.stima.gg[target.id] ?? target.gg, figura: target.figura }] : []),
    ...(o.soluzione.passaggioConsegne ? [{ ...pc, gg: o.stima.gg[pc.id] ?? pc.gg }] : [])
  ];
  const setupOnp = { ...blocco(cfg, t, vociOnp, quoteSetup, o.stima.quote), reevoServizi: 0 };

  /* Consumo a scaglioni */
  const cons = consumo(o.prezzo.scaglioni, volume);
  const aiAnno = volume * o.assessment.documentiPerPratica * cfg.ai.perDocumento;

  /* Vincoli */
  const attivo = (id: string) => !!o.vincoli[id as keyof Offerta['vincoli']];
  const importoVincolo = (id: string, def: number) => o.importiVincoli[id as keyof Offerta['importiVincoli']] ?? def;
  const vincoliUnaTantum: Riga[] = [];
  const ricVincoli = (licenza: number): VoceRicorrente[] => {
    const out: VoceRicorrente[] = [];
    for (const v of cfg.vincoli) {
      if (!attivo(v.id)) continue;
      const e = v.effetto;
      if (e.tipo === 'ricorrente_fisso') out.push({ id: v.id, nome: v.nome, costo: importoVincolo(v.id, e.importo) });
      if (e.tipo === 'ricorrente_pct_licenza') out.push({ id: v.id, nome: `Riserva ${v.nome}`, costo: importoVincolo(v.id, licenza * e.pct) });
    }
    return out;
  };
  for (const v of cfg.vincoli) {
    if (attivo(v.id) && v.effetto.tipo === 'una_tantum_gg') {
      vincoliUnaTantum.push(riga(cfg, t, { id: v.id, nome: v.nome, gg: v.effetto.gg, figura: v.effetto.figura }));
    }
  }

  /* SaaS */
  const ricBase: VoceRicorrente[] = [
    { id: 'reevo', nome: 'Accantonamento ReeVo, quota', costo: cc.reevo.reduce((a, r) => a + r.mese, 0) * 12 / n },
    { id: 'n8n',   nome: 'Canone n8n e OCR, quota',    costo: cc.n8nOcrMese * 12 / n },
    { id: 'ams',   nome: 'AMS ed esercizio, quota',     costo: cc.amsSaasAnno / n },
    { id: 'supp',  nome: 'Supporto interno ALTEN, quota', costo: cc.supportoAnno / n }
  ];
  const costoBaseSaas = ricBase.reduce((a, v) => a + v.costo, 0);
  const licSaas = o.leve.canoneSaas + cons.totale;
  const ricSaas = [...ricBase, ...ricVincoli(licSaas)];
  const saas = scenario(o.approccio !== 'on_premise', setupSaas, customizzazione,
    { totale: licSaas, software: o.leve.canoneSaas, consumo: cons.totale, manutenzione: 0, aiRifatturata: 0 },
    ricSaas, m >= 1 ? 0 : costoBaseSaas / (1 - m), o.leve.canoneSaas);

  /* On-premise */
  const ai = o.leve.aiOnPremise;
  const man = o.leve.manutenzioneOnPremise;
  const costoMan = man.attiva ? man.gg * costoFigura(cfg, man.figura) : 0;
  const prezzoMan = man.attiva ? man.gg * t[man.figura] : 0;
  const aiRif = ai === 'proxy' && m < 1 ? aiAnno / (1 - m) : 0;
  const consOnp = o.prezzo.consumoOnPremise ? cons.totale : 0;
  const licOnp = o.leve.softwareOnPremise + prezzoMan + aiRif + consOnp;
  const ricOnp: VoceRicorrente[] = [
    ...(ai !== 'cliente' ? [{ id: 'ai', nome: ai === 'proxy' ? 'Elaborazione AI in proxy' : 'Elaborazione AI inclusa', costo: aiAnno }] : []),
    ...(man.attiva ? [{ id: 'manutenzione', nome: 'Manutenzione on-premise', costo: costoMan }] : []),
    ...ricVincoli(licOnp)
  ];
  const onPremise = scenario(o.approccio !== 'saas', setupOnp, customizzazione,
    { totale: licOnp, software: o.leve.softwareOnPremise, consumo: consOnp, manutenzione: prezzoMan, aiRifatturata: aiRif },
    ricOnp, ai === 'incluso' ? aiAnno : 0, o.leve.softwareOnPremise);

  return { tariffe: t, n, consumo: cons, aiAnno, saas, onPremise, vincoliUnaTantum };
}

function scenario(
  attivo: boolean,
  setup: Scenario['setup'],
  customizzazione: Blocco,
  licenza: Scenario['licenza'],
  ricorrenti: VoceRicorrente[],
  soglia: number,
  canone: number
): Scenario {
  const costoRicorrente = ricorrenti.reduce((a, v) => a + v.costo, 0);
  const prezzo = setup.prezzo + customizzazione.prezzo + licenza.totale;
  const costo = setup.costo + customizzazione.costo + costoRicorrente;
  return {
    attivo, setup, customizzazione, licenza, ricorrenti, costoRicorrente,
    primoAnno: { prezzo, costo, margine: prezzo - costo, marginePct: prezzo ? (prezzo - costo) / prezzo : 0 },
    annuo: {
      margine: licenza.totale - costoRicorrente,
      marginePct: licenza.totale ? (licenza.totale - costoRicorrente) / licenza.totale : 0
    },
    soglia,
    sottoSoglia: canone < soglia
  };
}

/** Margine cumulato su un orizzonte di anni (sostenibilità). */
export function cumulato(s: Scenario, anni: number, crescita = 0) {
  const out: { anno: number; ricavo: number; costo: number; margine: number }[] = [];
  let ricavo = s.setup.prezzo + s.customizzazione.prezzo;
  let costo = s.setup.costo + s.customizzazione.costo;
  for (let a = 1; a <= anni; a++) {
    const f = Math.pow(1 + crescita, a - 1);
    ricavo += s.licenza.software + (s.licenza.totale - s.licenza.software) * f;
    costo += s.costoRicorrente;
    out.push({ anno: a, ricavo, costo, margine: ricavo - costo });
  }
  return out;
}

/* ------------------------------------------------------------------ serie e composizioni
   Lettura nel tempo (grafico ad area) e lettura per composizione (barra spezzata) dello stesso dato. */

export interface PuntoMese { mese: number; unaTantum: number; licenza: number; extra: number; ricavo: number; costo: number; margine: number }

/** Ricavo e costo cumulati mese per mese sui mesi del contratto (default 36).
   Una tantum al mese 0, licenza e costi ricorrenti lineari, voci una tantum dai vincoli a fine contratto. */
export function serieMensile(s: Scenario, extra: Riga[], mesi = 36): PuntoMese[] {
  const una = s.setup.prezzo + s.customizzazione.prezzo;
  const costoUna = s.setup.costo + s.customizzazione.costo;
  const extraP = extra.reduce((a, r) => a + r.prezzo, 0);
  const extraC = extra.reduce((a, r) => a + r.costo, 0);
  return Array.from({ length: mesi + 1 }, (_, m) => {
    const licenza = (s.licenza.totale * m) / 12;
    const ex = m === mesi ? extraP : 0;
    const ricavo = una + licenza + ex;
    const costo = costoUna + (s.costoRicorrente * m) / 12 + (m === mesi ? extraC : 0);
    return { mese: m, unaTantum: una, licenza, extra: ex, ricavo, costo, margine: ricavo - costo };
  });
}

export interface Fetta { id: string; valore: number }

/** Composizione del ricavo sull'orizzonte: customizzazione, setup, licenza × anni, voci dai vincoli. */
export function composizioneRicavo(s: Scenario, extra: Riga[], anni = 3): Fetta[] {
  return [
    { id: 'custom', valore: s.customizzazione.prezzo },
    { id: 'setup', valore: s.setup.prezzo },
    { id: 'licenza', valore: s.licenza.totale * anni },
    { id: 'extra', valore: extra.reduce((a, r) => a + r.prezzo, 0) }
  ];
}

/** Composizione del ricavo fra costi e margine sull'orizzonte. */
export function composizioneMargine(s: Scenario, extra: Riga[], anni = 3): Fetta[] {
  const giornate = s.setup.costo + s.customizzazione.costo + extra.reduce((a, r) => a + r.costo, 0);
  const ricorrenti = s.costoRicorrente * anni;
  const ricavo = composizioneRicavo(s, extra, anni).reduce((a, f) => a + f.valore, 0);
  return [
    { id: 'giornate', valore: giornate },
    { id: 'ricorrenti', valore: ricorrenti },
    { id: 'margine', valore: ricavo - giornate - ricorrenti }
  ];
}

/** Margine annuo SaaS al variare dei clienti sul multi-tenant (divisore N + 1). */
export function sensibilitaClienti(cfg: Config, o: Offerta, divisori: number[]) {
  return divisori.map((d) => {
    const c = { ...cfg, costiCondivisi: { ...cfg.costiCondivisi, clientiAttivi: Math.max(0, d - 1) } };
    const r = calcola(c, o);
    const quota = r.saas.ricorrenti.filter((v) => ['reevo', 'n8n', 'ams', 'supp'].includes(v.id)).reduce((a, v) => a + v.costo, 0);
    return { divisore: d, quotaRicorrente: quota, margineAnnuo: r.saas.annuo.margine };
  });
}
