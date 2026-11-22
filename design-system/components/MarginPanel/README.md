# MarginPanel

Il pannello di sostenibilità: quanto resta ad ALTEN dopo i costi che non passano al cliente. È l'area riservata dello strumento.

## Regole di riservatezza

- Il pannello si apre sotto una `.alt-confid` che dice **cosa** contiene e **cosa non** si può fare con esso. Non basta un lucchetto nell'icona del tab.
- Il tab Sostenibilità è l'unico escluso dall'export cliente, e l'esclusione è automatica: nel foglio Excel era un'azione manuale a fine lavoro («rimuovi il foglio Sostenibilità»), ed è esattamente il tipo di passo che si dimentica. Qui l'export cliente non può includerlo; l'export interno lo include e lo marca in ogni pagina.
- Le condizioni di fornitura di terzi (canoni ReeVo e numeri d'ordine) sono riservate verso l'esterno e non sono riusabili come base d'offerta per un altro cliente: la frase va nel pannello, accanto al numero, non in una pagina di note.

## La barra

Una sola barra in pila per scenario: il ricavo è il 100%, le fette sono i costi, l'ultima fetta è il margine. È più leggibile di una torta perché la grandezza da confrontare è una lunghezza, e perché due scenari si impilano uno sotto l'altro.

- I costi in gradazioni di azzurro ALTEN, il margine in `signal-positive`. Un margine negativo diventa `signal-negative` e la barra sfora a destra con un bordo tratteggiato: a 1 cliente attivo il margine SaaS è −26% e deve vedersi che è fuori scala.
- Fette sotto il 4% non portano etichetta interna: stanno in legenda. Non si ruota il testo.
- La barra è `role="img"` con un `aria-label` che elenca le voci e i valori: chi non la vede riceve gli stessi numeri.

## Regole di contenuto

- Ogni costo porta la provenienza e la formula in chiaro («107.840 €/anno ÷ 4 clienti»): è l'unico modo per discutere il margine invece di crederlo.
- La riga di margine dichiara la propria natura: è un **margine di contribuzione**, non comprende l'ammortamento del prodotto già sviluppato. L'89,6% apparente dello scenario on-premise va letto così, e senza questa frase il numero è fuorviante.
- Quando una leva rende il margine negativo, il pannello non si limita a colorare: scrive quale assunzione lo ha causato.
