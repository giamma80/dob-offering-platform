# DOB Offering Platform — istruzioni per chi lavora sul codice

Strumento interno ALTEN per quotare la piattaforma Digital Onboarding (DOB). Next.js 15 (App Router) su Vercel, Supabase (Postgres + Auth) in eu-central-1, interfaccia in italiano e inglese.

## Da leggere prima di toccare qualcosa

- `docs/design-v2.md` — cosa fa lo strumento e perché. È la specifica.
- `docs/mockup/*.dc.html` — le 12 schermate approvate. Aprile nel browser: sono il riferimento visivo.
- `design-system/` — token, componenti (`components/bundle.css` → `app/styles/components.css`), README di ogni componente.
- `docs/backlog.md` — cosa manca rispetto al mockup, in ordine.

## Regole che non si negoziano

1. **Il calcolo vive solo in `lib/engine/`.** Funzioni pure, senza DOM né rete, coperte da `calcola.test.ts`. Le pagine non fanno aritmetica sugli importi: chiamano `calcola()`. Ogni nuova regola entra con il suo test.
2. **Lo specchietto cliente si genera solo con `specchietto()`.** Non deve mai contenere giornate, costi, margini, ReeVo, n8n o altri fornitori. Il test "nessun dato interno" deve restare verde.
3. **Condizioni ReeVo: C2-Restricted.** Non vanno in log, in messaggi d'errore, in export o in qualunque output verso il cliente. Non sono trasferibili come base d'offerta verso un altro cliente.
4. **Accesso: solo email @alten.it.** Il controllo sta in tre punti: `middleware.ts`, la server action di login, e le policy RLS (`public.is_alten()`). Non aggiungere tabelle senza RLS. Dopo ogni migrazione: advisor di sicurezza Supabase.
5. **Margine sul venduto, non ricarico.** tariffa = costo ÷ (1 − margine). Con 30% si vende 100 e restano 30.
6. **Costi condivisi ÷ (N + 1).** N = clienti già attivi, l'offerta in corso è il +1.
7. **Nessun controllo di completezza.** Le fasi non si bloccano e i valori non hanno stati: "Invia in approvazione" cambia solo lo stato dell'offerta (bozza → in approvazione → approvata).

## Stile e interfaccia

- Minimalista. **Nessun testo non richiesto**: niente sottotitoli, descrizioni o istruzioni a schermo. Le spiegazioni vanno nei tooltip.
- Importi in euro **sempre con due decimali** (`lib/ui/formato.ts`).
- Data table: ogni colonna ordinabile (`components/TabellaOrdinabile.tsx`), colonne numeriche con `is-num` su `th` e `td`, niente pallini.
- Icone monocromatiche a tratto.
- Validazione come da componente `Validation`: errore blocca e resta, avviso 6 s, conferma 3 s.
- Guscio fisso: testata, tab, timeline e footer fermi; scorre solo la colonna centrale.
- **Ogni testo dell'interfaccia passa da `lib/i18n/dizionari.ts`**, in italiano e inglese. Nessuna stringa visibile scritta nel JSX.

## Dati

- `public.configurazione` — parametri di sistema, una riga per versione; la vista `configurazione_attiva` dà l'ultima. Un'offerta registra la versione con cui è calcolata (`config_versione`): una bozza usa sempre l'ultima e la registra a ogni salvataggio; all'invio in approvazione la versione si congela. `configOfferta()` in `lib/dati.ts` è l'unico punto che decide. `salvaConfig` rifiuta il salvataggio se la pagina è partita da una versione non più attuale.
- `public.offerte` — input in `dati` (jsonb, tipo `Offerta`), stati dei valori in `stati_valore`, sintesi calcolata in `sintesi`.
- `public.offerte_versioni` — storico a ogni salvataggio esplicito e cambio di stato.
- Migrazioni in `supabase/migrations/`. Seed in `supabase/seed/`, da applicare in ordine: `01_configurazione.sql` (parametri di sistema, da `lib/engine/defaults.ts`) e `02_offerte.sql` (Findomestic, Numia, Alba Leasing, Unipol). Si rigenerano con `npm run seed`; sono idempotenti.

## Comandi

```
npm run dev        # sviluppo, serve .env.local (vedi .env.example)
npm test           # motore di calcolo
npm run typecheck
npm run build
npm run tokens     # rigenera app/styles/tokens.css da design-system/tokens.json
```
