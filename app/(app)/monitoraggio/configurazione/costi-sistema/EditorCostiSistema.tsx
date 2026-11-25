'use client';

import { useState, useTransition } from 'react';
import { salvaConfig } from '@/lib/azioni';
import { CONFIG_DEFAULT, costiPiattaforma, costiSistema, sviluppoTotale, type Config } from '@/lib/engine';
import { euro, numero } from '@/lib/ui/formato';
import { CampoNumero } from '@/components/CampoNumero';
import { Icona } from '@/components/Icona';
import { TabellaOrdinabile } from '@/components/TabellaOrdinabile';
import { Toast, useToast } from '@/components/Toast';
import { useT } from '@/lib/i18n/client';
import { NavConfigurazione } from '@/components/NavConfigurazione';
import { MenuUtente } from '@/components/utente/MenuUtente';

const MESE = /^\d{4}-(0[1-9]|1[0-2])$/;

/* Costi di sistema: registro dello sviluppo (cresce) e mese di partenza di ReeVo e n8n.
   Si salva come nuova versione dei parametri; gli importi mensili restano in Parametri di sistema. */
export function EditorCostiSistema({ versione, iniziale }: { versione: number; iniziale: Config }) {
  const t = useT();
  const [c, setC] = useState<Config>(() => ({
    ...iniziale,
    costiSistema: costiSistema(iniziale),
    consumo: iniziale.consumo ?? { ...CONFIG_DEFAULT.consumo!, modello: 'listino' },
    capacita: iniziale.capacita ?? { ...CONFIG_DEFAULT.capacita! }
  }));
  const [base, setBase] = useState(versione);
  const [pending, start] = useTransition();
  const { toast, mostra } = useToast();
  const cs = c.costiSistema!;
  const cn = c.consumo!;
  const cp = c.capacita!;
  const upd = (f: (x: Config) => void) => setC((p) => { const x = structuredClone(p); f(x); return x; });
  const oggi = new Date().toISOString().slice(0, 7);
  const pf = costiPiattaforma(c);
  const voce = (id: string) => pf.voci?.find((v) => v.id === id)?.mese ?? 0;

  const salva = () => start(async () => {
    if (![cs.reevoDal, cs.n8nDal, ...cs.sviluppo.map((v) => v.mese)].every((m) => MESE.test(m))) { mostra({ tipo: 'errore', testo: t('cs.meseNonValido') }); return; }
    const r = await salvaConfig(c, '', base);
    if ('superata' in r && r.superata) { mostra({ tipo: 'errore', testo: t('par.superata', { v: r.superata }) }); return; }
    if ('errore' in r && r.errore) { mostra({ tipo: 'errore', testo: r.errore }); return; }
    if ('versione' in r && r.versione) setBase(r.versione);
    mostra({ tipo: 'conferma', testo: t('cs.salvata') });
  });

  const campoMese = (valore: string, etichetta: string, set: (v: string) => void) => (
    <span className="alt-inputwrap" style={{ maxWidth: 180 }}>
      <input className="alt-input" type="month" value={valore} aria-label={etichetta}
        onChange={(e) => e.target.value && set(e.target.value)} />
    </span>
  );

  const servizi = [
    { id: 'reevo', k: 'cs.reevo' as const, dal: cs.reevoDal, set: (v: string) => upd((x) => { x.costiSistema!.reevoDal = v; }) },
    { id: 'n8n', k: 'cs.n8n' as const, dal: cs.n8nDal, set: (v: string) => upd((x) => { x.costiSistema!.n8nDal = v; }) },
    { id: 'ams', k: 'cs.ams' as const, dal: c.piattaforma?.attivaDal ?? '2026-07', set: (v: string) => upd((x) => { x.piattaforma = { attivaDal: v }; }) }
  ];

  return (
    <div className="shell">
      <aside className="subnav" aria-label={t('mon.configurazione')}>
        <p className="subnav__title">{t('mon.configurazione')}</p>
        <NavConfigurazione />
        <MenuUtente />
      </aside>
      <main className="content">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <h1 className="ttl">{t('mon.costiSistema')}</h1>
          <div className="azioni" style={{ marginLeft: 'auto' }}>
            <button className="alt-btn alt-btn--primary" type="button" disabled={pending} onClick={salva}>{t('par.salva')}</button>
          </div>
        </div>

        <div className="alt-card" id="cs-sviluppo">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('cs.sviluppoTip')}><Icona nome="costi" />{t('cs.sviluppo')}</h2>
            <button className="alt-btn alt-btn--ghost" type="button" style={{ marginLeft: 'auto' }}
              onClick={() => upd((x) => { x.costiSistema!.sviluppo.push({ id: `sv-${Date.now()}`, mese: oggi, importo: 0, nota: '' }); })}>{t('cs.aggiungi')}</button>
          </div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('cs.mese') }, { nome: t('cs.importo'), num: true }, { nome: t('cs.nota') }, { nome: '' }]}
              righe={cs.sviluppo.map((v, i) => ({
                key: v.id,
                celle: [
                  { v: v.mese, html: campoMese(v.mese, t('cs.mese'), (m) => upd((x) => { x.costiSistema!.sviluppo[i].mese = m; })) },
                  { v: v.importo, html: <CampoNumero compatto etichetta={t('cs.importo')} valore={v.importo} min={0} suffisso="€"
                    onChange={(n) => upd((x) => { x.costiSistema!.sviluppo[i].importo = n; })} /> },
                  { v: v.nota, html: <span className="alt-inputwrap"><input className="alt-input" value={v.nota} aria-label={t('cs.nota')}
                    onChange={(e) => upd((x) => { x.costiSistema!.sviluppo[i].nota = e.target.value; })} /></span> },
                  { v: '', html: <button type="button" className="chip__x" aria-label={t('comune.rimuovi')} title={t('comune.rimuovi')}
                    onClick={() => upd((x) => { x.costiSistema!.sviluppo.splice(i, 1); })}>×</button> }
                ]
              }))}
              totale={[{ v: t('cs.totale') }, { v: 0, html: euro(sviluppoTotale(c)) }, { v: '' }, { v: '' }]}
            />
          </div>
        </div>

        <div className="alt-card" id="cs-servizi">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('cs.serviziTip')}><Icona nome="cloud" />{t('cs.servizi')}</h2>
          </div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('cs.servizio') }, { nome: t('cs.attivoDal') }, { nome: t('cs.costoMese'), num: true }]}
              righe={servizi.map((s) => ({
                key: s.id,
                celle: [{ v: t(s.k) }, { v: s.dal, html: campoMese(s.dal, `${t(s.k)} · ${t('cs.attivoDal')}`, s.set) }, { v: voce(s.id), html: euro(voce(s.id)) }]
              }))}
            />
          </div>
        </div>
        <div className="alt-card" id="cs-consumo">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('cs.consumoTip')}><Icona nome="cloud" />{t('cs.consumo')}</h2>
          </div>
          <div className="alt-card__body" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div title={t('cs.consumoTip')}>
              <label className="alt-label" htmlFor="cs-modello">{t('cs.modello')}</label>
              <select id="cs-modello" className="alt-input" value={cn.modello}
                onChange={(e) => upd((x) => { x.consumo!.modello = e.target.value as 'costo' | 'listino'; })}>
                <option value="costo">{t('cs.modello.costo')}</option>
                <option value="listino">{t('cs.modello.listino')}</option>
              </select>
            </div>
            <div title={t('cs.pratichePerAnnoTip')}>
              <CampoNumero etichetta={t('cs.pratichePerAnno')} valore={cp.pratichePerAnno} min={1}
                onChange={(n) => upd((x) => { x.capacita!.pratichePerAnno = n; })} />
            </div>
            <div title={t('cs.praticheImpegnateTip')}>
              <CampoNumero etichetta={t('cs.praticheImpegnate')} valore={cp.praticheImpegnate} min={0}
                onChange={(n) => upd((x) => { x.capacita!.praticheImpegnate = n; })} />
            </div>
            <div title={t('cs.costoExtraTip')}>
              <CampoNumero etichetta={t('cs.costoExtra')} valore={cn.costoExtraPratica} min={0} suffisso="€"
                onChange={(n) => upd((x) => { x.consumo!.costoExtraPratica = n; })} />
            </div>
            <div>
              <CampoNumero etichetta={t('cs.margineMinimo')} valore={Math.round(cn.margineMinimo * 1000) / 10} min={0} max={99} suffisso="%"
                onChange={(n) => upd((x) => { x.consumo!.margineMinimo = n / 100; })} />
            </div>
          </div>
        </div>
        <div className="alt-card" id="cs-scaglioni">
          <div className="alt-card__head">
            <h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }} title={t('cs.scaglioniTip')}><Icona nome="scaglioni" />{t('pr.scaglioni')}</h2>
          </div>
          <div className="alt-card__body">
            <TabellaOrdinabile
              colonne={[{ nome: t('pr.da'), num: true }, { nome: t('pr.a'), num: true }, { nome: t('pr.sconto'), num: true }, { nome: t('pr.euroTx'), num: true }]}
              righe={c.scaglioni.map((f, i) => ({
                key: String(i),
                celle: [
                  { v: f.da, html: numero(f.da) },
                  { v: f.a ?? Number.MAX_SAFE_INTEGER, html: f.a === null ? '∞' : <CampoNumero compatto etichetta={`${t('pr.a')} ${i + 1}`} valore={f.a} min={f.da}
                    onChange={(n) => upd((x) => { x.scaglioni[i].a = n; if (x.scaglioni[i + 1]) x.scaglioni[i + 1].da = n + 1; })} /> },
                  { v: f.sconto ?? 0, html: <CampoNumero compatto etichetta={`${t('pr.sconto')} ${i + 1}`} valore={Math.round((f.sconto ?? 0) * 1000) / 10} min={0} max={99} suffisso="%"
                    onChange={(n) => upd((x) => { x.scaglioni[i].sconto = n / 100; })} /> },
                  { v: f.prezzo, html: <CampoNumero compatto etichetta={`${t('pr.euroTx')} ${i + 1}`} valore={f.prezzo} min={0} suffisso="€"
                    onChange={(n) => upd((x) => { x.scaglioni[i].prezzo = n; })} /> }
                ]
              }))}
            />
          </div>
        </div>
      </main>
      <Toast toast={toast} />
    </div>
  );
}
