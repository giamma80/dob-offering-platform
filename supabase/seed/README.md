# Seed

Da applicare nell'ordine, dopo le migrazioni (SQL editor di Supabase o `psql`):

| File | Contenuto |
|---|---|
| `01_configurazione.sql` | Parametri di sistema: costi delle figure, margine 30% sul venduto, costi condivisi (ReeVo, n8n e OCR, AMS, supporto), 4 clienti attivi, catalogo, vincoli, scaglioni, investimento. Inserito solo se la tabella è vuota. |
| `02_offerte.sql` | Findomestic Banca (bozza, SaaS e on-premise, OpenShift), Numia e Alba Leasing (approvate, importi storici del business plan), Unipol · journey vita (bozza on-premise). Riapplicarlo riporta le quattro offerte a questi valori. |

Si rigenerano dal motore con `npm run seed`. `configurazione.json` è la stessa configurazione in JSON.

Le condizioni ReeVo sono C2-Restricted: questi file restano in un repository privato.
