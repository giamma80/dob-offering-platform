# ALTEN Quotation — design system dello strumento di preventivazione DOB

Sistema di design per lo strumento web che quota la piattaforma **Digital Onboarding (DOB)** nei due
scenari di erogazione — SaaS multi-tenant e on-premise su OpenShift del cliente. Nasce dal modello
`Findomestic_pricing_DOB.xlsx` (7 fogli, 272 formule) e ne porta a schermo la logica, non il layout.

Chi lo usa: il **Business Manager ALTEN** davanti al cliente o in preparazione d'offerta. Lo apre poche
volte per trattativa, non ricorda dove stanno i parametri, e deve rispondere a «quanto costa» e «quanto
ci guadagniamo» senza chiamare il PM.

## I cinque principi

1. **Un solo punto di governo.** Gli input stanno in un posto e tutto il resto è calcolato. Il modello
   Excel ha questa regola e la paga con un limite noto: una cella d'input non è editabile da fogli
   diversi, e duplicarla creerebbe più verità in conflitto. Qui il punto di governo diventa una **barra
   leve persistente** su ogni sezione: unica fonte, sempre a portata, nessun duplicato.
2. **Ogni numero dichiara la sua origine.** Fatto da documento, input commerciale, scelta da validare,
   punto aperto. È il contenuto che rende lo strumento difendibile in riunione, ed è parte del design,
   non una nota a piè di pagina.
3. **Colpo d'occhio prima del dettaglio.** La Home risponde in cinque secondi: prezzo, margine, pareggio,
   punti aperti. Il dettaglio è a un clic, nelle stesse sezioni del foglio di calcolo.
4. **L'asimmetria fra i due scenari va detta, non nascosta.** AMS incluso nel SaaS ed escluso
   on-premise, licenza n8n a carico del cliente solo on-premise, infrastruttura solo in uno dei due: i
   due totali non sono direttamente confrontabili e l'interfaccia lo dichiara dove mostra il confronto.
5. **Il riservato è riservato per costruzione.** La base di costo e i margini non possono finire
   nell'export cliente per dimenticanza: l'esclusione è un comportamento del sistema, non un passo
   manuale a fine lavoro.

## Fondamenta visive

### Colore

Palette dal **Brandbook ALTEN 2025**, usata alla lettera: Azure Blue `#008bd2`, Navy Blue `#043962`,
Ochre Yellow nelle sue gradazioni. Il testo corrente è navy, mai nero — è una regola del brandbook e
vale anche qui.

| Ruolo | Token | Regola d'uso |
|---|---|---|
| Inchiostro | `ink-primary`, `ink-secondary`, `ink-muted` | `ink-primary` per tutto ciò che si legge; `ink-secondary` per note e unità; `ink-muted` solo placeholder |
| Superfici | `surface-canvas`, `surface-card`, `surface-sunken` | la gerarchia la fanno bordo e fondo, non l'ombra |
| Identità | `surface-brand`, `surface-brand-deep` | barra leve, bande di totale, aree interne ALTEN |
| Azione | `accent-azure`, `accent-azure-text` | `accent-azure` riempie (leve, barre, bordi attivi); per il **testo** si usa solo `accent-azure-text`, il solo azzurro leggibile a 14px |
| Punto aperto | `signal-open`, `signal-open-soft`, `signal-open-ink` | parametro da fissare col business |
| Esito | `signal-positive`, `signal-negative` | margine e verso della decisione, non decorazione |

Tre regole che non si negoziano:

- **Il colore non porta mai un'informazione da solo.** Ogni stato ha anche una parola, un pallino, una
  barra laterale o una chiave di provenienza.
- **L'azzurro e il giallo non sono interscambiabili.** Azzurro = azione nostra. Giallo = decisione che
  manca. Un punto aperto colorato d'azzurro sparisce fra i controlli.
- **`signal-negative` significa «fuori dai nostri totali» o «in perdita».** Non significa «errore di
  compilazione»: quello è un messaggio in linea sotto il campo.

Due temi, chiaro e scuro, nello stesso file. Tutte le coppie testo/fondo sono verificate a 4.5:1 in
entrambi i temi; bordi di controllo e anelli di focus a 3:1.

### Tipografia

**Metropolis** (font principale del brandbook) nei pesi 400/500/600/700/800, inclusa come file woff2.
Fallback: Arial, come prescrive il brandbook per gli ambienti dove Metropolis non è disponibile.
Scotch Display, font display secondario del brandbook, **non** è usato qui: uno strumento di calcolo non
ha titoli editoriali, e un secondo carattere aggiungerebbe un asse di variazione senza lavoro da fare.

Due gruppi di stili: **Testo** (`display` → `caption`) e **Cifre** (`figure-hero`, `figure`,
`figure-row`). Le cifre sono lo stesso carattere con due obblighi: `font-variant-numeric: tabular-nums`
e allineamento a destra. Una colonna di importi che non è incolonnata non si confronta.

### Numeri, formato italiano

- Migliaia con il punto, decimali con la virgola: `145.819`, `4,63`.
- Simbolo `€` **dopo** il numero, separato da uno spazio fine non divisibile (`&nbsp;`). Il numero e la
  sua unità non vanno mai a capo separati.
- Importi d'offerta senza decimali; prezzi unitari con due; percentuali e anni con uno.
- Percentuali sempre con la base accanto: «66,5% sul ricavo» dice qualcosa, «66,5%» no.
- Un valore non calcolabile è `—` più la riga che dice quale input manca. Mai `0` al posto di un vuoto:
  nel modello zero è un numero che significa qualcosa.

### Spaziatura, raggi, ombre

Scala a passo 4 (`space-1` 4px → `space-16` 64px); `space-05` esiste solo per lo stacco fra un numero e
la sua unità. Raggi da 3px (badge) a 12px (card principale), `radius-pill` per pomelli e segmented.
Tre sole ombre: card a riposo, elemento agganciato, pomello della leva. Nessun'ombra decorativa, nessun
gradiente, nessuna superficie vetrata: è uno strumento di quotazione e l'unica cosa che deve emergere è
il numero.

### Iconografia

Dodici icone a tratto, 16×16, `stroke-width` 1.5, in `currentColor`: prendono il colore del testo che
accompagnano e funzionano su fondo chiaro, su `surface-brand` e nel tema scuro senza varianti. Stanno nella riga
dell'etichetta di un KPI o nel titolo di una card, a 14-16px, con `aria-hidden="true"`. L'insieme completo e le regole
sono in `assets/Icons`.

Le icone non sostituiscono mai un'etichetta — un lucchetto al posto della parola «Riservato» obbliga a interpretare un
simbolo su un dato che non può essere interpretato male — e non si colorano con i colori di segnale: il segnale lo porta
il bordo o il badge. Nessuna emoji.

## Il sistema di provenienza

Quattro chiavi, applicate a ogni input e a ogni totale di scenario:

| Chiave | Origine | Esempio nel modello DOB |
|---|---|---|
| `D` | fatto da documento | canoni ReeVo, ordini 30074608 / 30074609 / 30076130 |
| `I` | input commerciale | tariffe giornaliere, canoni, quote di testing, PM e contingenza |
| `S` | scelta da validare | giornate per attività, cascata delle quote, full cost 330 €/gg su 220 gg |
| `?` | punto aperto | scaglioni, metrica di consumo, chi paga il costo AI on-premise |

Finché esiste un `?` nello scenario, l'export per il cliente resta non disponibile e dice quale
decisione manca. È l'unico blocco dello strumento, ed esiste perché mandare un'offerta con gli scaglioni
ancora da definire è il rischio più concreto di questo preventivo.

## Riservatezza

Tre livelli, resi visibili:

- **Condivisibile col cliente** — perimetro, servizi professionali, scenari, confronto.
- **Riservato ALTEN** — base di costo, margini, sensibilità ai clienti attivi. Banda `.alt-confid` in
  testa all'area, badge sul tab, esclusione automatica dall'export cliente.
- **Riservato esterno (C2)** — condizioni economiche di fornitura di terzi. Il numero porta accanto la
  frase che dice che non è trasferibile come base d'offerta verso un altro cliente.

## Stati da progettare sempre

Prima volta (nessuna leva mossa: si mostrano i valori di base con la frase che lo dice), caricamento
(scheletro del numero, etichetta già presente), ricalcolo oltre 400ms (numeri in aggiornamento a
opacità ridotta, mai pagina vuota), errore d'input (in linea, con il modo di uscirne), punto aperto
(giallo più marcatore), voce non applicabile allo scenario (sola lettura più il perché), export bloccato
(motivo e link alla decisione che manca).

## Accessibilità

Requisito, non rifinitura. Testo 4.5:1, bordi di controllo e focus 3:1, anello di focus sempre visibile
e mai rimosso, area cliccabile 44px su touch, ogni campo con `<label for>`, tabelle con `<caption>` e
`scope`, grafici con `role="img"` e un `aria-label` che riassume l'andamento, stato annunciato in
`aria-live="polite"` a leva ferma, `prefers-reduced-motion` rispettato. Tutta l'interfaccia è usabile da
tastiera: lo slider nativo porta frecce, Home/End e PageUp/PageDown, e non va sostituito da un div
trascinabile.

## Componenti

| Componente | A cosa serve |
|---|---|
`LeverBar` | le quattro leve commerciali, agganciate su ogni sezione |
`LeverControl` | la singola leva con slider, valore e effetto dichiarato |
`KpiTile` | il numero della Home con la frase che lo rende leggibile |
`FormControls` | campi, segmented, interruttori del tab Parametri |
`CostTable` | dettaglio a giornate con la cascata delle quote |
`TierTable` | scaglioni marginali, editabili, con lo stato «da definire» |
`MarginPanel` | sostenibilità: ricavo meno i costi che restano ad ALTEN |
`SensitivityChart` | il grafico di sensibilità al volume |
`ScenarioTabs` | navigazione fra sezioni e scelta dello scenario |
`StatusBadge` | incluso, escluso, da definire, riservato |
`ProvenanceTag` | da dove viene questo numero |

I componenti sono CSS su token (`components/bundle.css`) più markup HTML nativo: nessuna dipendenza di
libreria, nessun bundle JavaScript. Chi consuma il sistema carica `tokens.css` e `bundle.css` e usa gli
elementi nativi con le classi `alt-*`. Gli stili non contengono valori letterali di colore o di
spaziatura: solo variabili di token.

## Fedeltà al brand e estensioni

- **Dal brandbook ALTEN 2025**, invariati: Azure `#008bd2`, Navy `#043962`, Ochre `#ffda65` / `#ffd500`
  / `#ffba00` / `#ffef86`, le gradazioni `#7dcaed` `#b2e0f5` `#176f98` `#4a617d`, i neutri `#d2d7de` e
  `#8d9cad`, il carattere Metropolis, il testo corrente in navy.
- **Estensioni di questo sistema**, necessarie a uno strumento che il brandbook non copre: i due colori
  di esito (`signal-positive` `#0d7163`, `signal-negative` `#b23a2f`), perché un margine in utile e una
  voce fuori offerta non sono dicibili con la sola palette di marca; i fondi tenui dei segnali; i navy e
  i grigi intermedi necessari a raggiungere i rapporti di contrasto nel tema scuro. Vanno proposte al
  brand prima di estenderle ad altri strumenti.
- Il logo ALTEN non è incluso: va preso dai file ufficiali (`alten.com` → press center) e non
  ricostruito. Dove serve il marchio, per ora c'è il nome in Metropolis 800.

## Fonti

- Brandbook ALTEN 2025 (colori, tipografia, uso del testo in navy).
- `Findomestic_pricing_DOB.xlsx`, versione del 20 novembre 2026, e le sue note metodologiche
  (perimetro, cascata delle quote, scaglioni marginali, base di costo, punti aperti).
