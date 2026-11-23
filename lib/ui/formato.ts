/* Importi in euro sempre con due decimali; percentuali con una. */
const eur = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const int = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' });
const pct = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const euro = (v: number) => `${eur.format(v)} €`;
export const numero = (v: number) => int.format(v);
export const perc = (v: number) => `${pct.format(v * 100)}%`;
