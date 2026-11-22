# ProvenanceTag

Marca ogni numero con la sua origine. È il componente che rende lo strumento difendibile in riunione: davanti alla domanda «questo dato da dove esce?» la risposta è già a schermo.

## Le quattro origini

| Chiave | Origine | Significato | Token |
|---|---|---|---|
| `D` | **Fatto da documento** | letto da un ordine, un contratto o un documento di progetto; si cita il riferimento | `surface-brand` |
| `I` | **Input commerciale** | valore deciso da chi quota: tariffe, canoni, quote percentuali, volumi | `accent-azure` |
| `S` | **Scelta da validare** | assunzione di chi ha costruito il modello: giornate, cascata delle quote, full cost | `signal-open` |
| `?` | **Punto aperto** | non ancora deciso da nessuno: blocca l'invio al cliente | `signal-negative` |

## Regole

- Ogni cella d'input e ogni totale di scenario porta una provenienza. Un numero senza provenienza è un bug di contenuto.
- La chiave è una lettera, non solo un colore, e porta `aria-hidden` perché il testo accanto dice già la stessa cosa.
- Dopo la chiave va il riferimento concreto, non la categoria: «ord. 30074608» vale più di «da documento».
- `?` è l'unico marcatore che alimenta un blocco: finché esiste un punto aperto nello scenario, l'azione «Prepara offerta cliente» resta non disponibile e ne spiega il perché.
- Il marcatore vive in linea nel testo, a 12px: non è un badge e non va messo in colonna da solo.

## Cosa fornisce il consumatore

Origine e riferimento. La mappa origine → colore è fissata qui e non si personalizza per pagina.
