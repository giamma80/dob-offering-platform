'use client';

import { scorriA } from '@/lib/ui/scorri';

import { useMemo, useState } from 'react';
import { contributoAl, costoPiattaformaAl, curvaRecupero, pareggio, type Progetto, type VocePiattaforma } from '@/lib/engine';
import { useT } from '@/lib/i18n/client';
import { euro } from '@/lib/ui/formato';
import { CurvaRecupero } from '@/components/grafici';
import { Icona } from '@/components/Icona';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { MenuUtente } from '@/components/utente/MenuUtente';

export type ProgettoBP = Omit<Progetto, 'inizio'> & { inizio: string };

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function VistaBusinessPlan({ investimento, progetti, piattaforma }: {
  investimento: { sviluppo: number; amPrimoAnno: number }; progetti: ProgettoBP[];
  piattaforma: { dal: string; mese: number; unaTantum: number; voci?: (Omit<VocePiattaforma, 'dal'> & { dal: string })[] };
}) {
  const t = useT();
  const [conInCorso, setConInCorso] = useState(true);
  const [sez, setSez] = useState('bp-curva');
  const tutti = useMemo(() => progetti.map((p) => ({ ...p, inizio: new Date(p.inizio) })), [progetti]);
  const inv = investimento.sviluppo + investimento.amPrimoAnno;
  const pf = useMemo(() => ({
    ...piattaforma, dal: new Date(piattaforma.dal),
    voci: piattaforma.voci?.map((v) => ({ ...v, dal: new Date(v.dal) }))
  }), [piattaforma]);
  const da = useMemo(() => {
    const min = tutti.reduce((a, p) => (p.inizio < a ? p.inizio : a), pf.dal < new Date() ? pf.dal : new Date());
    return new Date(Date.UTC(min.getUTCFullYear(), 0, 1));
  }, [tutti, pf]);
  const curva = (con: boolean) => curvaRecupero(inv, tutti.filter((p) => con || !p.inCorso), da, 12, pf);
  const punti = curva(conInCorso);
  const parCon = pareggio(curva(true)), parSenza = pareggio(curva(false));
  const fineOrizzonte = new Date(Date.UTC(da.getUTCFullYear() + 3, 0, 1));
  const anni = [0, 1, 2, 3].map((i) => da.getUTCFullYear() + i);
  const span = fineOrizzonte.getTime() - da.getTime();
  const nomeMese = (d: Date) => `${(t('comune.lingua') === 'Language' ? MONTHS : MESI)[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const contributi = tutti.map((p) => {
    const mesi = Math.max(0, Math.min(p.durataMesi, (fineOrizzonte.getUTCFullYear() * 12 + fineOrizzonte.getUTCMonth()) - (p.inizio.getUTCFullYear() * 12 + p.inizio.getUTCMonth())));
    return { ...p, mesi, contributo: contributoAl(p, new Date(fineOrizzonte.getTime() - 1)) };
  });
  const finePeriodo = new Date(fineOrizzonte.getTime() - 1);
  const costoPf = costoPiattaformaAl(pf, finePeriodo);
  const mesiPf = Math.max(0, (finePeriodo.getUTCFullYear() * 12 + finePeriodo.getUTCMonth()) - (pf.dal.getUTCFullYear() * 12 + pf.dal.getUTCMonth()) + 1);
  const oggi = new Date();
  const SEZ = [
    { id: 'bp-curva', k: 'bp.abbattimento' as const, ico: 'bp', badge: (conInCorso ? parCon : parSenza) ?? '—' },
    { id: 'bp-tl', k: 'bp.timeline' as const, ico: 'offerte', badge: String(tutti.length) },
    { id: 'bp-con', k: 'bp.contributi' as const, ico: 'costi', badge: '' }
  ];

  return (
    <div className="shell">
      <aside className="subnav" aria-label={t('mon.bp')}>
        <p className="subnav__title">{t('mon.bp')}</p>
        {SEZ.map((s) => (
          <a key={s.id} className="subnav__a" href={`#${s.id}`} aria-current={sez === s.id ? 'true' : undefined}
            onClick={(e) => { e.preventDefault(); setSez(s.id); scorriA(s.id); }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome={s.ico} />{t(s.k)}</span><small>{s.badge}</small>
          </a>
        ))}
        <MenuUtente />
      </aside>
      <main className="content">
        <h1 className="ttl">{t('mon.bp')}</h1>
        <div className="alt-confid"><span className="alt-badge alt-badge--riservato">{t('re.riservato')}</span></div>

        <div className="alt-card" id="bp-curva">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome="bp" />{t('bp.curvaTit')}</h2>
            <span className="seg" role="radiogroup" aria-label={t('bp.inCorso')} style={{ marginLeft: 'auto' }}>
              {[true, false].map((v) => (
                <b key={String(v)} role="radio" tabIndex={0} aria-checked={conInCorso === v} className={conInCorso === v ? 'on' : undefined}
                  onClick={() => setConInCorso(v)} onKeyDown={(e) => e.key === 'Enter' && setConInCorso(v)}>{t(v ? 'bp.conInCorso' : 'bp.senzaInCorso')}</b>
              ))}
            </span>
          </div>
          <div className="alt-card__body">
            <CurvaRecupero punti={punti} pareggio={pareggio(punti)} etichetta={t('bp.curvaTit')} />
          </div>
        </div>

        <div className="alt-card" id="bp-tl">
          <div className="alt-card__head"><h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome="offerte" />{t('bp.timeline')}</h2></div>
          <div className="alt-card__body">
            <div className="tlp">
              {contributi.map((p) => {
                const left = Math.max(0, (p.inizio.getTime() - da.getTime()) / span);
                const fine = new Date(Date.UTC(p.inizio.getUTCFullYear(), p.inizio.getUTCMonth() + p.durataMesi - 1, 1));
                const w = Math.max(0.04, Math.min(1 - left, (fine.getTime() - p.inizio.getTime()) / span));
                return (
                  <div key={p.id} className="tlp__r">
                    <span className={`tlp__n${p.inCorso ? ' in-corso' : ''}`}>{p.cliente}</span>
                    <span className="tlp__t">
                      <span className={`tlp__b${p.inCorso ? ' in-corso' : ''}`} style={{ left: `${left * 100}%`, width: `${w * 100}%` }}
                        title={`${nomeMese(p.inizio)} → ${nomeMese(fine)} · ${euro(p.licenzaAnnua)}${t('sp.anno')}`}>
                        {nomeMese(p.inizio)} → {nomeMese(fine)} · {euro(p.licenzaAnnua)}{t('sp.anno')}
                      </span>
                    </span>
                  </div>
                );
              })}
              <div className="tlp__r"><span className="tlp__n" /><span className="tlp__assi">{anni.map((a) => <span key={a}>{a}</span>)}</span></div>
            </div>
          </div>
        </div>

        <div className="alt-card" id="bp-con">
          <div className="alt-card__head"><h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome="costi" />{t('bp.contributo')}</h2></div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('bp.progetto') }, { nome: t('bp.margineAnnuo'), num: true }, { nome: t('bp.mesi'), num: true }, { nome: t('bp.contributoCol'), num: true }]}
              righe={[
                ...contributi.map((p) => {
                  const lordo = p.margineAnnuo + (p.quotaPiattaformaAnnua ?? 0);
                  return {
                    key: p.id, className: p.inCorso ? 'is-sub' : undefined,
                    celle: [{ v: p.cliente, html: p.inCorso ? `${p.cliente} · ${t('bp.inCorsoBreve')}` : p.cliente },
                      { v: lordo, html: <span title={t('bp.lordoTip', { q: euro(p.quotaPiattaformaAnnua ?? 0) })}>{euro(lordo)}</span> },
                      { v: p.mesi }, { v: p.contributo, html: euro(p.contributo) }]
                  };
                }),
                { key: 'piattaforma', className: 'is-neg',
                  celle: [{ v: t('bp.costiPiattaforma'), html: <span title={t('bp.costiPiattaformaTip', { d: nomeMese(pf.dal) })}>{t('bp.costiPiattaforma')}</span> },
                    { v: -pf.mese * 12, html: euro(-pf.mese * 12) }, { v: mesiPf }, { v: -costoPf, html: euro(-costoPf) }] }
              ]}
              totale={[{ v: t('bp.cumulatoA', { a: fineOrizzonte.getUTCFullYear() - 1 }) }, { v: '' }, { v: '' },
                { v: 0, html: euro(contributi.filter((p) => conInCorso || !p.inCorso).reduce((a, p) => a + p.contributo, 0) - costoPf) }]}
            />
          </div>
        </div>
      </main>
      <aside className="rail" aria-label={t('bp.inv')}>
        <div className="rail__card rail__card--brand"><p className="rail__h">{t('bp.inv')}</p>
          <div className="rail__stat"><span>{t('bp.sviluppo')}</span><b>{euro(investimento.sviluppo)}</b></div>
          <div className="rail__stat"><span>{t('bp.amPrimo')}</span><b>{euro(investimento.amPrimoAnno)}</b></div>
          <div className="rail__stat"><span>{t('bp.daRecuperare')}</span><b>{euro(inv)}</b></div>
        </div>
        <div className="rail__card"><p className="rail__h">{t('bp.costiPiattaforma')}</p>
          <div className="rail__stat"><span>{t('bp.attivaDal')}</span><b>{nomeMese(pf.dal)}</b></div>
          <div className="rail__stat"><span>{t('bp.alMese')}</span><b>{euro(pf.mese)}</b></div>
          <div className="rail__stat"><span>{t('bp.finoAOggi')}</span><b>{euro(costoPiattaformaAl(pf, oggi))}</b></div>
        </div>
        <div className="rail__card"><p className="rail__h">{t('bp.pareggio')}</p>
          <div className="rail__stat"><span>{t('bp.conInCorso')}</span><b>{parCon ?? t('bp.nonRaggiunto')}</b></div>
          <div className="rail__stat"><span>{t('bp.senzaInCorso')}</span><b>{parSenza ?? t('bp.nonRaggiunto')}</b></div>
        </div>
      </aside>
    </div>
  );
}
