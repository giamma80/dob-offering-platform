/** Ponte fra l'editor dell'offerta e la navigazione: chi cambia pagina aspetta che le modifiche siano scritte. */
let svuota: (() => Promise<void>) | null = null;

export function registraSalvataggio(f: (() => Promise<void>) | null) { svuota = f; }

export async function attendiSalvataggio() { if (svuota) await svuota(); }
