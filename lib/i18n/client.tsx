'use client';

import { createContext, useContext, useMemo } from 'react';
import { traduttore, type Lingua, type T } from './dizionari';

const Ctx = createContext<{ lingua: Lingua; t: T }>({ lingua: 'it', t: traduttore('it') });

export function LinguaProvider({ lingua, children }: { lingua: Lingua; children: React.ReactNode }) {
  const v = useMemo(() => ({ lingua, t: traduttore(lingua) }), [lingua]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx).t;
export const useLingua = () => useContext(Ctx).lingua;
