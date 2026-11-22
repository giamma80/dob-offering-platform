// Genera supabase/seed/02_offerte.sql: le offerte di cui si è discusso finora (mockup approvato, business plan DOB).
// Uso: node --experimental-strip-types --no-warnings scripts/seed-offerte.mjs
// Gli id sono fissi: rieseguire il seed aggiorna le stesse righe invece di duplicarle.
import { writeFileSync } from 'node:fs';
const { CONFIG_DEFAULT: cfg, nuovaOfferta, sintesi } = await import('../lib/engine/index.ts');

const q = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const s = (v) => (v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

/* ------------------------------------------------ Findomestic Banca — bozza, in corso */
const fin = nuovaOfferta(cfg, 'Findomestic Banca');
fin.approccio = 'entrambi';
fin.assessment.sistemi = ['CRM Salesforce', 'Core banking · ESB interno', 'Firma elettronica Namirial', 'Antifrode, provider terzo'];
fin.soluzione.cicd = 'openshift';
fin.prezzo.metrica = 'avviata';
const finStati = {
  'assessment.documentiPerPratica': 'dichiarato',
  'assessment.sistemi.CRM Salesforce': 'dichiarato',
  'assessment.sistemi.Core banking · ESB interno': 'dichiarato',
  'assessment.sistemi.Firma elettronica Namirial': 'confermato',
  'assessment.sistemi.Antifrode, provider terzo': 'assunto',
  vincoli: 'dichiarato',
  approccio: 'confermato',
  'soluzione.connettori': 'dichiarato',
  'soluzione.integrazioni': 'dichiarato',
  'soluzione.cicd': 'confermato',
  'leve.manutenzioneOnPremise': 'dichiarato',
  ...Object.fromEntries(fin.stima.base.map((b) => [`stima.base.${b.id}`, 'dichiarato'])),
  'stima.quote': 'dichiarato',
  'prezzo.margineVenduto': 'confermato',
  'leve.canoneSaas': 'dichiarato',
  'leve.softwareOnPremise': 'dichiarato'
  // ancora assunti, quindi bloccanti: volume annuo, scaglioni, metrica, modalità AI on-premise
};

/* ------------------------------------------------ Unipol · journey vita — bozza on-premise */
const uni = nuovaOfferta(cfg, 'Unipol · journey vita');
uni.approccio = 'on_premise';
uni.assessment.sistemi = ['Banca collocatrice', 'Sistema polizze Vita'];
uni.soluzione.connettori = ['cleverchain', 'namirial'];
const uniStati = { approccio: 'confermato', 'soluzione.connettori': 'dichiarato', 'assessment.documentiPerPratica': 'dichiarato' };

/* ------------------------------------------------ Progetti già venduti (approvati)
   Importi storici dal mockup e dal business plan: la sintesi è quella contrattualizzata,
   non un ricalcolo con i parametri di oggi. */
function storico(cliente, una, licenza, margineAnnuo, approvata) {
  const o = nuovaOfferta(cfg, cliente);
  o.approccio = 'saas';
  o.leve.canoneSaas = licenza;
  o.prezzo.scaglioni = [];
  o.prezzo.metrica = 'completata';
  const stati = { 'assessment.volumeAnnuo': 'confermato', 'prezzo.metrica': 'confermato', 'prezzo.scaglioni': 'confermato' };
  const sint = {
    saas: { setup: null, customizzazione: null, unaTantum: una, licenza, primoAnno: una + licenza, margineAnnuo, marginePrimoAnno: margineAnnuo },
    onPremise: null, avanzamento: 100, bloccanti: 0, storico: true
  };
  return { o, stati, sint, approvata };
}

const righe = [
  { id: '00000000-0000-4000-8000-000000000001', o: fin, stati: finStati, stato: 'bozza', sint: sintesi(cfg, fin, finStati), approvata: null },
  { id: '00000000-0000-4000-8000-000000000002', ...(() => { const x = storico('Numia', 106000, 120000, 38400, '2026-02-06'); return { o: x.o, stati: x.stati, sint: x.sint, approvata: x.approvata }; })(), stato: 'approvata' },
  { id: '00000000-0000-4000-8000-000000000003', ...(() => { const x = storico('Alba Leasing', 30000, 10000, 4200, '2026-03-14'); return { o: x.o, stati: x.stati, sint: x.sint, approvata: x.approvata }; })(), stato: 'approvata' },
  { id: '00000000-0000-4000-8000-000000000004', o: uni, stati: uniStati, stato: 'bozza', sint: sintesi(cfg, uni, uniStati), approvata: null }
];

const valori = righe.map((r) => `  (${s(r.id)}, ${s(r.o.cliente)}, '${r.stato}', '${r.o.approccio}', ${q(r.o)}, ${q(r.stati)}, ${q(r.o.vincoli)}, ${q(r.sint)},
   (select max(versione) from public.configurazione), ${r.approvata ? `'${r.approvata}'::timestamptz` : 'null'},
   ${r.approvata ? `'${r.approvata}'::timestamptz` : 'now()'})`).join(',\n');

const sql = `-- Offerte iniziali: Findomestic (in corso), Numia e Alba Leasing (approvate, importi storici), Unipol (bozza).
-- Generato da scripts/seed-offerte.mjs. Idempotente: riapplicarlo riporta le offerte a questi valori.
insert into public.offerte (id, cliente, stato, approccio, dati, stati_valore, vincoli, sintesi, config_versione, approvata_il, creata_il)
values
${valori}
on conflict (id) do update set
  cliente = excluded.cliente, stato = excluded.stato, approccio = excluded.approccio, dati = excluded.dati,
  stati_valore = excluded.stati_valore, vincoli = excluded.vincoli, sintesi = excluded.sintesi,
  config_versione = excluded.config_versione, approvata_il = excluded.approvata_il;
`;
writeFileSync(new URL('../supabase/seed/02_offerte.sql', import.meta.url), sql);
console.log('supabase/seed/02_offerte.sql', sql.length);
