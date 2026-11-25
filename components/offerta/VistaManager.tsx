'use client';

import { useMemo, useState } from 'react';
import { conPrezzi, intervalloPrezzo, type SezioneManager, type SpecchiettoManager } from '@/lib/engine';
import { euro, perc } from '@/lib/ui/formato';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { Icona } from '@/components/Icona';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';

const segno = (v: number) => (v < -0.004 ? 'var(--signal-negative)' : 'var(--ink-primary)');
const VOCE_SETUP: Record<string, Chiave> = {
  base: 'sp.sv.base', integrazioni: 'sp.sv.integrazioni', catalogo: 'sp.sv.catalogo', moduli: 'sp.sv.moduli',
  stima: 'sp.sv.stima', parametriche: 'sp.sv.parametriche', infra: 'st.infra'
};
const VOCE_CANONE: Record<string, Chiave> = {
  software: 'sp.sv.software', consumo: 'sp.sv.consumo', manutenzione: 'sp.sv.manutenzione', ai: 'sp.sv.ai'
};

/* Specchietto manager: setup e canone con costi, prezzo e margine; una barra per sezione sposta il prezzo
   e il margine si ricalcola. Nulla si salva e non c'è esportazione. */
export function VistaManager({ iniziale }: { iniziale: SpecchiettoManager }) {
  const t = useT();
  const [setup, setSetup] = useState(iniziale.setup.listino);
  const [canone, setCanone] = useState(iniziale.canone.listino);
  const m = useMemo(() => conPrezzi(iniziale, { setup, canone }), [iniziale, setup, canone]);

  const sezione = (id: 'setup' | 'canone', s: SezioneManager, imposta: (v: number) => void) => {
    const iv = intervalloPrezzo(s);
    const titolo = id === 'setup' ? t('sm.setup') : t('re.licenza');
    const spostato = Math.abs(s.prezzo - s.listino) > 0.004;
    const celle = [
      { k: 'sm.prezzo' as Chiave, v: euro(s.prezzo), c: undefined },
      { k: 'sm.costo' as Chiave, v: euro(s.costo), c: undefined },
      { k: 're.margine' as Chiave, v: euro(s.margine), c: segno(s.margine) },
      { k: 'sm.marginePct' as Chiave, v: perc(s.marginePct), c: segno(s.margine) }
    ];
    return (
      <div className="alt-card" key={id}>
        <div className="alt-card__head"><h2 className="alt-card__title">{titolo}</h2></div>
        <div className="alt-card__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            {celle.map((x) => (
              <div key={x.k} style={{ border: '1px solid var(--line-soft)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{t(x.k)}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: x.c }}>{x.v}{id === 'canone' && x.k === 'sm.prezzo' && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>&nbsp;{t('sp.anno')}</span>}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }} title={t('sm.barraTip')}>
            <input className="alt-range" type="range" min={iv.min} max={iv.max} step={iv.passo} value={Math.min(s.prezzo, iv.max)}
              aria-label={`${titolo}: ${t('sm.prezzo')}`} onChange={(e) => imposta(Number(e.target.value))} />
            <button type="button" className="alt-btn alt-btn--ghost" disabled={!spostato} onClick={() => imposta(s.listino)}
              title={t('sm.listino')} aria-label={t('sm.listino')}><Icona nome="ripristina" /></button>
          </div>
          {id === 'setup' ? (
            <TabellaOrdinabile
              colonne={[{ nome: t('sm.voce') }, { nome: t('sm.costo'), num: true }, { nome: t('sm.prezzo'), num: true }, { nome: t('re.margine'), num: true }]}
              righe={s.costi.map((c) => {
                const p = s.prezzi.find((x) => x.id === c.id)?.prezzo ?? 0;
                return { key: c.id, celle: [{ v: t(VOCE_SETUP[c.id]) }, { v: c.costo, html: euro(c.costo) }, { v: p, html: euro(p) },
                  { v: p - c.costo, html: <span style={{ color: segno(p - c.costo) }}>{euro(p - c.costo)}</span> }] };
              })}
              totale={[{ v: t('sm.totale') }, { v: s.costo, html: euro(s.costo) }, { v: s.prezzo, html: euro(s.prezzo) },
                { v: s.margine, html: <span style={{ color: segno(s.margine) }}>{euro(s.margine)}</span> }]} />
          ) : (
            <>
              <TabellaOrdinabile
                colonne={[{ nome: t('sm.prezzo') }, { nome: `€ ${t('sp.anno')}`, num: true }]}
                righe={s.prezzi.map((p) => ({ key: p.id, celle: [{ v: t(VOCE_CANONE[p.id]) }, { v: p.prezzo, html: euro(p.prezzo) }] }))}
                totale={[{ v: t('sm.totale') }, { v: s.prezzo, html: euro(s.prezzo) }]} />
              <div style={{ height: 16 }} />
              <TabellaOrdinabile
                colonne={[{ nome: t('sm.costo') }, { nome: `€ ${t('sp.anno')}`, num: true }]}
                righe={s.costi.map((c) => ({ key: c.id, celle: [{ v: c.nome ?? c.id }, { v: c.costo, html: euro(c.costo) }] }))}
                totale={[{ v: t('sm.totale') }, { v: s.costo, html: euro(s.costo) }]} />
            </>
          )}
        </div>
      </div>
    );
  };

  const p = m.primoAnno;
  return (
    <>
      <main className="content">
        {sezione('setup', m.setup, setSetup)}
        {sezione('canone', m.canone, setCanone)}
      </main>
      <aside className="rail" aria-label={t('re.primoAnno')}>
        <div className="rail__card rail__card--brand"><p className="rail__h">{t('re.primoAnno')}</p>
          <div className="rail__stat"><span>{t('sm.prezzo')}</span><b>{euro(p.prezzo)}</b></div>
          <div className="rail__stat"><span>{t('sm.costo')}</span><b>{euro(p.costo)}</b></div>
          <div className="rail__stat"><span>{t('re.margine')}</span><b>{euro(p.margine)}</b></div>
          <div className="rail__stat"><span>{t('sm.marginePct')}</span><b>{perc(p.marginePct)}</b></div>
        </div>
      </aside>
    </>
  );
}
