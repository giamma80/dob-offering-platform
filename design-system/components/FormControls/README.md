# FormControls

Campi del tab Parametri. Sostituiscono la convenzione «cella blu su fondo giallo» del foglio Excel: qui ciò che è modificabile si vede perché ha un bordo e un fondo da campo, non perché si ricorda una legenda di colori.

## Quando usare quale controllo

| Controllo | Quando | Esempio |
|---|---|---|
| Campo numerico con unità | il valore è continuo e il commerciale ha un numero preciso in testa | tariffe, volumi, full cost |
| Campo + leva | il valore si negozia e conviene esplorarlo | canoni, sconto consumo |
| Segmented | 2–4 alternative, tutte da vedere insieme | orizzonte 1 / 3 / 5 anni |
| Menu a tendina | 5 o più alternative, o una scelta ancora da fare | metrica di consumo |
| Interruttore | la voce entra o esce dal calcolo | costo AI a carico ALTEN |

Oltre quattro alternative il segmented non sta in riga e si passa al menu; sotto cinque voci il menu nasconde scelte che dovrebbero essere visibili (Hick).

## Il campo sull'intestazione

`--invert` è la variante per un campo dentro la banda `surface-brand`: il nome del cliente si compila lì, e resta
**vuoto con un segnaposto**, non precompilato con l'ultimo cliente. Un nome già scritto in un preventivo nuovo è il modo
più rapido per mandare al cliente sbagliato il prezzo di un altro. La data, al contrario, parte da oggi: è un default
che nel 99% dei casi è giusto e che si corregge in un gesto.

## Regole

- Unità **dentro** il campo come suffisso, non nell'etichetta: l'etichetta dice cosa è, il suffisso in cosa si misura.
- Numeri allineati a destra e `tabular-nums`: una colonna di tariffe si confronta a colpo d'occhio solo se le cifre sono incolonnate.
- Formato italiano in lettura (`20.000`), inserimento tollerante (Postel): si accettano `20000`, `20.000`, `20 000`, `20000,5`; alla perdita del focus il campo si riformatta. Non si rifiuta un incollaggio.
- `--open` (bordo e fondo `signal-open`) marca i campi segnaposto: full cost, scaglioni, documenti per transazione. Il colore non basta, sotto c'è sempre il marcatore `S` o `?` che dice cosa manca.
- Nessun campo disabilitato senza spiegazione: una voce non applicabile allo scenario mostra il valore in sola lettura con la frase che dice perché (es. «nello scenario SaaS non si applica»).
- Errori in linea, sotto il campo, con il modo di uscirne: «La fascia 2 parte da 5.001: il valore inserito si sovrappone alla fascia 1». Mai un alert.
- Un cambiamento ha effetto subito, senza pulsante Salva, con la possibilità di annullare l'ultima modifica. Lo scenario corrente è il documento di lavoro.
- Altezza dei controlli 36px, area cliccabile della riga con etichetta almeno 44px su touch.

## Accessibilità

- `<label for>` su ogni campo; il gruppo di un segmented è un `role="group"` con `aria-label`, i pulsanti portano `aria-pressed`.
- L'interruttore è un `<input type="checkbox">` nascosto con etichetta cliccabile: lo stato arriva allo screen reader senza ARIA aggiuntivo.
- `inputmode` numerico sui campi numerici, `autocomplete="off"`, nessun `spellcheck` su codici e identificativi.
