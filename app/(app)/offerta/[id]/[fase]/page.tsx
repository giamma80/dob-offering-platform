import { notFound } from 'next/navigation';
import { configOfferta, offerta } from '@/lib/dati';
import { FASI, type Fase } from '@/lib/engine';
import { Testata } from '@/components/Testata';
import { t as traduci } from '@/lib/i18n/server';
import { EditorOfferta } from '@/components/offerta/EditorOfferta';
import { AzioniOfferta } from '@/components/offerta/AzioniOfferta';
import type { Chiave } from '@/lib/i18n/dizionari';

export default async function PaginaFase({ params }: { params: Promise<{ id: string; fase: string }> }) {
  const { id, fase } = await params;
  if (!FASI.some((f) => f.id === fase)) notFound();
  const o = await offerta(id);
  if (!o) notFound();
  const [{ dati: cfg, versione, ultima, congelata }, t] = await Promise.all([configOfferta(o), traduci()]);
  return (
    <div className="alt-root">
      <Testata area="offerta" hrefOfferta={`/offerta/${id}/assessment`}
        contesto={<>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{o.cliente}</span>
          <span className={`alt-badge alt-badge--${o.stato === 'approvata' ? 'chiuso' : 'aperto'}`} style={{ marginLeft: 8 }}>
            {t(`stato.${o.stato}` as Chiave)}
          </span>
        </>}
        azioni={<AzioniOfferta id={id} stato={o.stato} />} />
      <EditorOfferta id={id} fase={fase as Fase} cfg={cfg} iniziale={o.dati}
        solaLettura={o.stato === 'approvata'} versione={{ numero: versione, ultima, congelata }} />
    </div>
  );
}
