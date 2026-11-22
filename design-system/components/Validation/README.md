# Validation

Tre livelli, e la differenza fra loro non e' il colore ma cosa impedisce.

| Livello | Quando | Campo | Notifica | Blocca il salvataggio |
|---|---|---|---|---|
| **Errore** | il valore rende il modello incoerente: scaglioni non contigui, campo obbligatorio vuoto, percentuale fuori da 0-100 | bordo e fondo rossi, messaggio sotto il campo | toast rosso, resta finche' non si corregge | si |
| **Avviso** | il valore e' valido ma fuori soglia: canone sotto il costo variabile, margine sotto il minimo di sistema, volume oltre il dimensionamento | bordo e fondo gialli, messaggio sotto il campo | toast giallo, si chiude dopo 6 secondi | no |
| **Conferma** | il dato e' stato validato o salvato | bordo verde, nessun fondo | toast verde, 3 secondi | no |

## Regole

- Il messaggio sotto il campo dice **cosa fare**, non cosa e' successo: "si sovrappone allo scaglione 1", non "valore non valido".
- Un campo obbligatorio porta l'asterisco nell'etichetta. L'asterisco e' rosso e ha `aria-hidden`: l'obbligatorieta' viaggia su `required`, non sul simbolo.
- La validazione scatta **in uscita dal campo**, non a ogni tasto: correggere un numero mentre lo si scrive non deve accendere un errore a meta' cifra.
- Il toast non sostituisce il messaggio sul campo. Il toast dice quanti problemi ci sono, il campo dice quale.
- Un errore che blocca il salvataggio deve poter essere raggiunto: il toast rosso porta al primo campo in errore.
- Mai piu' di tre toast insieme: oltre, uno solo che conta i problemi.

## Accessibilita'

- Il contenitore dei toast e' `role="status"` con `aria-live="polite"`; per gli errori `aria-live="assertive"`.
- Il messaggio del campo e' legato con `aria-describedby`, e il campo in errore porta `aria-invalid="true"`.
- Colore mai da solo: ogni stato ha un'icona e un testo.
- Contrasti misurati: errore 5,1:1, avviso 6,4:1, bordo del campo 3,1:1.
