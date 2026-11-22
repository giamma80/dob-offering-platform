import type { Config, FiguraId, Offerta, Quota, RigaGg, Scaglione } from './types';

/* Regole di calcolo DOB, versione 2. Riferimento: docs/design-v2.md §5–§7, §13–§14.

   - tariffa = costo ÷ (1 − margine sul venduto), arrotondata al centesimo (listino)
   - costi condivisi ricorrenti ÷ (N + 1), N = clienti già attivi
   - tre voci per il cliente: Setup e impianto, Customizzazione, Licenza annuale */

export const r2 = (v: number) => Math.round(v * 100) / 100;

export interface Riga {
  id: string;
  nome: string;
  gg: number;
  figura: FiguraId;
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

/** Voci di customizzazione: base + connettori + integrazioni scelti, con le giornate di stima. */
export function vociCustomizzazione(cfg: Config, o: Offerta): RigaGg[] {
  const gg = (id: string, def: number) => o.stima.gg[id] ?? def;
  const sso = !!o.vincoli.sso;
  const con = cfg.catalogo.connettori.filter((c) => o.soluzione.connettori.includes(c.id));
  const int = cfg.catalogo.integrazioni.filter(
    (c) => o.soluzione.integrazioni.includes(c.id) && (c.vincolo !== 'sso' || sso)
  );
  return [
    ...o.stima.base,
    ...[...con, ...int].map((c) => ({ id: c.id, nome: c.nome, gg: gg(c.id, c.gg), figura: c.figura })),
    ...o.soluzione.connettoriCustom,
    ...o.soluzione.integrazioniCustom
  ];
}

export function calcola(cfg: Config, o: Offerta): Risultato {
  const t = tariffe(cfg, o);
  const m = o.prezzo.margineVenduto;
  const cc = cfg.costiCondivisi;
  const n = Math.max(1, cc.clientiAttivi + 1);
  const volume = o.assessment.volumeAnnuo;
  const quoteCust = cfg.quote.filter((q) => q.ambito === 'customizzazione');
  const quoteSetup = cfg.quote.filter((q) => q.ambito === 'setup');

  /* Customizzazione: identica nei due scenari */
  const customizzazione = blocco(cfg, t, vociCustomizzazione(cfg, o), quoteCust, o.stima.quote);

  /* Setup SaaS: ambienti sul nostro cloud + quota dei servizi ReeVo */
  const amb = cfg.catalogo.ambientiSaas;
  const setupSaasBase = blocco(cfg, t,
    [{ id: 'ambienti-saas', nome: 'Ambienti SaaS', gg: o.stima.gg['ambienti-saas'] ?? amb.numero * amb.ggPerAmbiente, figura: amb.figura }],
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
  const vociOnp: RigaGg[] = [
    { id: target.id, nome: `Adeguamento ${target.nome}`, gg: o.stima.gg[target.id] ?? target.gg, figura: target.figura },
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
    { id: 'n8n',   nome: 'Licenza n8n e OCR, quota',    costo: cc.n8nOcrMese * 12 / n },
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
