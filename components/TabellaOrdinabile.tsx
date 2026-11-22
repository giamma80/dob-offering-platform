'use client';

import { useMemo, useState } from 'react';

export interface Colonna { nome: string; num?: boolean }
export interface Cella { v: string | number; html?: React.ReactNode }

const Icona = () => (
  <svg className="th-ico" width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
    <path d="M5 1l3 4H2zM5 11L2 7h6z" fill="currentColor" />
  </svg>
);

/** Data table del design system: ogni colonna ordinabile, numeri allineati a destra con l'intestazione. */
export function TabellaOrdinabile({ colonne, righe, totale }: {
  colonne: Colonna[];
  righe: { key: string; celle: Cella[]; className?: string }[];
  totale?: Cella[];
}) {
  const [ord, setOrd] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const viste = useMemo(() => {
    if (!ord) return righe;
    return [...righe].sort((a, b) => {
      const x = a.celle[ord.i]?.v, y = b.celle[ord.i]?.v;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'it')) * ord.dir;
    });
  }, [righe, ord]);
  return (
    <table className="alt-table alt-sortable">
      <thead>
        <tr>
          {colonne.map((c, i) => (
            <th key={i} className={c.num ? 'is-num' : undefined}
              aria-sort={ord?.i === i ? (ord.dir === 1 ? 'ascending' : 'descending') : 'none'}>
              {c.nome ? (
                <button type="button" className="th-sort"
                  onClick={() => setOrd((o) => ({ i, dir: o?.i === i && o.dir === 1 ? -1 : 1 }))}>
                  {c.nome}<Icona />
                </button>
              ) : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {viste.map((r) => (
          <tr key={r.key} className={r.className}>
            {r.celle.map((c, i) => <td key={i} className={colonne[i]?.num ? 'is-num' : undefined}>{c.html ?? c.v}</td>)}
          </tr>
        ))}
      </tbody>
      {totale && (
        <tfoot>
          <tr className="is-total">
            {totale.map((c, i) => <td key={i} className={colonne[i]?.num ? 'is-num' : undefined}>{c.html ?? c.v}</td>)}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
