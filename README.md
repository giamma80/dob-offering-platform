# DOB Offering Platform

Strumento interno ALTEN per costruire e governare le offerte della piattaforma Digital Onboarding: dettaglio interno con costi, margini e assunzioni; specchietto cliente con tre voci; business plan e parametri di sistema.

**Riservato ALTEN.** Contiene costi interni e condizioni di fornitura classificate C2-Restricted.

- Specifica: [`docs/design-v2.md`](docs/design-v2.md)
- Mockup approvato: [`docs/mockup/`](docs/mockup/)
- Istruzioni di sviluppo: [`CLAUDE.md`](CLAUDE.md)
- Cosa manca: [`docs/backlog.md`](docs/backlog.md)

## Avvio locale

```
cp .env.example .env.local   # inserire la publishable key del progetto Supabase
npm install
npm run dev
```

## Architettura

| Livello | Dove |
|---|---|
| Motore di calcolo (puro, testato) | `lib/engine/` |
| Accesso ai dati e server action | `lib/dati.ts`, `lib/azioni.ts` |
| Autenticazione (link via email, solo @alten.it) | `middleware.ts`, `app/login/`, `app/auth/callback/` |
| Interfaccia | `app/(app)/`, `components/` |
| Testi IT/EN | `lib/i18n/` |
| Design system | `design-system/`, `app/styles/` |
| Database | `supabase/migrations/`, `supabase/seed/` |
