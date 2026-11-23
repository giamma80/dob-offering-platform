import type { Config, Offerta } from './types';

/* Configurazione di sistema iniziale. È la stessa che sta nel seed di Supabase
   (supabase/seed/configurazione.json, generato da questo file con `npm run seed:json`).
   Fonti: controllo di gestione per i costi delle figure; ordini ReeVo 30074608/30074609/30076130;
   business plan ALTEN DOB per n8n+OCR, AMS e investimento. */
export const CONFIG_DEFAULT: Config = {
  margineVenduto: 0.30,
  figure: [
    { id: 'arch',   nome: 'Architetto / analista tecnico', costo: 269 },
    { id: 'funz',   nome: 'Analista funzionale senior',    costo: 269 },
    { id: 'dev',    nome: 'Sviluppatore / configuratore',  costo: 220 },
    { id: 'devops', nome: 'DevOps / piattaforma',          costo: 269 },
    { id: 'media',  nome: 'Media ponderata',               costo: 250 }
  ],
  quote: [
    { id: 'test', nome: 'Testing',                pct: 0.10, figura: 'dev',   ambito: 'customizzazione' },
    { id: 'pm',   nome: 'Project management',     pct: 0.12, figura: 'arch',  ambito: 'customizzazione' },
    { id: 'cont', nome: 'Contingenza',            pct: 0.10, figura: 'media', ambito: 'customizzazione' },
    { id: 'gar',  nome: 'Garanzia post go-live',  pct: 0.05, figura: 'dev',   ambito: 'setup' }
  ],
  costiCondivisi: {
    reevo: [
      { nome: 'Cluster TEST', mese: 2749.88 },
      { nome: 'Cluster PROD e PREPROD', mese: 6207.75 },
      { nome: 'VPN site-to-site', mese: 29 }
    ],
    reevoServiziUnaTantum: 8500,
    n8nOcrMese: 868,
    amsSaasAnno: 20000,
    supportoAnno: 3000,
    clientiAttivi: 4
  },
  ai: { perDocumento: 0.10, documentiPerPratica: 4 },
  /* Pesi differenziati per complessità (proposta da validare); somma 100. */
  moduli: [
    { id: 'workflow',    nome: 'Workflow management',                         peso: 18 },
    { id: 'identita',    nome: 'Documenti d\'identità',                         peso: 14 },
    { id: 'docmgmt',     nome: 'Document management evoluto',                 peso: 12,
      customizzazione: { id: 'doc-custom', nome: 'Gestione documentazione custom', gg: 15, figura: 'dev' } },
    { id: 'firma',       nome: 'Firma elettronica digitale',                  peso: 10, connettori: ['namirial', 'aruba'] },
    { id: 'credit',      nome: 'Integrazione credit screening (CRIF / CleverChain)', peso: 10, connettori: ['cleverchain', 'cerved'] },
    { id: 'pep',         nome: 'Liste PEP e AML',                             peso: 10 },
    { id: 'spid',        nome: 'Integrazione SPID / wallet',                  peso: 9 },
    { id: 'sso',         nome: 'Integrazione SSO',                            peso: 6, integrazioni: ['sso'] },
    { id: 'design',      nome: 'Integrazione design system custom',           peso: 6, integrazioni: ['grafica'] },
    { id: 'observ',      nome: 'Integrazione observability cliente',          peso: 5 }
  ],
  catalogo: {
    base: [
      { id: 'journey',   nome: 'Analisi journey e requisiti', gg: 60, figura: 'funz' },
      { id: 'flussi',    nome: 'Configurazione dei flussi',   gg: 48, figura: 'dev' },
      { id: 'integr',    nome: 'Integrazioni con i sistemi',  gg: 48, figura: 'dev' },
      { id: 'test-uat',  nome: 'Test e supporto UAT',         gg: 32, figura: 'dev' },
      { id: 'formaz',    nome: 'Formazione e avvio',          gg: 30, figura: 'funz' }
    ],
    connettori: [
      { id: 'api-gw',      nome: 'Internal API Gateway', gg: 18, figura: 'dev', default: true },
      { id: 'cleverchain', nome: 'CleverChain',          gg: 8,  figura: 'dev', default: true },
      { id: 'namirial',    nome: 'Namirial Sign',        gg: 4,  figura: 'dev', default: true },
      { id: 'cerved',      nome: 'Cerved',               gg: 6,  figura: 'dev', default: false },
      { id: 'aruba',       nome: 'Aruba Sign',           gg: 4,  figura: 'dev', default: false }
    ],
    integrazioni: [
      { id: 'journey-agg', nome: 'Journey aggiuntivo',    gg: 24, figura: 'funz', default: true },
      { id: 'grafica',     nome: 'Grafica del front-end', gg: 12, figura: 'dev',  default: true },
      { id: 'sso',         nome: 'SSO federato',          gg: 10, figura: 'dev',  default: false, vincolo: 'sso' },
      { id: 'multi',       nome: 'Multi-società',         gg: 20, figura: 'dev',  default: false }
    ],
    cicd: [
      { id: 'openshift', nome: 'OpenShift',  gg: 150, figura: 'devops' },
      { id: 'k8s',       nome: 'Kubernetes', gg: 120, figura: 'devops' },
      { id: 'vm',        nome: 'VM',         gg: 180, figura: 'devops' },
      { id: 'aws',       nome: 'AWS',        gg: 130, figura: 'devops' },
      { id: 'gcp',       nome: 'GCP',        gg: 130, figura: 'devops' },
      { id: 'azure',     nome: 'Azure',      gg: 130, figura: 'devops' }
    ],
    ambientiSaas: { numero: 3, ggPerAmbiente: 10, figura: 'devops' },
    passaggioConsegne: { id: 'consegne', nome: 'Passaggio di consegne', gg: 30, figura: 'arch' }
  },
  vincoli: [
    { id: 'ue',        nome: 'Dati in UE',               effetto: { tipo: 'nessuno' },                                  specchietto: null, default: true },
    { id: 'normativo', nome: 'Adeguamento normativo',    effetto: { tipo: 'ricorrente_fisso', importo: 2200 },           specchietto: 'aggiornamenti normativi inclusi', default: true },
    { id: 'kpi',       nome: 'Penali su KPI',            effetto: { tipo: 'ricorrente_pct_licenza', pct: 0.05 },         specchietto: null, default: true },
    { id: 'uscita',    nome: 'Supporto on demand',       effetto: { tipo: 'una_tantum_gg', gg: 55, figura: 'dev' },      specchietto: 'Supporto on demand', default: true },
    { id: 'sso',       nome: 'SSO federato',             effetto: { tipo: 'sblocca', voce: 'sso' },                      specchietto: null, default: false },
    { id: 'audit',     nome: 'Audit annuale di sicurezza', effetto: { tipo: 'ricorrente_fisso', importo: 6000 },         specchietto: 'Audit annuale', default: false }
  ],
  leve: {
    canoneSaas: 140000,
    softwareOnPremise: 40000,
    aiOnPremise: 'incluso',
    manutenzioneOnPremise: { attiva: true, gg: 220, figura: 'dev' }
  },
  scaglioni: [
    { da: 1,     a: 5000,  prezzo: 6.0 },
    { da: 5001,  a: 15000, prezzo: 4.5 },
    { da: 15001, a: 30000, prezzo: 3.5 },
    { da: 30001, a: null,  prezzo: 2.5 }
  ],
  investimento: { sviluppo: 174209, amPrimoAnno: 20000 }
};

/** Nuova offerta: ogni valore esiste subito, preso dalla configurazione, ed è "assunto". */
export function nuovaOfferta(cfg: Config, cliente = ''): Offerta {
  return {
    cliente,
    approccio: 'entrambi',
    assessment: {
      volumeAnnuo: 20000, crescita: 0.30, documentiPerPratica: cfg.ai.documentiPerPratica, sistemi: [],
      light: false, moduli: (cfg.moduli ?? []).map((m) => m.id)
    },
    soluzione: {
      connettori: cfg.catalogo.connettori.filter((c) => c.default).map((c) => c.id),
      connettoriCustom: [],
      integrazioni: cfg.catalogo.integrazioni.filter((c) => c.default).map((c) => c.id),
      integrazioniCustom: [],
      cicd: cfg.catalogo.cicd[0].id,
      passaggioConsegne: true
    },
    stima: {
      base: cfg.catalogo.base.map((v) => ({ ...v })),
      gg: {},
      quote: Object.fromEntries(cfg.quote.map((q) => [q.id, q.pct])) as Offerta['stima']['quote']
    },
    prezzo: {
      margineVenduto: cfg.margineVenduto,
      tariffe: {},
      scaglioni: cfg.scaglioni.map((s) => ({ ...s })),
      metrica: null,
      consumoOnPremise: false,
      minimoGarantito: null
    },
    leve: structuredClone(cfg.leve),
    vincoli: Object.fromEntries(cfg.vincoli.map((v) => [v.id, v.default])),
    importiVincoli: {}
  };
}
