# Icone

Dodici icone a tratto, 16×16, `stroke-width` 1.5, disegnate per questo strumento. Nessun riempimento, nessuna emoji.

## Regole

- **L'icona non sostituisce mai l'etichetta.** Accompagna il testo in una riga `alt-kpi__label` o in un titolo di card,
  a 14px, con `aria-hidden="true"`: chi usa uno screen reader sente l'etichetta, che dice già tutto.
- **Monocromatiche, in `currentColor`.** Prendono il colore del testo che accompagnano, quindi funzionano su fondo
  chiaro, su `surface-brand` e nel tema scuro senza varianti. Per questo nei file l'ink è `#043962`: va sostituito con
  `currentColor` quando l'icona viene messa in linea nel markup.
- **Una per card, nella riga dell'etichetta.** Non si usano come decorazione, non si ingrandiscono oltre i 16px e non si
  colorano con i colori di segnale: il segnale lo porta il bordo o il badge.

## L'insieme

| Icona | Dove si usa |
|---|---|
| `banknote` | prezzo, totale di perimetro |
| `box` | primo impianto |
| `calendar` | licenza annuale, ricorrenza |
| `trend` | margine |
| `swap` | differenza fra i due scenari |
| `alert` | punti aperti |
| `scale` | punto di pareggio |
| `layers` | volumi, scaglioni |
| `clock` | orizzonte temporale |
| `users` | clienti attivi, costi condivisi |
| `lock` | area riservata |
| `target` | obiettivo, soglia di margine |
