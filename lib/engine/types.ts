/* Tipi del motore di calcolo. Il motore è fatto di funzioni pure: niente DOM, niente rete.
   Gira identico nel browser (leve nel footer) e sul server (sintesi salvata in offerte.sintesi). */

export type FiguraId = 'arch' | 'funz' | 'dev' | 'devops' | 'media';

export interface Figura {
  id: FiguraId;
  nome: string;
  costo: number;            // €/giorno, dal controllo di gestione
}

export interface Quota {
  id: 'test' | 'pm' | 'cont' | 'gar';
  nome: string;
  pct: number;              // 0.10 = 10%
  figura: FiguraId;
  /** customizzazione: cascata su base + customizzazioni; setup: sulle giornate di messa in opera */
  ambito: 'customizzazione' | 'setup';
}

export interface VoceCatalogo {
  id: string;
  nome: string;
  gg: number;
  figura: FiguraId;
}

export interface TargetCicd extends VoceCatalogo {}

export interface VincoloDef {
  id: 'ue' | 'normativo' | 'kpi' | 'uscita' | 'sso' | 'audit';
  nome: string;
  /** effetto sui costi: importo fisso annuo, percentuale della licenza, giornate una tantum */
  effetto:
    | { tipo: 'nessuno' }
    | { tipo: 'ricorrente_fisso'; importo: number }
    | { tipo: 'ricorrente_pct_licenza'; pct: number }
    | { tipo: 'una_tantum_gg'; gg: number; figura: FiguraId }
    | { tipo: 'sblocca'; voce: string };
  specchietto: string | null;   // riga o nota che compare nello specchietto cliente
  default: boolean;
}

export interface Scaglione { da: number; a: number | null; prezzo: number }

/** Modulo standard della piattaforma DOB. In configurazione light l'impianto si paga per la quota
   dei moduli scelti; un modulo spento blocca connettori e integrazioni collegati. */
export interface ModuloDob {
  id: string;
  nome: string;
  peso: number;                     // % del costo dell'impianto; la somma dei moduli è 100
  connettori?: string[];            // id di catalogo collegati
  integrazioni?: string[];
  customizzazione?: VoceCatalogo;   // voce che il modulo aggiunge sempre alla customizzazione
  /** opzione a classi: se attivata nell'offerta, impianto + giornate per classe */
  opzioneClassi?: { id: string; nome: string; impianto: number; perClasse: number; figura: FiguraId };
  /** nativo: sempre incluso, non si deseleziona con la configurazione light */
  nativo?: boolean;
  /** area del grafico dell'architettura che il modulo accende */
  area?: AreaArchitettura;
}

/** Aree del grafico dell'architettura (Digital Onboarding follow up, slide 3). */
export type AreaArchitettura =
  | 'kyc' | 'aml' | 'firma' | 'doc' | 'notifiche'
  | 'componibile' | 'workflow' | 'design' | 'multifornitore'
  | 'core' | 'crm' | 'dms' | 'bi' | 'altri';

export type TipoSistema = 'core' | 'crm' | 'dms' | 'bi' | 'altri';

/** Configurazione di sistema: una riga versionata di public.configurazione.dati */
export interface Config {
  margineVenduto: number;                 // 0.30 = 30% sul venduto
  figure: Figura[];
  quote: Quota[];
  costiCondivisi: {
    reevo: { nome: string; mese: number }[];   // C2-Restricted: mai nello specchietto
    reevoServiziUnaTantum: number;
    n8nOcrMese: number;
    amsSaasAnno: number;
    supportoAnno: number;
    clientiAttivi: number;                // N: clienti GIÀ attivi, senza l'offerta in corso
  };
  ai: { perDocumento: number; documentiPerPratica: number };
  moduli: ModuloDob[];
  /** giornate dell'integrazione dedicata a un sistema, per complessità */
  integrazioneSistema: { bassa: number; media: number; alta: number; figura: FiguraId };
  catalogo: {
    base: VoceCatalogo[];
    connettori: (VoceCatalogo & { default: boolean; area?: AreaArchitettura })[];
    integrazioni: (VoceCatalogo & { default: boolean; vincolo?: VincoloDef['id']; area?: AreaArchitettura })[];
    cicd: TargetCicd[];
    ambientiSaas: { numero: number; ggPerAmbiente: number; figura: FiguraId };
    passaggioConsegne: VoceCatalogo;
  };
  vincoli: VincoloDef[];
  leve: {
    canoneSaas: number;
    softwareOnPremise: number;
    aiOnPremise: ModalitaAi;
    manutenzioneOnPremise: { attiva: boolean; gg: number; figura: FiguraId };
  };
  scaglioni: Scaglione[];
  investimento: { sviluppo: number; amPrimoAnno: number };
  /** business plan: mese di attivazione della piattaforma (AAAA-MM), da cui escono i costi condivisi */
  piattaforma?: { attivaDal: string };
}

export type ModalitaAi = 'incluso' | 'proxy' | 'cliente';
export type Approccio = 'saas' | 'on_premise' | 'entrambi';
export type StatoValore = 'assunto' | 'dichiarato' | 'confermato';

export type GruppoCustom = 'integrazioni' | 'catalogo' | 'moduli' | 'stima';

export interface RigaGg {
  id: string; nome: string; gg: number; figura: FiguraId;
  /** per le customizzazioni: gruppo e origine, per rendere tracciabile la cascata */
  gruppo?: GruppoCustom;
  origine?: string;
}

export type Complessita = 'bassa' | 'media' | 'alta';

/** Sistema del cliente da integrare (Assessment). In Soluzione si copre con un connettore di catalogo
   oppure genera un'integrazione dedicata con le giornate della sua complessità. */
export interface Sistema {
  id: string;
  nome: string;
  complessita: Complessita;
  /** casella "Sistemi cliente" del grafico */
  tipo?: TipoSistema;
  copertoDa?: string | null;        // id del connettore di catalogo che lo copre
}

/** Input di un'offerta: public.offerte.dati */
export interface Offerta {
  cliente: string;
  approccio: Approccio;
  assessment: {
    settore?: string;
    referente?: string;
    /** configurazione light: solo i moduli in `moduli`; altrimenti piattaforma completa */
    light?: boolean;
    moduli?: string[];
    volumeAnnuo: number;
    crescita: number;
    documentiPerPratica: number;
    sistemi: (Sistema | string)[];   // string: formato precedente, normalizzato dal motore
    /** opzioni a classi dei moduli: { [idModulo]: { attiva, classi } } */
    opzioniModuli?: Record<string, { attiva: boolean; classi: number }>;
  };
  soluzione: {
    connettori: string[];                 // id di catalogo selezionati
    connettoriCustom: RigaGg[];           // aggiunti al volo
    integrazioni: string[];
    integrazioniCustom: RigaGg[];
    cicd: string;                         // id del target CI/CD on-premise
    passaggioConsegne: boolean;
    /** sottosezioni della Soluzione spente con l'interruttore: non entrano nel calcolo */
    sezioniOff?: ('connettori' | 'integrazioni' | 'cicd')[];
  };
  stima: {
    base: RigaGg[];                       // giornate della base applicativa (copiate dal catalogo)
    gg: Record<string, number>;           // giornate sovrascritte per id di connettore/integrazione/cicd/sistema
    /** customizzazioni aggiunte dal delivery in Stima (origine "in stima") */
    extra?: RigaGg[];
    quote: Record<Quota['id'], number>;   // percentuali per questa offerta
  };
  prezzo: {
    margineVenduto: number;
    tariffe: Partial<Record<FiguraId, number>>;   // tariffe imposte a mano (deroga)
    scaglioni: Scaglione[];
    metrica: 'avviata' | 'completata' | null;
    consumoOnPremise: boolean;
    minimoGarantito: number | null;
  };
  leve: Config['leve'];
  vincoli: Partial<Record<VincoloDef['id'], boolean>>;
  /** importi delle voci dai vincoli, quando dichiarati */
  importiVincoli: Partial<Record<VincoloDef['id'], number>>;
}
