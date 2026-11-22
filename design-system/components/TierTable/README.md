# TierTable

La tabella degli scaglioni di consumo, editabile. Rende visibile la cosa che un pay-per-use sbaglia più spesso: se la fascia vale per tutto il volume o solo per la sua parte.

## Regole

- **La colonna «Transazioni nella fascia» non è decorativa: è la prova che il modello è marginale.** Mostra `MAX(0; MIN(volume; soglia_alta) − soglia_bassa + 1)`. Senza quella colonna il lettore non sa se stiamo applicando il prezzo a tutto il volume, e la differenza in fattura è enorme.
- La riga di totale mostra anche il **prezzo medio effettivo** (qui 4,63 € su 20.000 transazioni): è il numero che il cliente userà per confrontarci, e va letto prima che lo trovi lui.
- Finché le fasce sono ipotesi, tutte le righe portano `.is-open` e sopra la tabella c'è la fascia d'avviso. Quando il business fissa i valori, le righe tornano normali e il marcatore passa da `?` a `I`.
- Una fascia vuota al volume corrente resta visibile con zero in `ink-muted` e la spiegazione nel sottotitolo: serve a far vedere la pendenza del listino oltre il volume ipotizzato.
- Nello scenario B il prezzo per transazione è quello di A per lo sconto consumo: la colonna mostra il prezzo derivato e, nel sottotitolo, da dove viene. Non si edita in B.
- Validazione delle soglie in linea: le fasce devono essere contigue e crescenti. Un sovrapporsi di fasce è un errore bloccante, spiegato sotto la cella che lo causa.
- Massimo sei fasce: oltre, il listino non è più spiegabile a voce.

## Accessibilità

- Sei colonne sono il limite su desktop; la tabella scrolla con la prima colonna sticky e non si riorganizza in card.
- L'avviso sopra la tabella è un `role="status"`, non un alert: informa senza interrompere.
