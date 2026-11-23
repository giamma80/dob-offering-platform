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
  /* I 12 moduli del catalogo (Digital Onboarding follow up, slide 4–7). I cinque nativi sono sempre inclusi.
     Pesi per complessità (proposta da validare): somma 100, nativi 50. `area` lega il modulo al grafico. */
  moduli: [
    { id: 'core',      nome: 'Core Onboarding Digitale',          peso: 14, nativo: true, area: 'notifiche' },
    { id: 'designer',  nome: 'Designer dei Workflow',              peso: 12, nativo: true, area: 'workflow' },
    { id: 'form',      nome: 'Costruttore di Form',                peso: 8,  nativo: true, area: 'workflow' },
    { id: 'ocr',       nome: 'OCR ed Elaborazione Documentale',    peso: 14, area: 'doc',
      opzioneClassi: { id: 'doc-custom', nome: 'Gestione documentazione custom', impianto: 5, perClasse: 3, figura: 'dev' } },
    { id: 'firma',     nome: 'Firma Digitale',                     peso: 8,  area: 'firma', connettori: ['yousign', 'namirial', 'infocert'] },
    { id: 'kyc',       nome: 'Suite KYC',                          peso: 8,  area: 'kyc', connettori: ['onfido', 'jumio', 'veriff', 'cerved'] },
    { id: 'aml',       nome: 'Screening AML',                      peso: 7,  area: 'aml', connettori: ['cleverchain', 'crif', 'complyadvantage'] },
    { id: 'credito',   nome: 'Rischio di Credito',                 peso: 6,  area: 'aml', connettori: ['crif', 'cerved', 'cleverchain', 'vies'] },
    { id: 'backoffice', nome: 'Operatività di Back Office',        peso: 10, nativo: true, area: 'componibile' },
    { id: 'rbac',      nome: 'RBAC e Gestione Utenti',             peso: 6,  nativo: true, area: 'componibile' },
    { id: 'sso',       nome: 'SSO e Autenticazione',               peso: 4,  area: 'componibile', integrazioni: ['sso'] },
    { id: 'integrazioni', nome: 'Integrazioni e Connettori',       peso: 3,  area: 'multifornitore', connettori: ['arch-infocert', 'arch-aruba', 'webhook'] }
  ],
  integrazioneSistema: { bassa: 5, media: 10, alta: 20, figura: 'dev' },
  catalogo: {
    base: [
      { id: 'journey',   nome: 'Analisi journey e requisiti', gg: 60, figura: 'funz' },
      { id: 'flussi',    nome: 'Configurazione dei flussi',   gg: 48, figura: 'dev' },
      { id: 'integr',    nome: 'Impostazione delle integrazioni', gg: 16, figura: 'dev' },
      { id: 'test-uat',  nome: 'Test e supporto UAT',         gg: 32, figura: 'dev' },
      { id: 'formaz',    nome: 'Formazione e avvio',          gg: 30, figura: 'funz' }
    ],
    /* Provider per modulo, con i nomi del catalogo. Giornate per analogia (stima da validare). */
    connettori: [
      { id: 'api-gw',          nome: 'Internal API Gateway',                 gg: 18, figura: 'dev', default: true, area: 'multifornitore' },
      { id: 'smtp',            nome: 'SMTP Gateway (email e SMS)',           gg: 2,  figura: 'dev', default: true, area: 'notifiche' },
      { id: 'yousign',         nome: 'YouSign',                              gg: 4,  figura: 'dev', default: false },
      { id: 'namirial',        nome: 'Namirial',                             gg: 4,  figura: 'dev', default: true },
      { id: 'infocert',        nome: 'InfoCert',                             gg: 4,  figura: 'dev', default: false },
      { id: 'onfido',          nome: 'Onfido',                               gg: 8,  figura: 'dev', default: false },
      { id: 'jumio',           nome: 'Jumio',                                gg: 8,  figura: 'dev', default: false },
      { id: 'veriff',          nome: 'Veriff',                               gg: 8,  figura: 'dev', default: false },
      { id: 'cerved',          nome: 'Cerved',                               gg: 6,  figura: 'dev', default: false },
      { id: 'cleverchain',     nome: 'Cleverchain',                          gg: 8,  figura: 'dev', default: true },
      { id: 'crif',            nome: 'CRIF',                                 gg: 8,  figura: 'dev', default: false },
      { id: 'complyadvantage', nome: 'ComplyAdvantage',                      gg: 8,  figura: 'dev', default: false },
      { id: 'vies',            nome: 'VIES (validazione Partita IVA)',       gg: 2,  figura: 'dev', default: false },
      { id: 'arch-infocert',   nome: 'Archivio documentale InfoCert',        gg: 5,  figura: 'dev', default: false },
      { id: 'arch-aruba',      nome: 'Archivio documentale Aruba',           gg: 5,  figura: 'dev', default: false },
      { id: 'webhook',         nome: 'Webhook verso sistemi terzi',          gg: 3,  figura: 'dev', default: false }
    ],
    integrazioni: [
      { id: 'journey-agg', nome: 'Journey aggiuntivo',                  gg: 24, figura: 'funz', default: true,  area: 'workflow' },
      { id: 'grafica',     nome: 'Design system custom',                gg: 12, figura: 'dev',  default: true,  area: 'design' },
      { id: 'sso',         nome: 'Federazione SSO (OpenID Connect / SAML 2.0)', gg: 10, figura: 'dev', default: false, vincolo: 'sso', area: 'componibile' },
      { id: 'multi',       nome: 'Multi-società',                       gg: 20, figura: 'dev',  default: false, area: 'workflow' },
      { id: 'spid',        nome: 'Integrazione SPID / wallet',          gg: 10, figura: 'dev',  default: false, area: 'kyc' },
      { id: 'observ',      nome: 'Integrazione observability cliente',  gg: 6,  figura: 'dev',  default: false, area: 'bi' }
    ],
    cicd: [
      { id: 'openshift', nome: 'OpenShift',  gg: 150, figura: 'devops' },
      { id: 'k8s',       nome: 'Kubernetes', gg: 120, figura: 'devops' },
      { id: 'vm',        nome: 'VM',         gg: 180, figura: 'devops' },
      { id: 'aws',       nome: 'AWS',        gg: 130, figura: 'devops' },
      { id: 'gcp',       nome: 'GCP',        gg: 130, figura: 'devops' },
      { id: 'azure',     nome: 'Azure',      gg: 130, figura: 'devops' }
    ],
    ambientiSaas: { numero: 3, ggPerAmbiente: 10, figura: 'devops' }
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
  investimento: { sviluppo: 174209, amPrimoAnno: 20000 },
  piattaforma: { attivaDal: '2026-07' }
};

/** Nuova offerta: ogni valore esiste subito, preso dalla configurazione, ed è "assunto". */
export function nuovaOfferta(cfg: Config, cliente = ''): Offerta {
  return {
    cliente,
    approccio: 'entrambi',
    assessment: {
      volumeAnnuo: 20000, crescita: 0.30, documentiPerPratica: cfg.ai.documentiPerPratica, sistemi: [],
      light: false, moduli: (cfg.moduli ?? []).map((m) => m.id), opzioniModuli: {}
    },
    soluzione: {
      connettori: cfg.catalogo.connettori.filter((c) => c.default).map((c) => c.id),
      connettoriCustom: [],
      integrazioni: cfg.catalogo.integrazioni.filter((c) => c.default).map((c) => c.id),
      integrazioniCustom: [],
      cicd: cfg.catalogo.cicd[0].id
    },
    stima: {
      base: cfg.catalogo.base.map((v) => ({ ...v })),
      gg: {},
      extra: [],
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
