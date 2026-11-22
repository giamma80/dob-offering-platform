import { describe, expect, it } from 'vitest';
import { CONFIG_DEFAULT as cfg, nuovaOfferta, calcola, specchietto, bloccanti, avanzamento, tariffe } from './index';

const o = () => nuovaOfferta(cfg, 'Cliente di prova');

describe('tariffe', () => {
  it('margine 30% sul venduto: tariffa = costo ÷ 0,70', () => {
    const t = tariffe(cfg, o());
    expect(t.arch).toBe(384.29);
    expect(t.dev).toBe(314.29);
    expect(t.media).toBe(357.14);
  });
  it('una tariffa imposta a mano vince sul margine', () => {
    const x = o(); x.prezzo.tariffe.dev = 300;
    expect(tariffe(cfg, x).dev).toBe(300);
  });
});

describe('SaaS', () => {
  const r = calcola(cfg, o());
  it('costi condivisi divisi per N + 1 = 5', () => {
    expect(r.n).toBe(5);
    const reevo = r.saas.ricorrenti.find((v) => v.id === 'reevo')!;
    expect(reevo.costo).toBeCloseTo(107839.56 / 5, 2);
  });
  it('soglia minima del canone = costi ricorrenti di base ÷ 0,70', () => {
    expect(r.saas.soglia).toBeCloseTo(40358.73, 2);
    expect(r.saas.sottoSoglia).toBe(false);
  });
  it('consumo a scaglioni marginali su 20.000 pratiche', () => {
    expect(r.consumo.totale).toBe(5000 * 6 + 10000 * 4.5 + 5000 * 3.5);
    expect(r.saas.licenza.totale).toBe(140000 + 92500);
  });
  it('riserva KPI = 5% della licenza', () => {
    expect(r.saas.ricorrenti.find((v) => v.id === 'kpi')!.costo).toBeCloseTo(232500 * 0.05, 2);
  });
  it('servizi ReeVo una tantum nel setup, divisi per 5', () => {
    expect(r.saas.setup.reevoServizi).toBe(1700);
  });
});

describe('on-premise', () => {
  it('manutenzione di default: 220 gg di sviluppatore', () => {
    const r = calcola(cfg, o());
    expect(r.onPremise.licenza.manutenzione).toBeCloseTo(220 * 314.29, 2);
    expect(r.onPremise.ricorrenti.find((v) => v.id === 'manutenzione')!.costo).toBe(48400);
  });
  it('AI in proxy: rifatturata col margine di sistema', () => {
    const x = o(); x.leve.aiOnPremise = 'proxy';
    const r = calcola(cfg, x);
    expect(r.aiAnno).toBe(8000);
    expect(r.onPremise.licenza.aiRifatturata).toBeCloseTo(11428.57, 2);
  });
  it('AI con chiavi del cliente e senza manutenzione: licenza = solo software', () => {
    const x = o(); x.leve.aiOnPremise = 'cliente'; x.leve.manutenzioneOnPremise.attiva = false;
    const r = calcola(cfg, x);
    expect(r.onPremise.licenza.totale).toBe(40000);
    expect(r.onPremise.ricorrenti.filter((v) => v.id === 'ai' || v.id === 'manutenzione')).toHaveLength(0);
  });
  it('software a zero, AI cliente, niente manutenzione: licenza zero', () => {
    const x = o(); x.leve.aiOnPremise = 'cliente'; x.leve.manutenzioneOnPremise.attiva = false; x.leve.softwareOnPremise = 0;
    expect(calcola(cfg, x).onPremise.licenza.totale).toBe(0);
  });
});

describe('vincoli', () => {
  it('SSO spento: l\'integrazione SSO non entra nemmeno se selezionata', () => {
    const x = o(); x.soluzione.integrazioni.push('sso'); x.vincoli.sso = false;
    const senza = calcola(cfg, x).saas.customizzazione.gg;
    x.vincoli.sso = true;
    expect(calcola(cfg, x).saas.customizzazione.gg).toBeGreaterThan(senza);
  });
  it('supporto on demand: 55 gg di sviluppatore, fuori dal primo anno', () => {
    const r = calcola(cfg, o());
    expect(r.vincoliUnaTantum[0].costo).toBe(12100);
  });
});

describe('specchietto', () => {
  it('tre righe, nessun dato interno', () => {
    const s = specchietto(cfg, o(), 'saas');
    expect(s.righe.map((r) => r.voce)).toEqual(['Setup e impianto', 'Customizzazione', 'Licenza annuale']);
    const json = JSON.stringify(s);
    for (const vietato of [/reevo/i, /"costo"/, /margine/i, /"gg"/, /n8n/i]) expect(json).not.toMatch(vietato);
  });
});

describe('stati e approvazione', () => {
  it('offerta nuova: tutto assunto, voci critiche bloccanti', () => {
    const x = o();
    expect(avanzamento(x, {}, 'assessment')).toBe(0);
    expect(bloccanti(x, {})).toContain('prezzo.metrica');
  });
  it('dichiarando le voci critiche si sblocca l\'approvazione', () => {
    const x = o(); x.approccio = 'saas';
    const st = { 'assessment.volumeAnnuo': 'dichiarato', 'prezzo.metrica': 'confermato', 'prezzo.scaglioni': 'dichiarato' } as const;
    expect(bloccanti(x, st)).toHaveLength(0);
  });
});
