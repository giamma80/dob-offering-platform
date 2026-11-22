'use client';

import { useCallback, useEffect, useState } from 'react';

/* Validation del design system: errore resta finché non si corregge, avviso 6 s, conferma 3 s. */
export type ToastDati = { tipo: 'errore' | 'avviso' | 'conferma'; testo: string };

export function useToast() {
  const [toast, setToast] = useState<ToastDati | null>(null);
  useEffect(() => {
    if (!toast || toast.tipo === 'errore') return;
    const t = setTimeout(() => setToast(null), toast.tipo === 'avviso' ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const mostra = useCallback((t: ToastDati | null) => setToast(t), []);
  return { toast, mostra };
}

export function Toast({ toast }: { toast: ToastDati | null }) {
  if (!toast) return null;
  return (
    <div className={`toast${toast.tipo !== 'conferma' ? ` toast--${toast.tipo}` : ''}`}
      role={toast.tipo === 'errore' ? 'alert' : 'status'}>{toast.testo}</div>
  );
}
