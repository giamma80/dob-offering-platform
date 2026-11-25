/* Unico indirizzo che entra nella Configurazione (costi e parametri di sistema).
   Lo stesso indirizzo è scritto in public.is_admin() per le policy RLS. */
export const EMAIL_ADMIN = 'gianmarco.morelli@alten.it';

export function isAdmin(email: string | null | undefined) {
  return !!email && email.toLowerCase() === EMAIL_ADMIN;
}
