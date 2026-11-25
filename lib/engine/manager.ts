import type { Config, Offerta } from './types';
import { calcola, r2 } from './calcola';

/* Specchietto manager: la stessa vista dello specchietto cliente, con i costi e il margine,
   divisa in setup (una tantum) e canone (ogni anno). Il prezzo di ciascuna sezione si può
   spostare a piacere: il margine si ricalcola da lì. Interno ALTEN, senza esportazione. */
export interface SezioneManager {
  /** setup: un costo per ogni gruppo di voci; canone: i costi ricorrenti, con il nome */
  costi: { id: string; nome?: string; costo: number }[];
  /** prezzi che compongono la sezione, a listino o scalati sul prezzo scelto */
  prezzi: { id: string; prezzo: number }[];
  costo: number;
  /** prezzo calcolato dai parametri dell'offerta */
  listino: number;
  /** prezzo in uso: il listino, finché non lo si sposta */
  prezzo: number;
  margine: number;
  marginePct: number;
}

export interface SpecchiettoManager {
  scenario: 'saas' | 'on_premise';
  setup: SezioneManager;
  canone: SezioneManager;
  primoAnno: { prezzo: number; costo: number; margine: number; marginePct: number };
}

const nonZero = <T>(xs: T[], f: (x: T) => number) => xs.filter((x) => Math.abs(f(x)) > 0.004);

function sezione(costi: SezioneManager['costi'], prezzi: SezioneManager['prezzi']): SezioneManager {
  const costo = costi.reduce((a, c) => a + c.costo, 0);
  const listino = prezzi.reduce((a, p) => a + p.prezzo, 0);
  return { costi: nonZero(costi, (c) => c.costo), prezzi: nonZero(prezzi, (p) => p.prezzo), costo, listino, ...margine(costo, listino), prezzo: listino };
}

function margine(costo: number, prezzo: number) {
  return { margine: prezzo - costo, marginePct: prezzo ? (prezzo - costo) / prezzo : 0 };
}

function totali(setup: SezioneManager, canone: SezioneManager): SpecchiettoManager['primoAnno'] {
  const prezzo = setup.prezzo + canone.prezzo;
  const costo = setup.costo + canone.costo;
  return { prezzo, costo, ...margine(costo, prezzo) };
}

export function specchiettoManager(cfg: Config, o: Offerta, sc: 'saas' | 'on_premise'): SpecchiettoManager {
  const x = sc === 'saas' ? calcola(cfg, o).saas : calcola(cfg, o).onPremise;
  const base = x.setup.righe.filter((v) => !x.setup.infrastruttura.includes(v));
  const custom = (g: string) => x.customizzazione.righe.filter((v) => (v.gruppo ?? 'catalogo') === g);
  const somma = (rr: { costo: number; prezzo: number }[], k: 'costo' | 'prezzo') => rr.reduce((a, v) => a + v[k], 0);
  const quote = [...x.setup.quote, ...x.customizzazione.quote];
  /* gruppi come nello specchietto cliente; l'infrastruttura comprende la quota dei servizi di piattaforma una tantum */
  const gruppi: { id: string; costo: number; prezzo: number }[] = [
    { id: 'base', costo: somma(base, 'costo'), prezzo: somma(base, 'prezzo') },
    ...(['integrazioni', 'catalogo', 'moduli', 'stima'] as const).map((g) => ({ id: g, costo: somma(custom(g), 'costo'), prezzo: somma(custom(g), 'prezzo') })),
    { id: 'parametriche', costo: somma(quote, 'costo'), prezzo: somma(quote, 'prezzo') },
    { id: 'infra', costo: x.infrastruttura.costo, prezzo: x.infrastruttura.prezzo }
  ];
  const setup = sezione(gruppi.map((g) => ({ id: g.id, costo: g.costo })), gruppi.map((g) => ({ id: g.id, prezzo: g.prezzo })));
  const canone = sezione(
    x.ricorrenti.map((v) => ({ id: v.id, nome: v.nome, costo: v.costo })),
    [{ id: 'software', prezzo: x.licenza.software }, { id: 'consumo', prezzo: x.licenza.consumo },
      { id: 'manutenzione', prezzo: x.licenza.manutenzione }, { id: 'ai', prezzo: x.licenza.aiRifatturata }]);
  return { scenario: sc, setup, canone, primoAnno: totali(setup, canone) };
}

/** Sposta il prezzo di una sezione: le voci si scalano in proporzione, il margine si ricalcola. */
export function conPrezzo(s: SezioneManager, prezzo: number): SezioneManager {
  const p = Math.max(0, prezzo);
  const k = s.listino ? p / s.listino : 1;
  return { ...s, prezzo: p, prezzi: s.prezzi.map((v) => ({ ...v, prezzo: r2(v.prezzo * k) })), ...margine(s.costo, p) };
}

export function conPrezzi(m: SpecchiettoManager, prezzi: { setup?: number; canone?: number }): SpecchiettoManager {
  const setup = prezzi.setup === undefined ? m.setup : conPrezzo(m.setup, prezzi.setup);
  const canone = prezzi.canone === undefined ? m.canone : conPrezzo(m.canone, prezzi.canone);
  return { ...m, setup, canone, primoAnno: totali(setup, canone) };
}

/** Estremi e passo della barra: da zero al doppio del più alto fra listino e costo, arrotondato al migliaio. */
export function intervalloPrezzo(s: SezioneManager) {
  const max = Math.max(1000, Math.ceil(2 * Math.max(s.listino, s.costo) / 1000) * 1000);
  return { min: 0, max, passo: max >= 100000 ? 100 : 10 };
}
