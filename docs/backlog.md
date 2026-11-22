# Backlog — dal mockup all'applicazione

Stato al primo rilascio. In ordine di priorità; ogni voce indica la schermata del mockup di riferimento (`docs/mockup/`).

## Già nell'applicazione

- Login con link via email, solo @alten.it; selettore lingua IT/EN in alto a destra.
- Monitoraggio: elenco offerte (ordinabile, duplicazione), business plan essenziale, parametri di sistema versionati.
- Offerta: tab Dettaglio interno / Specchietto cliente, timeline a cinque fasi con avanzamento, sotto-sezioni di ogni fase, footer delle leve su due righe, salvataggio automatico, invio in approvazione e approvazione.
- Motore di calcolo v2 con test: tariffe dal margine sul venduto, N + 1, quote a cascata, consumo a scaglioni, tre modalità AI, manutenzione on-premise, vincoli, soglia del canone, specchietto.

## Da fare

1. **Chi approva** (design §15.1). Introdurre un ruolo `approvatore` (tabella `profili` con RLS) e limitare `approva()` e la policy di update sullo stato.
2. **Resoconto › Sintesi** (`Resoconto.dc.html`): grafico ad area cumulato 36 mesi con toggle Area/Barre (`components/area.py` del mockup come riferimento), stato di approvazione con anello.
3. **Resoconto › Sostenibilità** (`Sostenibilita.dc.html`): area costi/margine, sensibilità a volume e clienti (`sensibilitaVolume`, `sensibilitaClienti` dal motore v1 da portare in v2).
4. **Prezzo › Canoni** (`Prezzo.dc.html`): barra della soglia minima, scomposizione della licenza on-premise; **minimo garantito**.
5. **Assessment** (`Assessment.dc.html`): dati del cliente, sistemi da integrare come chip.
6. **Soluzione**: interruttore per abilitare ogni sotto-sezione; pastiglie "governato da vincolo" con lucchetto.
7. **Stima**: riga "+ voce" nella base applicativa; stato del valore anche su customizzazioni e messa in opera.
8. **Business plan** (`BusinessPlan.dc.html`): curva del margine cumulato con punto di pareggio e timeline dei progetti; scenario effettivamente firmato per le offerte con due scenari.
9. **Parametri di sistema** (`Sistema.dc.html`): modifica del catalogo (aggiunta e rimozione voci), vincoli e scaglioni di default; storico delle versioni.
10. **Specchietto**: esportazione PDF e DOCX dalla sola funzione `specchietto()`.
11. **Storico degli stati**: registrare chi e quando per ogni passaggio assunto → dichiarato → confermato (oggi c'è solo lo snapshot per offerta).
12. **i18n dei dati di catalogo**: nomi di figure, connettori e vincoli oggi sono solo in italiano (`nome`); aggiungere `nome_en` alla configurazione.
13. **Tema scuro**: i token ci sono già (`[data-theme="dark"]`), manca il selettore.

## Da verificare con il business

- Giornate CI/CD per AWS, GCP e Azure (130 gg, stima).
- Importo di default dell'audit annuale (6.000 €/anno, segnaposto).
