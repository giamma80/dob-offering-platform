'use client';

import { scorriA } from '@/lib/ui/scorri';

import { useState, useTransition } from 'react';
import { salvaConfig } from '@/lib/azioni';
import type { Config } from '@/lib/engine';
import { euro, numero, perc } from '@/lib/ui/formato';
import { CampoNumero } from '@/components/CampoNumero';
import { Icona } from '@/components/Icona';
import { Toast, useToast } from '@/components/Toast';
import { useT } from '@/lib/i18n/client';
import type { Chiave } from '@/lib/i18n/dizionari';
import { MenuUtente } from '@/components/utente/MenuUtente';

/* Parametri di sistema come nel mockup (Sistema.dc.html): card impilate, la sottonavigazione scorre. */
const SEZIONI: { id: string; k: Chiave; ico: string }[] = [
  { id: 'ps-fig', k: 'par.figureProf', ico: 'figure' },
  { id: 'ps-marg', k: 'par.margineDef', ico: 'margine' },
  { id: 'ps-cond', k: 'par.condivisi', ico: 'costi' },
  { id: 'ps-mod', k: 'par.moduli', ico: 'catalogo' },
  { id: 'ps-cat', k: 'par.catalogo', ico: 'catalogo' },
  { id: 'ps-ai', k: 'par.aiTitolo', ico: 'ai' }
];

function Card({ id, titolo, ico, children }: { id: string; titolo: string; ico: string; children: React.ReactNode }) {
  return (
    <div className="alt-card" id={id}>
      <div className="alt-card__head"><h2 className="alt-card__title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome={ico} />{titolo}</h2></div>
      <div className="alt-card__body">{children}</div>
    </div>
  );
}

export function EditorParametri({ versione, iniziale }: { versione: number; iniziale: Config }) {
  const t = useT();
  const [c, setC] = useState<Config>(iniziale);
  const [base, setBase] = useState(versione);
  const [sez, setSez] = useState(SEZIONI[0].id);
  const [nota, setNota] = useState('');
  const [pending, start] = useTransition();
  const { toast, mostra } = useToast();
  const n = c.costiCondivisi.clientiAttivi + 1;
  const upd = (f: (x: Config) => void) => setC((p) => { const x = structuredClone(p); f(x); return x; });
  const sommaPesi = (c.moduli ?? []).reduce((a, m) => a + m.peso, 0);
  const salva = () => start(async () => {
    if (c.moduli?.length && Math.abs(sommaPesi - 100) > 0.001) { mostra({ tipo: 'errore', testo: t('par.pesiErrati') }); return; }
    const r = await salvaConfig(c, nota, base);
    if ('superata' in r && r.superata) { mostra({ tipo: 'errore', testo: t('par.superata', { v: r.superata }) }); return; }
    if ('errore' in r && r.errore) { mostra({ tipo: 'errore', testo: r.errore }); return; }
    if ('versione' in r && r.versione) setBase(r.versione);
    mostra({ tipo: 'conferma', testo: t('par.salvata') });
  });
  const cc = c.costiCondivisi;
  const reevoAnno = cc.reevo.reduce((a, r) => a + r.mese, 0) * 12;
  const ricorrentePerCliente = (reevoAnno + cc.n8nOcrMese * 12 + cc.amsSaasAnno + cc.supportoAnno) / n;
  const cp = (id: string) => { const s = SEZIONI.find((x) => x.id === id)!; return { id, titolo: t(s.k), ico: s.ico }; };
  const badge: Record<string, string> = {
    'ps-fig': String(c.figure.length), 'ps-marg': perc(c.margineVenduto), 'ps-cond': '',
    'ps-mod': String((c.moduli ?? []).length),
    'ps-cat': String(c.catalogo.connettori.length + c.catalogo.integrazioni.length + c.catalogo.cicd.length), 'ps-ai': ''
  };
  const moduliDi = (k: 'connettori' | 'integrazioni', id: string) =>
    (c.moduli ?? []).filter((m) => (m[k] ?? []).includes(id)).map((m) => m.nome).join(', ');
  const catalogo: { v: { id: string; nome: string; gg: number }; tipo: Chiave; set: (g: number) => void; modulo?: string;
    def?: { on: boolean; set: (b: boolean) => void } }[] = [
    ...c.catalogo.base.map((v, i) => ({ v, tipo: 'par.tipoBase' as Chiave, set: (g: number) => upd((x) => { x.catalogo.base[i].gg = g; }) })),
    ...c.catalogo.connettori.map((v, i) => ({ v, tipo: 'par.tipoConnettore' as Chiave, modulo: moduliDi('connettori', v.id),
      set: (g: number) => upd((x) => { x.catalogo.connettori[i].gg = g; }),
      def: { on: v.default, set: (b: boolean) => upd((x) => { x.catalogo.connettori[i].default = b; }) } })),
    ...c.catalogo.integrazioni.map((v, i) => ({ v, tipo: 'par.tipoIntegrazione' as Chiave, modulo: moduliDi('integrazioni', v.id),
      set: (g: number) => upd((x) => { x.catalogo.integrazioni[i].gg = g; }),
      def: { on: v.default, set: (b: boolean) => upd((x) => { x.catalogo.integrazioni[i].default = b; }) } })),
    ...c.catalogo.cicd.map((v, i) => ({ v, tipo: 'par.tipoCicd' as Chiave, set: (g: number) => upd((x) => { x.catalogo.cicd[i].gg = g; }) })),
    { v: { id: 'amb', nome: t('par.ambientiSaas', { n: c.catalogo.ambientiSaas.numero }), gg: c.catalogo.ambientiSaas.ggPerAmbiente }, tipo: 'par.tipoMessa' as Chiave,
      set: (g: number) => upd((x) => { x.catalogo.ambientiSaas.ggPerAmbiente = g; }) },
    { v: c.catalogo.passaggioConsegne, tipo: 'par.tipoMessa' as Chiave, set: (g: number) => upd((x) => { x.catalogo.passaggioConsegne.gg = g; }) }
  ];

  return (
    <div className="shell">
      <aside className="subnav" aria-label={t('mon.parametri')}>
        <p className="subnav__title">{t('mon.parametri')}</p>
        {SEZIONI.map((s) => (
          <a key={s.id} className="subnav__a" href={`#${s.id}`} aria-current={sez === s.id ? 'true' : undefined}
            onClick={(e) => { e.preventDefault(); setSez(s.id); scorriA(s.id); }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icona nome={s.ico} />{t(s.k)}</span><small>{badge[s.id]}</small>
          </a>
        ))}
        <MenuUtente />
      </aside>
      <main className="content">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <h1 className="ttl">{t('par.titolo')}</h1>
          <div className="azioni" style={{ marginLeft: 'auto' }}>
            <span className="alt-inputwrap" style={{ maxWidth: 260 }}>
              <input className="alt-input" placeholder={t('par.nota')} value={nota} onChange={(e) => setNota(e.target.value)} aria-label={t('par.nota')} />
            </span>
            <button className="alt-btn alt-btn--primary" type="button" disabled={pending} onClick={salva}>{t('par.salva')}</button>
          </div>
        </div>

        <Card {...cp('ps-fig')}>
          <table className="alt-table">
            <thead><tr><th>{t('par.figura')}</th><th className="is-num">{t('par.costoInterno')}</th><th className="is-num">{t('par.tariffaGg')}</th><th>{t('par.fonte')}</th></tr></thead>
            <tbody>
              {c.figure.map((f, i) => (
                <tr key={f.id}>
                  <td>{f.nome}</td>
                  <td className="is-num"><CampoNumero compatto etichetta={f.nome} valore={f.costo} min={1} suffisso="€"
                    onChange={(v) => upd((x) => { x.figure[i].costo = v; })} /></td>
                  <td className="is-num">{euro(f.costo / (1 - c.margineVenduto))}</td>
                  <td><span className="muted">{t(f.id === 'media' ? 'par.fonteConsuntivo' : 'par.fonteControlling')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card {...cp('ps-marg')}>
          <div className="griglia-campi">
            <CampoNumero etichetta={t('par.margine')} valore={Math.round(c.margineVenduto * 1000) / 10} suffisso="%" min={0} max={99}
              onChange={(v) => upd((x) => { x.margineVenduto = v / 100; })} />
            <div className="campo"><span>{t('par.ricarico')}</span><b className="valore">{perc(c.margineVenduto / (1 - c.margineVenduto))}</b></div>
          </div>
        </Card>

        <Card {...cp('ps-cond')}>
          <table className="alt-table">
            <thead><tr><th>{t('st.voce')}</th><th className="is-num">{t('pr.costo')}</th><th className="is-num">{t('par.perCliente')}</th></tr></thead>
            <tbody>
              {cc.reevo.map((r, i) => (
                <tr key={r.nome}>
                  <td>{`ReeVo · ${r.nome}`}</td>
                  <td className="is-num"><CampoNumero compatto etichetta={r.nome} valore={r.mese} min={0} suffisso={t('par.mese')}
                    onChange={(v) => upd((x) => { x.costiCondivisi.reevo[i].mese = v; })} /></td>
                  <td className="is-num">{euro((r.mese * 12) / n)}</td>
                </tr>
              ))}
              <tr><td>{t('par.n8nVoce')}</td>
                <td className="is-num"><CampoNumero compatto etichetta={t('par.n8nVoce')} valore={cc.n8nOcrMese} min={0} suffisso={t('par.mese')}
                  onChange={(v) => upd((x) => { x.costiCondivisi.n8nOcrMese = v; })} /></td>
                <td className="is-num">{euro((cc.n8nOcrMese * 12) / n)}</td></tr>
              <tr><td>{t('par.amsVoce')}</td>
                <td className="is-num"><CampoNumero compatto etichetta={t('par.amsVoce')} valore={cc.amsSaasAnno} min={0} suffisso={t('par.anno')}
                  onChange={(v) => upd((x) => { x.costiCondivisi.amsSaasAnno = v; })} /></td>
                <td className="is-num">{euro(cc.amsSaasAnno / n)}</td></tr>
              <tr><td>{t('par.supportoVoce')}</td>
                <td className="is-num"><CampoNumero compatto etichetta={t('par.supportoVoce')} valore={cc.supportoAnno} min={0} suffisso={t('par.anno')}
                  onChange={(v) => upd((x) => { x.costiCondivisi.supportoAnno = v; })} /></td>
                <td className="is-num">{euro(cc.supportoAnno / n)}</td></tr>
              <tr><td>{t('par.reevoServiziVoce')}</td>
                <td className="is-num"><CampoNumero compatto etichetta={t('par.reevoServiziVoce')} valore={cc.reevoServiziUnaTantum} min={0} suffisso="€"
                  onChange={(v) => upd((x) => { x.costiCondivisi.reevoServiziUnaTantum = v; })} /></td>
                <td className="is-num">{euro(cc.reevoServiziUnaTantum / n)}</td></tr>
            </tbody>
          </table>
          <div className="griglia-campi" style={{ marginTop: 16 }}>
            <CampoNumero etichetta={t('par.clienti')} valore={cc.clientiAttivi} min={0}
              onChange={(v) => upd((x) => { x.costiCondivisi.clientiAttivi = v; })} />
            <div className="campo"><span>{t('par.divisoreN1')}</span><b className="valore">{n}</b></div>
          </div>
        </Card>

        <Card {...cp('ps-mod')}>
          <table className="alt-table">
            <thead><tr><th>{t('par.moduli')}</th><th>{t('par.nativo')}</th><th className="is-num">{t('par.peso')}</th><th>{t('par.collegati')}</th></tr></thead>
            <tbody>
              {(c.moduli ?? []).map((m, i) => (
                <tr key={m.id}>
                  <td><span className="muted" style={{ fontVariantNumeric: 'tabular-nums', marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>{m.nome}</td>
                  <td><label className="alt-switch"><input type="checkbox" checked={!!m.nativo} aria-label={`${t('par.nativo')} ${m.nome}`}
                    onChange={(e) => upd((x) => { x.moduli[i].nativo = e.target.checked; })} /><span className="alt-switch__box" aria-hidden="true" /></label></td>
                  <td className="is-num"><CampoNumero compatto etichetta={m.nome} valore={m.peso} min={0} max={100} suffisso="%"
                    onChange={(v) => upd((x) => { x.moduli[i].peso = v; })} /></td>
                  <td><span className="muted">{[
                    ...(m.connettori ?? []).map((id) => c.catalogo.connettori.find((y) => y.id === id)?.nome ?? id),
                    ...(m.integrazioni ?? []).map((id) => c.catalogo.integrazioni.find((y) => y.id === id)?.nome ?? id),
                    ...(m.customizzazione ? [`${m.customizzazione.nome} · ${m.customizzazione.gg} gg`] : [])
                  ].join(', ') || (m.opzioneClassi ? '' : '—')}</span>
                  {m.opzioneClassi && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>{m.opzioneClassi.nome}</span>
                      <CampoNumero compatto etichetta={t('par.impiantoOpz')} valore={m.opzioneClassi.impianto} min={0} suffisso="gg"
                        onChange={(v) => upd((x) => { x.moduli[i].opzioneClassi!.impianto = v; })} />
                      <span className="muted">+</span>
                      <CampoNumero compatto etichetta={t('par.perClasse')} valore={m.opzioneClassi.perClasse} min={0} suffisso={t('par.ggClasse')}
                        onChange={(v) => upd((x) => { x.moduli[i].opzioneClassi!.perClasse = v; })} />
                    </span>
                  )}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="is-total"><td>{t('par.sommaPesi')}</td>
              <td /><td className="is-num" style={Math.abs(sommaPesi - 100) > 0.001 ? { color: 'var(--signal-open)' } : undefined}>{perc(sommaPesi / 100)}</td><td /></tr></tfoot>
          </table>
        </Card>

        <Card {...cp('ps-cat')}>
          <table className="alt-table">
            <thead><tr><th>{t('st.voce')}</th><th>{t('par.tipo')}</th><th>{t('par.modulo')}</th><th>{t('par.default')}</th><th className="is-num">{t('par.ggDefault')}</th></tr></thead>
            <tbody>
              {(['bassa', 'media', 'alta'] as const).map((k) => (
                <tr key={`is-${k}`}>
                  <td>{t('par.integrazioneSistema')} · {t(`as.compl.${k}`)}</td><td><span className="muted">{t('as.complessita')}</span></td><td /><td />
                  <td className="is-num"><CampoNumero compatto etichetta={`${t('par.integrazioneSistema')} ${t(`as.compl.${k}`)}`} suffisso="gg" min={0}
                    valore={c.integrazioneSistema?.[k] ?? { bassa: 5, media: 10, alta: 20 }[k]}
                    onChange={(v) => upd((x) => { x.integrazioneSistema = { ...(x.integrazioneSistema ?? { bassa: 5, media: 10, alta: 20, figura: 'dev' }), [k]: v }; })} /></td>
                </tr>
              ))}
              {catalogo.map((x) => (
                <tr key={`${x.tipo}-${x.v.id}`}>
                  <td>{x.v.nome}</td><td><span className="muted">{t(x.tipo)}</span></td>
                  <td><span className="muted">{x.modulo || '—'}</span></td>
                  <td>{x.def && <label className="alt-switch"><input type="checkbox" checked={x.def.on} aria-label={`${t('par.default')} ${x.v.nome}`}
                    onChange={(e) => x.def!.set(e.target.checked)} /><span className="alt-switch__box" aria-hidden="true" /></label>}</td>
                  <td className="is-num"><CampoNumero compatto etichetta={x.v.nome} valore={x.v.gg} min={0} suffisso="gg" onChange={x.set} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card {...cp('ps-ai')}>
          <div className="griglia-campi">
            <CampoNumero etichetta={t('par.perDoc')} valore={c.ai.perDocumento} min={0} suffisso="€"
              onChange={(v) => upd((x) => { x.ai.perDocumento = v; })} />
            <CampoNumero etichetta={t('par.docPratica')} valore={c.ai.documentiPerPratica} min={0}
              onChange={(v) => upd((x) => { x.ai.documentiPerPratica = v; })} />
          </div>
        </Card>
      </main>
      <aside className="rail" aria-label={t('par.versione')}>
        <div className="rail__card rail__card--brand"><p className="rail__h">{t('par.ripartizione')}</p>
          <div className="rail__stat"><span>{t('par.clienti')}</span><b>{cc.clientiAttivi}</b></div>
          <div className="rail__stat"><span>{t('par.divisore')}</span><b>{n}</b></div>
          <div className="rail__stat"><span>{t('par.ricPerCliente')}</span><b>{euro(ricorrentePerCliente)}</b></div>
        </div>
        <div className="rail__card"><p className="rail__h">{t('par.catalogo')}</p>
          <div className="rail__stat"><span>{t('par.connettori')}</span><b>{numero(c.catalogo.connettori.length)}</b></div>
          <div className="rail__stat"><span>{t('par.integrazioni')}</span><b>{numero(c.catalogo.integrazioni.length)}</b></div>
          <div className="rail__stat"><span>{t('par.cicd')}</span><b>{numero(c.catalogo.cicd.length)}</b></div>
        </div>
        <div className="rail__card"><p className="rail__h">{t('par.versione')}</p>
          <div className="rail__stat"><span>{t('par.attiva')}</span><b>{versione}</b></div>
        </div>
      </aside>
      <Toast toast={toast} />
    </div>
  );
}
