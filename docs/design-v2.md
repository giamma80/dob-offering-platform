# Strumento di quotazione DOB — design v2

*Copia del documento di progetto "DOB/Strumento di quotazione DOB - design v2.md". In caso di differenze vale la versione nel progetto Claude; questa copia va aggiornata insieme.*

---

## 1. Intento

Uno strumento interno con cui ALTEN costruisce l'offerta della piattaforma Digital Onboarding per un cliente, dalla prima raccolta di informazioni fino a due output: un **dettaglio interno** con costi, margini e assunzioni, e uno **specchietto cliente** con tre voci e un totale.

Il problema che risolve non è il calcolo — un Excel lo fa — ma tre cose che l'Excel non fa:

1. rende visibile **quanto del prezzo è ancora un'ipotesi**;
2. tiene separato ciò che vede il cliente da ciò che vediamo noi, **per costruzione** e non per disciplina di chi esporta;
3. colloca la singola offerta dentro la sostenibilità della piattaforma, cioè dentro il **recupero dell'investimento** di prodotto.

**Per chi.** Business manager (apre l'offerta e la chiude), presales (definisce la soluzione), delivery (stima le giornate), Head of Innovation (governa i parametri di sistema e il business plan).

## 2. Due macro-aree, separate di default

| | **Offerta** | **Monitoraggio** |
|---|---|---|
| Ambito | una sola offerta alla volta | tutte le offerte, la piattaforma |
| Contenuto | ciclo di vita in 5 fasi, costi, sostenibilità, output | elenco offerte, business plan, parametri di sistema |
| Leve commerciali | **sì**, nel footer fisso | **no** |
| Chi ci lavora | business manager, presales, delivery | Head of Innovation, direzione |

Le leve commerciali (canone SaaS, software on-premise, modalità AI on-premise) appartengono a **una** offerta e vivono in un **footer fisso** dell'area Offerta, su due righe, insieme ai due totali del primo anno. Si passa da un'area all'altra con un interruttore in testata.

Sotto la testata il Monitoraggio ha tre tab (Offerte, Business plan, Parametri di sistema) e l'Offerta ne ha due: **Dettaglio interno** e **Specchietto cliente**. La timeline delle cinque fasi sta dentro il Dettaglio interno. Lo Specchietto non ha timeline e resta bloccato finché l'offerta non è approvata. La tabella dei costi per voce è la terza sotto-sezione del Resoconto (Sintesi, Sostenibilità, Dettaglio costi).

Le offerte approvate si aprono in lettura o si **duplicano**: i default della nuova offerta arrivano da quella approvata invece che dal sistema.

## 3. Ciclo di vita: cinque fasi

| | Fase | Cosa si fissa | Chi la compila |
|---|---|---|---|
| 1 | **Assessment** | cliente, volumi annui e crescita, documenti per pratica, sistemi da integrare, vincoli contrattuali | business manager |
| 2 | **Soluzione** | approccio (SaaS, on-premise o entrambi), connettori, integrazioni, target CI/CD per l'on-premise, modalità AI | presales |
| 3 | **Stima** | giornate per voce, con i default di catalogo da confermare; quote a cascata | delivery |
| 4 | **Prezzo** | tariffe, margine sul venduto, canoni, scaglioni, minimo garantito | business manager |
| 5 | **Resoconto** | sintesi delle quattro fasi; da qui escono i due output | chi chiude l'offerta |

Timeline orizzontale fissa sotto i tab; ogni nodo mostra nome, anello di avanzamento e percentuale di valori non più assunti. Si clicca su qualunque nodo, avanti o indietro.

## 4. Assunzioni al posto dei blocchi

Nessuna fase è bloccata. Ogni valore esiste sempre e dichiara il proprio stato:

| Stato | Significato | Resa |
|---|---|---|
| **Assunto** | default di sistema o di catalogo | campo tratteggiato su fondo tenue |
| **Dichiarato** | inserito o modificato da qualcuno | campo normale |
| **Confermato** | validato con la controparte | bordo verde, spunta |

L'avanzamento di una fase è la quota di valori non più assunti. **Il blocco si sposta sull'approvazione**: con valori critici ancora assunti l'offerta resta in bozza e non produce lo specchietto. Voci critiche: volume annuo, metrica di consumo, scaglioni, modalità AI on-premise, target CI/CD se l'approccio include l'on-premise. Ogni passaggio di stato è registrato.

## 5. Modello dei costi interni

### 5.1 Figure professionali — una tantum

| Figura | Costo interno | Fonte |
|---|---|---|
| Architetto / analista tecnico | 269 €/gg | controllo di gestione |
| Analista funzionale senior | 269 €/gg | controllo di gestione |
| Sviluppatore / configuratore | 220 €/gg | controllo di gestione |
| DevOps / piattaforma | 269 €/gg | controllo di gestione |
| Media ponderata | 250 €/gg | consuntivo di prodotto (174.209 € ÷ 697 gg) |

**Prezzo = costo ÷ (1 − margine sul venduto).** Margine di sistema 30% sul venduto, pari a un ricarico del 42,9%. Modificabile per figura e per offerta.

**Quote a cascata** sul subtotale: testing 10%, project management 12%, contingenza 10%; garanzia post go-live 5% sulle giornate di messa in opera.

### 5.2 Infrastruttura e terze parti — ricorrente

| Voce | Costo | Ripartizione |
|---|---|---|
| Accantonamento ReeVo (TEST + PROD/PREPROD + VPN) | 107.839,56 €/anno | ÷ (N + 1) |
| Licenza n8n e OCR | 10.416 €/anno | ÷ (N + 1) |
| Presidio AMS | 20.000 €/anno | ÷ (N + 1) |
| Supporto interno ALTEN | 3.000 €/anno | ÷ (N + 1) |
| Servizi professionali ReeVo | 8.500 € una tantum | ÷ (N + 1), nel setup |

N = clienti **già** attivi, senza contare l'offerta in corso.

### 5.3 Provider AI — variabile

0,10 € per documento × documenti per pratica × volume. Nel SaaS l'OCR è dentro il canone n8n e OCR, trattato come fisso.

## 6. Matrice SaaS / on-premise

| Elemento | SaaS | On-premise |
|---|---|---|
| Base comune e customizzazioni | identica | identica |
| Setup | tre ambienti sul nostro cloud | adeguamento al target CI/CD del cliente + passaggio di consegne |
| OpEx infrastruttura | a nostro carico, nella licenza | a carico del cliente, senza importo in offerta |
| Provider AI | nel canone | tre modalità: chiavi del cliente · proxy · a nostro carico |
| Manutenzione | centralizzata | opzionale, default 1 FTE di sviluppatore |
| Ricavo ricorrente | canone + consumo a scaglioni | software + manutenzione + AI rifatturata; consumo solo se contrattualizzato |

Target CI/CD: OpenShift 150 gg, Kubernetes 120, VM 180, AWS/GCP/Azure 130 (da verificare), passaggio di consegne 30.

## 6-bis. Moduli DOB e configurazione light

Il catalogo segue le presentazioni commerciali (Digital Onboarding follow up, slide 4–7; Architettura di sistema, slide 6 e 8): **12 moduli**, con gli stessi nomi.

- **Nativi, sempre inclusi:** 01 Core Onboarding Digitale, 02 Designer dei Workflow, 03 Costruttore di Form, 09 Operatività di Back Office, 10 RBAC e Gestione Utenti.
- **Attivabili con la configurazione light:** 04 OCR ed Elaborazione Documentale (comprende i documenti d'identità; opzione "Gestione documentazione custom": 5 gg + 3 gg per classe), 05 Firma Digitale, 06 Suite KYC, 07 Screening AML, 08 Rischio di Credito, 11 SSO e Autenticazione, 12 Integrazioni e Connettori.

L'impianto si quota in proporzione alla somma dei **pesi** dei moduli inclusi (somma 100, nativi 50: con la configurazione minima si paga metà impianto). I pesi sono una proposta da validare.

I **provider** sono connettori legati ai moduli: Firma (YouSign, Namirial, InfoCert), KYC (Onfido, Jumio, Veriff, Cerved), AML (Cleverchain, CRIF, ComplyAdvantage), Rischio di Credito (CRIF, Cerved, Cleverchain, VIES), Integrazioni e Connettori (archivio documentale InfoCert e Aruba, webhook). Un provider condiviso da più moduli resta disponibile finché almeno uno è incluso. SMTP Gateway e Internal API Gateway sono connettori specifici, non legati a moduli attivabili. Le giornate dei nuovi provider sono stimate per analogia.

SPID / wallet, design system custom e observability del cliente sono **integrazioni di catalogo**, non moduli.

I moduli inclusi compaiono nel Resoconto come promemoria e nello specchietto cliente.

## 6-quater. Grafico dell'architettura

In Soluzione e nello specchietto cliente c'è il grafico della slide 3 del follow up: servizi di terzi, piattaforma (quattro pilastri, customer journey, i 12 moduli, modalità di deployment), sistemi cliente. Ogni casella è **non inclusa**, **inclusa** o **da sviluppare** (ha customizzazioni o integrazioni, con le giornate nel tooltip). Ogni sistema da integrare ha un **tipo** (sistemi core, CRM, DMS / ECM, Analytics / BI, altri) che accende la casella corrispondente. Passando su una casella si evidenziano le righe collegate nelle tabelle di Soluzione, e viceversa. Lo specchietto mostra solo incluso / non incluso: niente giornate, niente nomi di fornitori. Lo stato delle caselle si calcola in `lib/engine/architettura.ts`.

## 6-ter. Cascata Assessment → Soluzione → Stima

Specifica completa: `DOB/Cascata di valutazione - specifica.md` (progetto).

- Ogni **sistema da integrare** ha una complessità (bassa 5, media 10, alta 20 gg dev, in Parametri) e genera da solo un'integrazione dedicata nella customizzazione.
- In Soluzione, la card **Copertura dei sistemi** permette di coprire un sistema con un connettore di catalogo: niente integrazione dedicata, il connettore si conta una volta. Se il connettore è bloccato da un modulo spento, torna l'integrazione dedicata.
- La voce base "Integrazioni con i sistemi" (48 gg) diventa **"Impostazione delle integrazioni"** (16 gg): il resto è ora per sistema.
- In Stima la customizzazione è raggruppata (integrazioni con i sistemi · catalogo · moduli DOB · aggiunte in stima) e ogni riga mostra l'origine. Le aggiunte manuali in Stima vivono in `stima.extra`.
- Le tre voci per il cliente non cambiano: tutto resta dentro Customizzazione.
- Moduli, sistemi, connettori e integrazioni usano lo stesso componente tabella (come Vincoli).

## 7. Le tre voci per il cliente

| Voce | Natura | Si compone di |
|---|---|---|
| **Setup e impianto** | una tantum | base applicativa (impianto della piattaforma, ridotto in configurazione light) + messa in opera nello scenario + quote a cascata e garanzia + quota servizi ReeVo (SaaS) |
| **Customizzazione** | una tantum | solo connettori, integrazioni e voci custom scelti, più le voci aggiunte dai moduli, con le quote a cascata. Identica nei due scenari; zero se non ci sono customizzazioni |
| **Licenza annuale** | ricorrente | SaaS: canone + consumo. On-premise: software + manutenzione + AI rifatturata (+ consumo) |

## 8. Output

**Dettaglio interno** — riservato ALTEN, non esce mai.

**Specchietto cliente** — tre righe, totale del primo anno, righe dai vincoli. Nessuna giornata, nessun margine, nessun fornitore terzo. Si genera dal dettaglio (`specchietto()` in `lib/engine/stati.ts`), esiste solo per offerte approvate.

## 9. Monitoraggio

- **Offerte** — elenco con stato, approccio, primo anno per scenario, quota di valori definiti; apertura, duplicazione.
- **Business plan** — investimento da recuperare (174.209 € sviluppo + 20.000 € AM primo anno), contributo per progetto, pareggio.
- **Parametri di sistema** — costi delle figure, margine di default, costi condivisi, clienti attivi, catalogo, AI. Ogni salvataggio crea una nuova versione.

## 11. Validazione

Componente `Validation` del design system: **errore** blocca il salvataggio e resta; **avviso** non blocca, toast 6 s; **conferma** toast 3 s. Campo evidenziato con messaggio sotto (`aria-invalid`, `aria-describedby`).

## 12. Non-obiettivi e anti-obiettivo

Non è un CRM; non quantifica la spesa del cliente on-premise; non sostituisce il controllo di gestione.

**Anti-obiettivo.** Uno specchietto cliente che contenga, anche per errore, un margine, un costo interno o una condizione ReeVo. Le condizioni ReeVo sono **C2-Restricted** e non trasferibili come base d'offerta verso un altro cliente.

## 13. Vincoli di progetto

| Vincolo | Compilazione | Specchietto |
|---|---|---|
| Dati in UE | AI solo con provider in region UE | — |
| Adeguamento normativo | riserva 2.200 €/anno nei ricorrenti | "aggiornamenti normativi inclusi" |
| Penali su KPI | riserva del 5% della licenza | — |
| Supporto on demand | 55 gg una tantum | riga "Supporto on demand" |
| SSO federato | sblocca l'integrazione SSO, 10 gg | dentro la customizzazione |
| Audit annuale di sicurezza | voce ricorrente | riga "Audit annuale" |

Senza on-premise nell'approccio, CI/CD, AI on-premise e manutenzione restano bloccati.

## 14. Decisioni

| Punto | Decisione |
|---|---|
| Canone SaaS | libero, con **soglia minima** = costi ricorrenti di base ÷ 0,70. Sotto: avviso, non blocco. Oggi 40.358,73 € |
| Manutenzione on-premise | opzionale, default 220 gg di sviluppatore |
| Licenza on-premise | software (default 40.000 €) + manutenzione + AI rifatturata |
| AI on-premise | inclusa (costo nostro, pavimento) · proxy (rifatturata col margine) · chiavi del cliente (costo zero) |
| Garanzia | 5% sulle giornate di messa in opera |

## 15. Punti aperti

1. **Chi approva.** Oggi qualunque utente ALTEN può approvare: va definito il ruolo.
2. **Recupero dell'investimento.** Le date della curva vanno validate col controllo di gestione.
3. **Audit annuale.** L'importo di default (6.000 €/anno) è un segnaposto da dichiarare.
