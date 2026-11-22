# KpiTile

Un numero per riquadro, con la frase che lo rende interpretabile. È l'unità di cui è fatta la home: il colpo d'occhio sul preventivo.

## Anatomia

```
┌──────────────────────────────┐
│ ETICHETTA              label │
│ 888.244 €        figure-hero │
│ ▁▁▁▁▁▁▁▁▁        spark (opz.)│
│ frase di lettura     caption │
└──────────────────────────────┘
```

## La scala: tre livelli, non uno

Una griglia di riquadri tutti uguali non è una gerarchia: se ogni numero ha la stessa dimensione, nessuno è il primo
da leggere e l'occhio deve rileggerli tutti. La dimensione dice l'importanza.

| Livello | Classe | Cifra | Quanti per pagina | Cosa ci va |
|---|---|---|---|---|
| 1 — la risposta | `--hero` | `figure-display` 52px | **uno** | il prezzo dello scenario che si sta quotando, con l'altro scenario accanto in `alt-hero__aside` a 28px come riscontro |
| 2 — la scomposizione | `--md` | 26px | tre o quattro | primo impianto, licenza annuale, margine annuo: i numeri che spiegano il livello 1 |
| 3 — il contorno | `--sm` | 17px | fino a sei, in una `alt-strip` | pareggio, costi condivisi, volume, orizzonte, punti aperti: parametri di lettura, non risultati |

Il livello 1 risponde alla domanda per cui si è aperto lo strumento. Il livello 2 la scompone. Il livello 3 sono le
condizioni in cui quella risposta vale. Un numero che non sta in una di queste tre frasi non va nella home.

## Varianti

- **Standard** — fondo `surface-card`. Per tutti i KPI.
- **`--brand`** — fondo `surface-brand`. **Uno solo per pagina**: il prezzo che il cliente pagherebbe nello scenario mostrato. Se ce ne sono due, nessuno dei due è più il primo che si legge (effetto Von Restorff perso).
- **Riquadro con bordo `signal-open`** — conta i punti aperti. Non è un KPI economico: è un semaforo sulla maturità del preventivo.

## Regole

- La terza riga non ripete il numero: lo spiega. «66,5% sul ricavo · con 4 clienti attivi» dice la percentuale e l'assunzione da cui dipende.
- Cifre sempre `tabular-nums` e unità in `--unit` a peso minore: il numero resta la figura, l'unità il contorno.
- Formato italiano: punto per le migliaia, virgola per i decimali, simbolo € dopo il numero con spazio fine. Gli importi di offerta si mostrano senza decimali; percentuali e anni con un decimale.
- Il delta usa `--up` solo quando il verso è favorevole ad ALTEN, `--down` quando richiede una decisione commerciale, `--flat` quando è una scomposizione neutra. Il colore non va usato per decorare.
- Massimo sei riquadri su una schermata: oltre, nessuno viene letto (Hick).
- Stato di caricamento: etichetta e scheletro del numero, mai il riquadro vuoto. Valore non calcolabile: `—` e una riga che dice quale input manca.

## Cosa fornisce il consumatore

Etichetta, valore già formattato, unità, frase di lettura, verso del delta e larghezza dello spark.
