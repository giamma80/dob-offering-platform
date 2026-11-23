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

import { serieMensile, composizioneRicavo, composizioneMargine, sensibilitaClienti } from './index';

describe('serie e composizioni', () => {
  const x = o();
  const r = calcola(cfg, x);
  it('serie a 36 mesi: parte dalla una tantum e chiude con licenza × 3 più le voci dai vincoli', () => {
    const s = serieMensile(r.saas, r.vincoliUnaTantum);
    expect(s).toHaveLength(37);
    expect(s[0].ricavo).toBeCloseTo(r.saas.setup.prezzo + r.saas.customizzazione.prezzo, 2);
    expect(s[36].ricavo).toBeCloseTo(composizioneRicavo(r.saas, r.vincoliUnaTantum).reduce((a, f) => a + f.valore, 0), 2);
  });
  it('costi + margine = ricavo', () => {
    const tot = composizioneRicavo(r.onPremise, r.vincoliUnaTantum).reduce((a, f) => a + f.valore, 0);
    expect(composizioneMargine(r.onPremise, r.vincoliUnaTantum).reduce((a, f) => a + f.valore, 0)).toBeCloseTo(tot, 2);
  });
  it('più clienti sul multi-tenant, quota ricorrente più bassa', () => {
    const s = sensibilitaClienti(cfg, x, [1, 5, 8]);
    expect(s[0].quotaRicorrente).toBeGreaterThan(s[1].quotaRicorrente);
    expect(s[1].quotaRicorrente).toBeCloseTo(28251.11, 1);
    expect(s[2].margineAnnuo).toBeGreaterThan(s[1].margineAnnuo);
  });
});

import { curvaRecupero, pareggio, type Progetto } from './index';

describe('business plan', () => {
  const p = (inizio: string, annuo: number): Progetto => ({
    id: inizio, cliente: inizio, inizio: new Date(inizio), margineAnnuo: annuo, marginePrimoAnno: annuo,
    licenzaAnnua: 0, durataMesi: 36, inCorso: false
  });
  it('parte da meno investimento e raggiunge il pareggio quando i margini lo coprono', () => {
    const c = curvaRecupero(120000, [p('2026-01-01', 120000)], new Date('2026-01-01'), 8);
    expect(c[0].cumulato).toBeCloseTo(-90000, 0);
    expect(pareggio(c)).toBe('2026 T4');
  });
  it('senza progetti il pareggio non arriva', () => {
    expect(pareggio(curvaRecupero(1000, [], new Date('2026-01-01'), 4))).toBeNull();
  });
});

describe('interruttori della Soluzione', () => {
  it('connettori spenti: le loro giornate escono dalla customizzazione', () => {
    const x = o();
    const con = calcola(cfg, x).saas.customizzazione.gg;
    x.soluzione.sezioniOff = ['connettori'];
    expect(calcola(cfg, x).saas.customizzazione.gg).toBeLessThan(con);
  });
  it('CI/CD spento: resta solo il passaggio di consegne nel setup on-premise', () => {
    const x = o(); x.soluzione.sezioniOff = ['cicd'];
    const ids = calcola(cfg, x).onPremise.setup.righe.map((r) => r.id);
    expect(ids).toContain('consegne');
    expect(ids).not.toContain('openshift');
  });
});


import { fattoreImpianto, moduloBloccante, vociCustomizzazione } from './index';

describe('moduli DOB', () => {
  it('la base applicativa sta nel setup: senza customizzazioni la customizzazione vale zero', () => {
    const x = o(); x.soluzione.connettori = []; x.soluzione.integrazioni = [];
    x.assessment.light = true; x.assessment.moduli = cfg.moduli.filter((m) => m.id !== 'docmgmt').map((m) => m.id);
    expect(calcola(cfg, x).onPremise.customizzazione.prezzo).toBe(0);
  });
  it('piattaforma completa: impianto al 100%', () => {
    expect(fattoreImpianto(cfg, o())).toBe(1);
  });
  it('light: impianto in proporzione ai pesi dei moduli scelti', () => {
    const x = o(); x.assessment.light = true; x.assessment.moduli = ['workflow', 'identita'];
    expect(fattoreImpianto(cfg, x)).toBeCloseTo(0.32, 5);
    const pieno = calcola(cfg, o()).saas.setup.gg;
    expect(calcola(cfg, x).saas.setup.gg).toBeLessThan(pieno);
  });
  it('modulo spento blocca i connettori collegati', () => {
    const x = o(); x.assessment.light = true; x.assessment.moduli = ['workflow'];
    expect(moduloBloccante(cfg, x, 'connettori', 'namirial')?.id).toBe('firma');
    expect(vociCustomizzazione(cfg, x).map((v) => v.id)).not.toContain('namirial');
  });
  it('documentazione custom: solo se attivata nel modulo, impianto + giornate per classe', () => {
    const x = o();
    expect(vociCustomizzazione(cfg, x).map((v) => v.id)).not.toContain('doc-custom');
    x.assessment.opzioniModuli = { docmgmt: { attiva: true, classi: 4 } };
    const v = vociCustomizzazione(cfg, x).find((y) => y.id === 'doc-custom')!;
    expect(v.gg).toBe(5 + 3 * 4);
    expect(v.gruppo).toBe('moduli');
    x.assessment.light = true; x.assessment.moduli = ['workflow'];
    expect(vociCustomizzazione(cfg, x).map((y) => y.id)).not.toContain('doc-custom');
  });
  it('i pesi di default sommano a 100', () => {
    expect(cfg.moduli.reduce((a, m) => a + m.peso, 0)).toBe(100);
  });
});


describe('cascata sistemi → integrazioni → customizzazioni', () => {
  const conSistemi = () => {
    const x = o(); x.soluzione.connettori = []; x.soluzione.integrazioni = [];
    x.assessment.sistemi = [
      { id: 's1', nome: 'Core banking', complessita: 'alta' },
      { id: 's2', nome: 'CRM', complessita: 'bassa' }
    ];
    return x;
  };
  it('ogni sistema genera un\'integrazione con le giornate della sua complessità', () => {
    const v = vociCustomizzazione(cfg, conSistemi()).filter((y) => y.gruppo === 'integrazioni');
    expect(v.map((y) => [y.nome, y.gg])).toEqual([['Integrazione Core banking', 20], ['Integrazione CRM', 5]]);
  });
  it('aggiungere un sistema aumenta il prezzo', () => {
    const x = conSistemi();
    const prima = calcola(cfg, x).saas.customizzazione.prezzo;
    (x.assessment.sistemi as { id: string; nome: string; complessita: 'media' }[]).push({ id: 's3', nome: 'DMS', complessita: 'media' });
    expect(calcola(cfg, x).saas.customizzazione.prezzo).toBeGreaterThan(prima);
  });
  it('un sistema coperto da un connettore non genera integrazione e il connettore entra una sola volta', () => {
    const x = conSistemi();
    (x.assessment.sistemi[0] as { copertoDa?: string }).copertoDa = 'api-gw';
    x.soluzione.connettori = ['api-gw'];
    const v = vociCustomizzazione(cfg, x);
    expect(v.filter((y) => y.gruppo === 'integrazioni').map((y) => y.nome)).toEqual(['Integrazione CRM']);
    expect(v.filter((y) => y.id === 'api-gw')).toHaveLength(1);
    expect(v.find((y) => y.id === 'api-gw')!.origine).toBe('copre:Core banking');
  });
  it('connettore bloccato da un modulo spento: torna l\'integrazione dedicata', () => {
    const x = conSistemi();
    (x.assessment.sistemi[0] as { copertoDa?: string }).copertoDa = 'namirial';
    x.assessment.light = true; x.assessment.moduli = ['workflow'];
    expect(vociCustomizzazione(cfg, x).some((y) => y.nome === 'Integrazione Core banking')).toBe(true);
  });
  it('formato precedente dei sistemi (solo nome): complessità media', () => {
    const x = o(); x.assessment.sistemi = ['Banca collocatrice'];
    expect(vociCustomizzazione(cfg, x).find((y) => y.gruppo === 'integrazioni')!.gg).toBe(10);
  });
  it('aggiunte in stima con origine stima', () => {
    const x = o(); x.stima.extra = [{ id: 'e1', nome: 'Report regolatorio', gg: 8, figura: 'dev' }];
    expect(vociCustomizzazione(cfg, x).find((y) => y.id === 'e1')!.origine).toBe('stima');
  });
  it('impostazione delle integrazioni nella base: 16 gg', () => {
    expect(cfg.catalogo.base.find((b) => b.id === 'integr')!.gg).toBe(16);
  });
});
