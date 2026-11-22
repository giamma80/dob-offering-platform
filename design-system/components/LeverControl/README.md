# LeverControl

Una leva commerciale: slider per esplorare, numero per decidere, e sotto l'effetto che ha prodotto. Serve a rispondere in riunione a «e se scendessimo del dieci per cento?» senza aprire un foglio di calcolo.

## Anatomia

Etichetta a sinistra, valore live a destra sulla stessa linea di base. Slider a tutta larghezza. Estremi della corsa sotto la traccia. In fondo, provenienza a sinistra ed effetto a destra.

## Regole

- **Lo slider non è l'unico modo di inserire il valore.** Accanto a ogni leva, nella pagina Parametri, c'è il campo numerico: lo slider serve a esplorare, il campo a fissare un numero esatto che il commerciale ha già in testa. Una leva solo-slider fa perdere la precisione; una leva solo-campo fa perdere il senso della corsa.
- **L'effetto va dichiarato sotto la leva**, nei termini della decisione: non «+5.000 €» ma «margine A 66,5%» o «consumo B 37.000 € · era 92.500 €». Senza questa riga la leva è un numero che si muove, non una scelta.
- **Una leva, una grandezza.** Lo sconto consumo agisce solo sul prezzo per transazione dello scenario B e non tocca il canone: due manopole separate perché rispondono a domande diverse. Non si accorpano per fare spazio.
- `--active` marca la leva mossa nell'ultima interazione, così l'occhio ritrova da dove viene il cambiamento nei numeri.
- Estremi della corsa scelti sul mestiere, non sul dato: il massimo non è «il doppio del valore attuale», è il limite oltre il quale la proposta non sta in piedi.
- La provenienza distingue input commerciale (`I`) da assunzione del modello (`S`). Una leva marcata `S` chiede validazione prima di finire in offerta.
- Passo dello slider leggibile: 5.000 € su un canone, 5% su una percentuale, 1 su un conteggio. Mai passo 1 su una scala di 140.000.

## Accessibilità

- `<label for>` esplicito: il valore live non è un'etichetta.
- `aria-describedby` lega la riga dell'effetto allo slider, così chi usa uno screen reader sente la conseguenza e non solo il numero.
- Lo slider nativo porta già le frecce, Home/End e PageUp/PageDown. Non va sostituito da un div trascinabile.
- Pomello di 20px, area di presa di 20px di altezza: sopra la soglia dei 44px solo sommando il padding della riga, quindi su touch la riga intera resta cliccabile per aprire il campo numerico.
