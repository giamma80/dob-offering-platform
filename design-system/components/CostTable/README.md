# CostTable

La tabella di dettaglio di uno scenario: una riga per attività, giornate per tariffa, e in fondo le quote percentuali a cascata.

## Le classi di riga

| Classe | Significato | Resa |
|---|---|---|
| (nessuna) | attività a giornate | riga normale |
| `.is-quota` | quota percentuale calcolata su righe precedenti | testo `ink-secondary`, la percentuale nel nome e la base nel sottotitolo |
| `.is-sub` | subtotale | `surface-sunken`, bordo superiore `line-strong` |
| `.is-total` | totale dello scenario | banda `surface-brand`, testo bianco: è il numero che va in offerta |
| `.is-out` | voce fuori dai totali, a carico del cliente | fondo `signal-negative-soft`, barra di 3px a sinistra, importo sostituito da «fuori offerta» quando non è un nostro ricavo |

## Regole

- **La cascata va dichiarata, non solo calcolata.** Ogni riga `.is-quota` scrive nel sottotitolo la propria base: «sul subtotale attività», «su attività + testing», «su attività + testing + PM». Senza questa riga nessuno può verificare il totale, e la differenza fra una contingenza a cascata e una piatta è circa il 22% del rischio coperto.
- **Le righe escluse stanno nella tabella, sotto il totale, mai dentro.** Toglierle nasconderebbe al cliente spese che sostiene comunque; metterle dentro gonfierebbe il nostro perimetro. Vanno dopo la banda di totale, visivamente staccate.
- Tre colonne numeriche sempre nello stesso ordine: giornate, tariffa, importo. Tutte `tabular-nums`, allineate a destra, intestazioni `scope="col"`.
- Il nome della voce può portare un sottotitolo in `caption`: serve a spiegare cosa comprende, non a ripetere il nome.
- Nessuna riga a zero: una voce che non si applica allo scenario non compare, e la sua assenza è spiegata nel tab Perimetro.
- Su schermi stretti la tabella scrolla orizzontalmente dentro il suo contenitore, con la prima colonna in `position: sticky`. Non si trasforma in card: il confronto fra importi incolonnati è il motivo per cui è una tabella.
- Testo lungo nel nome: va a capo. Gli importi non vanno mai a capo né troncati.

## Accessibilità

- `<caption>` presente e descrittiva; `<thead>` con `scope="col"`.
- Il colore delle righe escluse è accompagnato dalla barra laterale e dalla parola «fuori offerta»: lo stato non è veicolato dal solo colore.
- `tr:hover` evidenzia la riga in lettura; non sostituisce la selezione, che non esiste in questa tabella.
