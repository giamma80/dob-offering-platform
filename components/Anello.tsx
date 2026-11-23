/** Anello di avanzamento: quota di valori non più assunti. */
export function Anello({ pct, size = 18, corrente = false }: { pct: number; size?: number; corrente?: boolean }) {
  const r = 7, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const col = corrente ? 'var(--accent-azure)' : pct >= 100 ? 'var(--signal-positive)' : 'var(--accent-azure)';
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <circle cx="9" cy="9" r={r} fill="none" stroke="var(--line-soft)" strokeWidth="3" />
      <circle cx="9" cy="9" r={r} fill="none" stroke={col} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 9 9)" />
    </svg>
  );
}
