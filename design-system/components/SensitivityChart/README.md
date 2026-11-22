# SensitivityChart

Il grafico di sensibilità: come cambia il totale dei due scenari al variare del volume annuo. Nello strumento i grafici sono pochi e questo è il primo.

## Quanti grafici, e quali

Tre in tutto, uno per domanda:

1. **Sensibilità al volume** (questo) — linee, perché la domanda è «in che direzione va al crescere del volume».
2. **Composizione del margine** — barra in pila (`MarginPanel`), perché la domanda è «di cosa è fatto il ricavo».
3. **Sensibilità ai clienti attivi** — barre, perché la domanda è «quanto cambia il margine fra 1 e 6 clienti», su valori discreti.

Nessun altro grafico. Tutto il resto del modello è una tabella: i numeri di un preventivo si leggono incolonnati, non stimati a occhio su un asse.

## Regole

- **Linee per il continuo, barre per il discreto, pila per la composizione.** Mai una torta: le quote del margine vanno confrontate fra due scenari, e due torte non si confrontano.
- Due serie, non più: scenario A in `accent-azure`, scenario B in `surface-brand`. Si distinguono per chiarezza, non solo per tinta, e restano distinguibili in bianco e nero.
- Il volume ipotizzato è una verticale tratteggiata `signal-open`, con i due valori etichettati sul punto: il resto della curva è contesto, quel punto è il preventivo.
- Etichette dei valori direttamente sui punti letti, non in un tooltip al passaggio: il numero che conta non deve richiedere un gesto.
- Asse Y in formato breve (300 k, 1,2 M); i valori esatti stanno sulle etichette e nella tabella sotto.
- Sotto il grafico, una frase che dice cosa farne. Un grafico senza la sua conclusione fa perdere tempo a chi lo guarda.
- Non c'è griglia verticale: le orizzontali bastano per leggere l'altezza, le verticali aggiungono rumore.

## Accessibilità

- `role="img"` con un `aria-label` che riassume la direzione e i valori agli estremi: non un elenco di tutti i punti.
- La stessa serie è disponibile come tabella nella pagina Confronto: il grafico non è l'unico accesso ai dati.
- Colori delle serie con rapporto almeno 3:1 verso il fondo della card e differenza di chiarezza fra loro.
