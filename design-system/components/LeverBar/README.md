# LeverBar

Le quattro leve commerciali in una barra agganciata sotto la navigazione, presente su **ogni** tab dello strumento.

## Perché esiste

È la risposta al limite dichiarato del modello Excel: una cella d'input non può essere resa editabile da più fogli, e duplicarla creerebbe più verità in conflitto. Chi quota era costretto a passare dal foglio Parametri e tornare indietro per vedere l'effetto. Qui la leva e il risultato stanno nello stesso campo visivo: la barra è l'unico punto di governo, i tab sono solo viste.

## Contenuto

Quattro voci, nell'ordine in cui si negozia: canone SaaS, canone on-premise, sconto consumo on-premise, clienti attivi sul multi-tenant. Le altre centinaia di parametri restano nel tab Parametri: la barra è per ciò che si muove davanti al cliente.

## Regole

- **Quattro voci, non cinque.** La barra è larga quanto la finestra: la quinta leva riduce ogni slider a una corsa inusabile. Per aggiungerne una se ne toglie una.
- Valore a sinistra dello slider, non sopra: così la colonna dei numeri resta allineata e leggibile anche mentre gli slider si muovono.
- `position: sticky` sotto la barra di navigazione, con `shadow-raised` quando la pagina è scrollata. Lo sticky non deve coprire il focus di un campo sottostante: la pagina scrolla con `scroll-margin-top` pari all'altezza di nav più barra.
- Fondo `surface-brand`: la barra è ALTEN, i tab sotto sono il documento. Il cliente, in sessione condivisa, deve capire a vista che quella fascia è lo strumento e non l'offerta.
- Sotto 1024px la barra collassa in una riga con i quattro valori e un pulsante «Leve» che apre un pannello: gli slider non si usano a 320px di larghezza divisi per quattro.
- Ogni movimento ricalcola tutta la pagina entro 100ms. Se il ricalcolo supera i 400ms, i numeri in aggiornamento restano visibili con opacità ridotta: non si svuota la pagina (Doherty).
- Il valore mostrato è sempre quello corrente del modello, anche quando la leva è stata cambiata da un altro tab. Nessuna copia locale.

## Accessibilità

- Ogni slider ha un `<label for>` visibile, non solo l'attributo `aria-label`.
- La barra è una `<section aria-label="Leve commerciali">`, raggiungibile da tastiera prima del contenuto del tab.
- Un `aria-live="polite"` annuncia il totale ricalcolato dopo che la leva si è fermata, non a ogni passo.
