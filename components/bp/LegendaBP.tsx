export type VoceLegenda =
  | { tipo: 'box'; nome: string; colore: string; opacita?: number; tip?: string }
  | { tipo: 'linea'; nome: string; colore: string; tip?: string }
  | { tipo: 'tratto'; nome: string; colore: string; tratteggio?: string; tip?: string }
  | { tipo: 'titolo'; nome: string };

/** Legenda di tutti gli elementi di un grafico: riquadro per le aree e le barre, linea piena per le serie, tratteggio per i marcatori verticali. */
export function LegendaBP({ voci }: { voci: VoceLegenda[] }) {
  return (
    <div className="legenda">
      {voci.map((v) => v.tipo === 'titolo'
        ? <span key={v.nome} style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 10.5 }}>{v.nome}</span>
        : (
          <span key={v.nome} title={v.tip}>
            {v.tipo === 'box' && <i style={{ background: v.colore, opacity: v.opacita ?? 1, border: '1px solid var(--line-soft)' }} />}
            {v.tipo === 'linea' && <i style={{ height: 0, borderTop: `3px solid ${v.colore}`, borderRadius: 2, width: 16 }} />}
            {v.tipo === 'tratto' && <i style={{ height: 0, borderTop: `3px ${v.tratteggio ?? 'dashed'} ${v.colore}`, width: 16 }} />}
            {v.nome}
          </span>
        ))}
    </div>
  );
}
