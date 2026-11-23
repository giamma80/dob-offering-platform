# Backlog — dal mockup all'applicazione

Stato al primo rilascio. In ordine di priorità; ogni voce indica la schermata del mockup di riferimento (`docs/mockup/`).

## Già nell'applicazione

- Login con link via email, solo @alten.it; selettore lingua IT/EN in alto a destra.
- Monitoraggio: elenco offerte (ordinabile, duplicazione), business plan essenziale, parametri di sistema versionati.
- Offerta: tab Dettaglio interno / Specchietto cliente, timeline a cinque fasi con avanzamento, sotto-sezioni di ogni fase, footer delle leve su due righe, salvataggio automatico, invio in approvazione e approvazione.
- Motore di calcolo v2 con test: tariffe dal margine sul venduto, N + 1, voci parametriche, consumo a scaglioni, tre modalità AI, manutenzione on-premise, vincoli, soglia del canone, specchietto, serie a 36 mesi, composizioni, sensibilità ai clienti, curva di recupero.
- Fasi 1–4 come pagina unica di card (mockup), righe aggiungibili, interruttori della Soluzione, card Canoni e Minimo garantito.
- Resoconto con grafici ad area e barre (toggle scenario, Area/Barre, €/%), Sostenibilità, Dettaglio costi A/B.
- Catalogo a 12 moduli allineato alle presentazioni, provider per modulo, grafico dell'architettura in Soluzione e nello specchietto (configurazione v4).
- Cascata Assessment → Soluzione → Stima: sistemi con complessità, copertura via connettore, classi documentali, customizzazione raggruppata per origine (configurazione v3).
- Business plan con curva di recupero, timeline dei progetti e contributi; Parametri di sistema in card.

## Da fare

1. **Chi approva** (design §15.1). Introdurre un ruolo `approvatore` (tabella `profili` con RLS) e limitare `approva()` e la policy di update sullo stato.
5. **Assessment** (`Assessment.dc.html`): dati del cliente, sistemi da integrare come chip.
7. **Stima**: riga "+ voce" nella base applicativa.
9. **Parametri di sistema** (`Sistema.dc.html`): modifica del catalogo (aggiunta e rimozione voci), vincoli e scaglioni di default; storico delle versioni.
10. **Specchietto**: esportazione PDF e DOCX dalla sola funzione `specchietto()`.
11. **Storico degli stati**: registrare chi e quando per ogni passaggio assunto → dichiarato → confermato (oggi c'è solo lo snapshot per offerta).
12. **i18n dei dati di catalogo**: nomi di figure, connettori e vincoli oggi sono solo in italiano (`nome`); aggiungere `nome_en` alla configurazione.
13. **Tema scuro**: i token ci sono già (`[data-theme="dark"]`), manca il selettore.

## Da verificare con il business

- Pesi dei 12 moduli (nativi 50%) e giornate dei nuovi provider, stimate per analogia.
- Parametri di sistema non ancora modificabili da interfaccia: voci parametriche, vincoli, leve di default, scaglioni di consumo, investimento.

- Giornate CI/CD per AWS, GCP e Azure (130 gg, stima).
- Importo di default dell'audit annuale (6.000 €/anno, segnaposto).
