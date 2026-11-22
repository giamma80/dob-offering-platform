# StatusBadge

Dichiara in una parola il rapporto fra una voce e il perimetro dell'offerta, perché l'asimmetria fra i due scenari è l'informazione più delicata del modello.

## Varianti

| Variante | Quando | Token |
|---|---|---|
| `--incluso` | la voce è dentro il totale dello scenario mostrato | `signal-positive` su `signal-positive-soft` |
| `--escluso` | la voce è fuori dai totali e resta a carico del cliente (licenza n8n, OpEx, AMS on-premise) | `signal-negative` su `signal-negative-soft` |
| `--aperto` | il valore è un'ipotesi di lavoro da confermare dal business (scaglioni, metrica di consumo, volume) | `signal-open-ink` su `signal-open-soft` |
| `--riservato` | il dato non va mostrato al cliente (base di costo, margini) | `ink-on-brand` su `surface-brand-deep` |
| `--neutro` | la voce non si applica allo scenario corrente | `ink-secondary` su `surface-sunken` |

## Regole

- Una sola variante per voce. Se una voce è insieme esclusa e da definire, vince `--escluso`: il cliente deve capire prima di tutto chi paga.
- Il badge non sostituisce il numero. Una voce esclusa mostra comunque il suo importo, nella riga `.is-out` della tabella, fuori dai totali.
- Il colore non è l'unico segnale: ogni variante porta il pallino e il testo. Chi non distingue i colori legge la parola.
- Testo sempre in maiuscolo con lo stile `label`, mai più di due parole.
- `--riservato` compare solo dentro aree già marcate come interne; non va messo accanto a un numero che finisce nell'export cliente.

## Cosa fornisce il consumatore

L'etichetta e la variante. Il componente non deduce lo stato dal modello di calcolo.
