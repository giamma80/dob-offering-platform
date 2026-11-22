# ScenarioTabs

La navigazione dello strumento: i tab ricalcano i fogli del modello, il segmented sceglie quale scenario si guarda.

## I tab

Home, Perimetro, Parametri, Servizi professionali, Scenario A, Scenario B, Confronto, Sostenibilità. L'ordine è quello del modello Excel, e questo è voluto: chi arriva dal foglio ritrova le stesse sette sezioni con gli stessi nomi (Jakob). La Home è nuova ed è la prima.

## Regole

- **Tab per le sezioni, segmented per lo scenario.** Sono due assi diversi: «quale parte del preventivo guardo» e «quale dei due modi di consumare la piattaforma». Fonderli in un unico elenco di tab costringerebbe a duplicare ogni sezione per scenario.
- `aria-current="page"` sul tab attivo, con bordo inferiore `accent-azure` e colore del testo: non solo il colore.
- Il **pallino `signal-open`** segnala che la sezione contiene punti aperti. Il pallino è decorativo (`aria-hidden`): il conteggio accessibile sta nel KPI «Punti aperti» della Home e nel testo del tab quando è attivo.
- Il tab Sostenibilità porta il badge «Riservato» in chiaro, non un'icona a lucchetto da interpretare.
- **Lo stato vive nell'URL**: sezione, scenario e set di leve sono deep-linkable, così un preventivo si manda a un collega come link e non come file. Il tasto indietro del browser torna al tab precedente.
- «Esporta per il cliente» è un'azione secondaria (`--ghost`) e resta non disponibile con punti aperti, spiegando quali: un'offerta con gli scaglioni ancora da definire è il rischio più concreto dello strumento. Non si disabilita senza il motivo accanto.
- «Salva versione» è l'unica azione primaria della barra. Il lavoro non si perde: le leve si applicano subito, il salvataggio fissa una versione citabile in trattativa.
- Sotto 900px i tab scrollano orizzontalmente conservando il tab attivo in vista; non diventano un menu a tendina, che nasconderebbe la mappa delle sezioni.

## Accessibilità

- `<nav aria-label>` intorno ai tab; ogni tab è un `<button>` o un `<a>` reale, mai un `div` con onclick.
- Area di 44px di altezza per ogni tab.
- Il segmented è un `role="group"` con `aria-pressed` sui tre pulsanti.
