/* Un colore per progetto, assegnato per posizione nell'elenco completo: selezionare o togliere un progetto non lo ricolora. */
const PALETTE = [
  'var(--accent-azure)', 'var(--surface-brand)', 'var(--signal-positive)', 'var(--signal-open)',
  'var(--accent-azure-mid)', '#7a5bb5', '#c0572b', '#4a8f3c'
];
export const coloreProgetto = (indice: number) => PALETTE[indice % PALETTE.length];
