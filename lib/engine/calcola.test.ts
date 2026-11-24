import { describe, expect, it } from 'vitest';
import { CONFIG_DEFAULT as cfg, nuovaOfferta, calcola, specchietto, tariffe } from './index';

const o = () => nuovaOfferta(cfg, 'Cliente di prova');
/* configurazione con il vecchio listino a scaglioni: le offerte storiche si calcolano così */
const cfgL = structuredClone(cfg);
cfgL.consumo = { modello: 'listino', costoExtraPratica: 0, margineMinimo: 0 };
const oL = () => nuovaOfferta(cfgL, 'Cliente di prova');

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

describe('SaaS (listino)', () => {
  const r = calcola(cfgL, oL());
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
  it('riserva KPI = 5% del canone annuo', () => {
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
  it('software a zero, AI cliente, niente manutenzione: canone annuo zero', () => {
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
  it('messa in opera, adeguamento infrastruttura e canone annuo, con sottovoci, nessun dato interno', () => {
    const x = o(); x.soluzione.connettori = ['namirial', 'cleverchain', 'api-gw'];
    const s = specchietto(cfg, x, 'saas');
    expect(s.righe.map((r) => r.voce)).toEqual(['Messa in opera', 'Adeguamento infrastruttura', 'Canone annuo']);
    for (const r of s.righe) expect(r.sottovoci.reduce((a, v) => a + v.importo, 0)).toBeCloseTo(r.importo, 2);
    const json = JSON.stringify(s);
    for (const vietato of [/reevo/i, /"costo"/, /margine/i, /"gg"/, /n8n/i, /namirial/i, /cleverchain/i, /api gateway/i])
      expect(json).not.toMatch(vietato);
  });
  it('on-premise: il target CI/CD compare per nome nell\'adeguamento infrastruttura', () => {
    const x = o(); x.approccio = 'on_premise'; x.soluzione.cicd = 'openshift';
    const infra = specchietto(cfg, x, 'on_premise').righe.find((r) => r.id === 'infra')!;
    expect(infra.sottovoci[0].voce).toBe('OpenShift');
  });
});

import { serieMensile, composizioneRicavo, composizioneMargine, sensibilitaClienti } from './index';

describe('serie e composizioni', () => {
  const x = oL();
  const r = calcola(cfgL, x);
  it('serie a 36 mesi: parte dalla una tantum e chiude con canone annuo × 3 più le voci dai vincoli', () => {
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
    const s = sensibilitaClienti(cfgL, x, [1, 5, 8]);
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
    expect(pareggio(c)).toBe('2026 Q4');
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
  it('CI/CD spento: nessun adeguamento di infrastruttura on-premise, e nessun passaggio di consegne', () => {
    const x = o(); x.soluzione.sezioniOff = ['cicd'];
    const s = calcola(cfg, x).onPremise;
    expect(s.setup.righe.map((r) => r.id)).not.toContain('openshift');
    expect(s.setup.righe.map((r) => r.id)).not.toContain('consegne');
    expect(s.infrastruttura.gg).toBe(0);
  });
});

describe('messa in opera e infrastruttura', () => {
  it('le voci parametriche del setup non si applicano all\'adeguamento dell\'infrastruttura', () => {
    const x = o(); x.approccio = 'on_premise'; x.soluzione.cicd = 'openshift';
    const con = calcola(cfg, x).onPremise;
    x.soluzione.sezioniOff = ['cicd'];
    const senza = calcola(cfg, x).onPremise;
    expect(con.setup.quote.map((q) => q.gg)).toEqual(senza.setup.quote.map((q) => q.gg));
    expect(con.infrastruttura.gg).toBe(150);
  });
  it('messa in opera = base applicativa + customizzazioni + voci parametriche', () => {
    const x = o(); x.approccio = 'on_premise';
    const s = calcola(cfg, x).onPremise;
    const base = s.setup.righe.filter((r) => !s.setup.infrastruttura.includes(r));
    const gg = base.reduce((a, r) => a + r.gg, 0) + s.setup.quote.reduce((a, q) => a + q.gg, 0) + s.customizzazione.gg;
    expect(s.messaInOpera.gg).toBeCloseTo(gg, 6);
    expect(s.messaInOpera.prezzo + s.infrastruttura.prezzo).toBeCloseTo(s.setup.prezzo + s.customizzazione.prezzo, 6);
  });
  it('SaaS: ambienti e servizi una tantum ReeVo stanno nell\'infrastruttura', () => {
    const x = o(); x.approccio = 'saas';
    const s = calcola(cfg, x).saas;
    expect(s.setup.infrastruttura.map((r) => r.id)).toEqual(['ambienti-saas']);
    expect(s.infrastruttura.costo).toBeCloseTo(s.setup.infrastruttura[0].costo + s.setup.reevoServizi, 6);
  });
});


import { fattoreImpianto, moduliAttivi, moduloBloccante, vociCustomizzazione } from './index';

describe('moduli DOB', () => {
  it('la base applicativa sta nel setup: senza customizzazioni la customizzazione vale zero', () => {
    const x = o(); x.soluzione.connettori = []; x.soluzione.integrazioni = [];
    x.assessment.light = true; x.assessment.moduli = cfg.moduli.filter((m) => m.id !== 'ocr').map((m) => m.id);
    expect(calcola(cfg, x).onPremise.customizzazione.prezzo).toBe(0);
  });
  it('piattaforma completa: impianto al 100%', () => {
    expect(fattoreImpianto(cfg, o())).toBe(1);
  });
  it('light: impianto in proporzione ai pesi dei moduli scelti', () => {
    const x = o(); x.assessment.light = true; x.assessment.moduli = ['ocr'];
    expect(fattoreImpianto(cfg, x)).toBeCloseTo(0.64, 5);
    const pieno = calcola(cfg, o()).saas.setup.gg;
    expect(calcola(cfg, x).saas.setup.gg).toBeLessThan(pieno);
  });
  it('modulo spento blocca i connettori collegati', () => {
    const x = o(); x.assessment.light = true; x.assessment.moduli = [];
    expect(moduloBloccante(cfg, x, 'connettori', 'namirial')?.id).toBe('firma');
    expect(vociCustomizzazione(cfg, x).map((v) => v.id)).not.toContain('namirial');
  });
  it('documentazione custom: solo se attivata nel modulo, impianto + giornate per classe', () => {
    const x = o();
    expect(vociCustomizzazione(cfg, x).map((v) => v.id)).not.toContain('doc-custom');
    x.assessment.opzioniModuli = { ocr: { attiva: true, classi: 4 } };
    const v = vociCustomizzazione(cfg, x).find((y) => y.id === 'doc-custom')!;
    expect(v.gg).toBe(5 + 3 * 4);
    expect(v.gruppo).toBe('moduli');
    x.assessment.light = true; x.assessment.moduli = [];
    expect(vociCustomizzazione(cfg, x).map((y) => y.id)).not.toContain('doc-custom');
  });
  it('i moduli nativi restano inclusi anche con la configurazione light', () => {
    const x = o(); x.assessment.light = true; x.assessment.moduli = [];
    const nativi = cfg.moduli.filter((m) => m.nativo).map((m) => m.id);
    expect(nativi).toEqual(['core', 'designer', 'form', 'backoffice', 'rbac']);
    expect(moduliAttivi(cfg, x)).toEqual(nativi);
    expect(fattoreImpianto(cfg, x)).toBeCloseTo(0.5, 5);
  });
  it('un provider condiviso resta disponibile finché almeno un suo modulo è incluso', () => {
    const x = o(); x.assessment.light = true; x.assessment.moduli = ['credito'];
    expect(moduloBloccante(cfg, x, 'connettori', 'cleverchain')).toBeNull();
    x.assessment.moduli = [];
    expect(moduloBloccante(cfg, x, 'connettori', 'cleverchain')?.id).toBe('aml');
  });
  it('12 moduli del catalogo', () => {
    expect(cfg.moduli).toHaveLength(12);
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
    x.assessment.light = true; x.assessment.moduli = [];
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


import { architettura, areaVoce } from './index';

describe('grafico dell\'architettura', () => {
  it('modulo spento: casella spenta; incluso senza voci: inclusa; con provider scelto: da sviluppare', () => {
    const x = o(); x.soluzione.connettori = []; x.soluzione.integrazioni = [];
    x.assessment.light = true; x.assessment.moduli = ['ocr'];
    const a = architettura(cfg, x);
    expect(a.terzi.find((y) => y.id === 'firma')!.stato).toBe('spento');
    expect(a.terzi.find((y) => y.id === 'doc')!.stato).toBe('incluso');
    x.assessment.moduli = ['ocr', 'firma']; x.soluzione.connettori = ['namirial'];
    const b = architettura(cfg, x).terzi.find((y) => y.id === 'firma')!;
    expect(b.stato).toBe('sviluppo');
    expect(b.voci.map((v) => v.id)).toEqual(['namirial']);
  });
  it('configurazione senza moduli (offerte storiche): servizi di terzi tutti inclusi', () => {
    const a = architettura({ ...cfg, moduli: [] }, o());
    expect(a.terzi.every((y) => y.stato !== 'spento')).toBe(true);
  });
  it('i sistemi accendono la casella del loro tipo', () => {
    const x = o(); x.assessment.sistemi = [{ id: 's1', nome: 'Core banking', complessita: 'alta', tipo: 'core' }];
    const a = architettura(cfg, x);
    expect(a.cliente.find((y) => y.id === 'core')!.stato).toBe('sviluppo');
    expect(a.cliente.find((y) => y.id === 'crm')!.stato).toBe('spento');
    expect(areaVoce(cfg, x, 's1')).toBe('core');
  });
  it('specchietto: grafico senza voci, giornate né fornitori', () => {
    const x = o(); x.soluzione.connettori = ['namirial', 'cleverchain'];
    const json = JSON.stringify(specchietto(cfg, x, 'saas').architettura);
    for (const vietato of [/"gg"/, /namirial/i, /cleverchain/i, /voci/]) expect(json).not.toMatch(vietato);
  });
});


import { contributoAl, costiPiattaforma, costiSistema, costoPiattaformaAl, quotaPiattaforma, sintesi as sintesiOfferta, sviluppoTotale } from './index';

describe('business plan: costi di piattaforma', () => {
  it('escono per intero dal mese di attivazione', () => {
    const c = costiPiattaforma(cfg);
    expect(c.dal.toISOString().slice(0, 7)).toBe('2026-07');
    expect(costoPiattaformaAl(c, new Date(Date.UTC(2026, 5, 1)))).toBe(0);
    expect(costoPiattaformaAl(c, new Date(Date.UTC(2026, 7, 1)))).toBeCloseTo(c.unaTantum + 2 * c.mese, 6);
  });
  it('la curva sottrae i costi di piattaforma anche senza progetti', () => {
    const c = costiPiattaforma(cfg);
    const p = curvaRecupero(0, [], new Date(Date.UTC(2026, 0, 1)), 4, c);
    expect(p[2].cumulato).toBeCloseTo(-(c.unaTantum + 3 * c.mese), 6);   // fine Q3: luglio–settembre
  });
  it('ReeVo e n8n partono ciascuno dal proprio mese', () => {
    const c = structuredClone(cfg);
    c.costiSistema = { sviluppo: [], reevoDal: '2026-07', n8nDal: '2026-10' };
    const p = costiPiattaforma(c);
    const reevo = p.voci!.find((v) => v.id === 'reevo')!, n8n = p.voci!.find((v) => v.id === 'n8n')!, ams = p.voci!.find((v) => v.id === 'ams')!;
    expect(n8n.dal.toISOString().slice(0, 7)).toBe('2026-10');
    /* a settembre n8n non è ancora partito */
    expect(costoPiattaformaAl(p, new Date(Date.UTC(2026, 8, 1)))).toBeCloseTo(reevo.unaTantum + 3 * (reevo.mese + ams.mese), 6);
    /* a ottobre scatta anche n8n */
    expect(costoPiattaformaAl(p, new Date(Date.UTC(2026, 9, 1)))).toBeCloseTo(reevo.unaTantum + 4 * (reevo.mese + ams.mese) + n8n.mese, 6);
    expect(p.dal.toISOString().slice(0, 7)).toBe('2026-07');
  });
  it('senza costi di sistema (versioni storiche) tutto parte da attivaDal e lo sviluppo è il numero di investimento', () => {
    const c = structuredClone(cfg); delete c.costiSistema;
    const s = costiSistema(c);
    expect(s.reevoDal).toBe('2026-07'); expect(s.n8nDal).toBe('2026-07');
    expect(sviluppoTotale(c)).toBe(c.investimento.sviluppo);
  });
  it('lo sviluppo è la somma del registro e cresce con le voci', () => {
    const c = structuredClone(cfg);
    c.costiSistema = { sviluppo: [{ id: 'a', mese: '2026-06', importo: 100000, nota: '' }, { id: 'b', mese: '2026-11', importo: 25000.5, nota: '' }], reevoDal: '2026-07', n8nDal: '2026-07' };
    expect(sviluppoTotale(c)).toBeCloseTo(125000.5, 6);
    c.costiSistema.sviluppo.push({ id: 'c', mese: '2026-12', importo: 4999.5, nota: '' });
    expect(sviluppoTotale(c)).toBeCloseTo(130000, 6);
  });
  it('il contributo del progetto è al lordo della quota condivisa', () => {
    const x = o(); x.approccio = 'saas';
    const s = sintesiOfferta(cfg, x).saas!;
    expect(s.quotaPiattaformaAnnua).toBeCloseTo(quotaPiattaforma(cfg).annua, 6);
    const pr = { id: 'p', cliente: 'X', inizio: new Date(Date.UTC(2026, 0, 1)), margineAnnuo: s.margineAnnuo, marginePrimoAnno: s.marginePrimoAnno,
      licenzaAnnua: s.licenza, durataMesi: 36, inCorso: false, quotaPiattaformaAnnua: s.quotaPiattaformaAnnua, quotaPiattaformaUnaTantum: s.quotaPiattaformaUnaTantum };
    const netto = contributoAl({ ...pr, quotaPiattaformaAnnua: 0, quotaPiattaformaUnaTantum: 0 }, new Date(Date.UTC(2026, 11, 1)));
    expect(contributoAl(pr, new Date(Date.UTC(2026, 11, 1))) - netto).toBeCloseTo(s.quotaPiattaformaAnnua + s.quotaPiattaformaUnaTantum, 6);
  });
});


import { areaTipo } from './index';

describe('tipi dei sistemi', () => {
  it('un sistema di firma elettronica accende la casella Firma, i pagamenti i sistemi core', () => {
    expect(areaTipo('firma')).toBe('firma');
    expect(areaTipo('pagamenti')).toBe('core');
    expect(areaTipo('portale')).toBe('altri');
    const x = o(); x.soluzione.connettori = [];
    x.assessment.light = true; x.assessment.moduli = [];
    x.assessment.sistemi = [{ id: 's1', nome: 'Firma del gruppo', complessita: 'media', tipo: 'firma' }];
    expect(architettura(cfg, x).terzi.find((y) => y.id === 'firma')!.stato).toBe('sviluppo');
  });
});

describe('SaaS: prezzo dal costo', () => {
  const x = () => { const v = o(); v.prezzo.margineVenduto = 0.3; return v; };
  const r = calcola(cfg, x());
  it('il consumo per pratica è il costo variabile ÷ (1 − margine − riserve)', () => {
    const d = r.consumo.modello === 'costo' ? r.consumo : null;
    expect(d).not.toBeNull();
    expect(d!.costoPratica).toBeCloseTo(0.1 * x().assessment.documentiPerPratica, 4);
  });
  it('il margine annuo sul venduto coincide con quello richiesto senza sconti', () => {
    const v = x();
    v.prezzo.scaglioni.forEach((s) => { s.sconto = 0; });
    const rr = calcola(cfg, v);
    const costi = rr.saas.ricorrenti.reduce((a, v) => a + v.costo, 0);
    expect(1 - costi / rr.saas.licenza.totale).toBeCloseTo(0.3, 2);
  });
  it('lo sconto riduce il prezzo e il margine della fascia', () => {
    const v = x();
    v.prezzo.scaglioni.forEach((s, i) => { s.sconto = i === 0 ? 0 : 0.5; });
    const rr = calcola(cfg, v);
    expect(rr.consumo.fasce[1].prezzo).toBeLessThan(rr.consumo.fasce[0].prezzo);
  });
  it('fascia sotto il margine minimo segnalata', () => {
    const c = structuredClone(cfg);
    c.consumo!.margineMinimo = 0.9;
    const rr = calcola(c, x());
    expect(rr.consumo.fasce.some((f) => f.sottoMargine)).toBe(true);
  });
  it('il canone manuale vince su quello derivato', () => {
    const v = x(); v.leve.canoneSaas = 99999; v.leve.canoneManuale = true;
    expect(calcola(cfg, v).saas.licenza.software).toBe(99999);
  });
  it('capacità: segnala quando pratiche impegnate + offerta superano il totale', () => {
    const c = structuredClone(cfg);
    c.capacita = { pratichePerAnno: 300000, praticheImpegnate: 290000 };
    expect(calcola(c, x()).capacita?.supera).toBe(true);
    c.capacita.praticheImpegnate = 0;
    expect(calcola(c, x()).capacita?.supera).toBe(false);
  });
  it('configurazioni senza consumo restano sul listino', () => {
    const c = structuredClone(cfg); delete c.consumo; delete c.capacita;
    const rr = calcola(c, nuovaOfferta(c, 'Storico'));
    expect(rr.consumo.totale).toBe(5000 * 6 + 10000 * 4.5 + 5000 * 3.5);
    expect(rr.capacita).toBeNull();
  });
});

import { pianoTrimestrale, ricaviAl } from './index';

describe('business plan: piano trimestrale', () => {
  const prog = (id: string, inizio: string, over: Partial<Progetto> = {}): Progetto => ({
    id, cliente: id, inizio: new Date(inizio), margineAnnuo: 40000, marginePrimoAnno: 60000, licenzaAnnua: 100000,
    prezzoPrimoAnno: 150000, durataMesi: 36, inCorso: false, quotaPiattaformaAnnua: 10000, quotaPiattaformaUnaTantum: 2000, ...over
  });
  const da = new Date(Date.UTC(2027, 0, 1));
  it('ricavi = una tantum all\'avvio + canone mese per mese', () => {
    const p = prog('a', '2027-01-01');
    expect(ricaviAl(p, new Date(Date.UTC(2027, 2, 1)))).toBeCloseTo(50000 + 100000 * 3 / 12, 6);
    expect(ricaviAl(p, new Date(Date.UTC(2026, 11, 1)))).toBe(0);
  });
  it('ricavi − costi diretti = margine, e il cumulato torna con contributoAl', () => {
    const p = prog('a', '2027-01-01');
    const pi = pianoTrimestrale(0, [p], da, 4);
    for (const t of pi.trimestri) {
      const r = t.progetti[0];
      expect(r.ricavi - r.costiDiretti).toBeCloseTo(r.margine, 6);
    }
    expect(pi.trimestri[3].progetti[0].margineCum).toBeCloseTo(contributoAl(p, new Date(Date.UTC(2027, 11, 1))), 6);
  });
  it('lo stesso pareggio della curva di recupero', () => {
    const ps = [prog('a', '2027-01-01'), prog('b', '2027-04-01')];
    const cfgPf = costiPiattaforma(cfg);
    const curva = curvaRecupero(80000, ps, da, 12, cfgPf);
    const pi = pianoTrimestrale(80000, ps, da, 12, cfgPf);
    expect(pi.pareggio).toBe(pareggio(curva));
    pi.trimestri.forEach((t, i) => expect(t.netto).toBeCloseTo(curva[i].cumulato, 6));
  });
  it('deselezionare un progetto toglie ricavi e margine e sposta il pareggio', () => {
    const a = prog('a', '2027-01-01'), b = prog('b', '2027-01-01');
    const due = pianoTrimestrale(150000, [a, b], da, 12);
    const uno = pianoTrimestrale(150000, [a], da, 12);
    expect(uno.trimestri[0].ricavi).toBeCloseTo(due.trimestri[0].ricavi / 2, 6);
    expect(uno.indicePareggio).toBeGreaterThan(due.indicePareggio);
  });
  it('senza progetti: nessun ricavo e nessun pareggio', () => {
    const pi = pianoTrimestrale(1000, [], da, 4);
    expect(pi.pareggio).toBeNull();
    expect(pi.trimestri[0].ricavi).toBe(0);
  });
});
