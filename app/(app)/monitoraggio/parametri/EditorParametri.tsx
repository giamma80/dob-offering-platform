'use client';

import { useState, useTransition } from 'react';
import { salvaConfig } from '@/lib/azioni';
import type { Config } from '@/lib/engine';
import { euro, perc } from '@/lib/ui/formato';
import { CampoNumero } from '@/components/CampoNumero';
import { Toast, useToast } from '@/components/Toast';
import { useT } from '@/lib/i18n/client';

const SEZIONI = [
  { id: 'figure', nome: 'par.figure' },
  { id: 'condivisi', nome: 'par.condivisi' },
  { id: 'catalogo', nome: 'par.catalogo' },
  { id: 'ai', nome: 'par.ai' }
] as const;

export function EditorParametri({ versione, iniziale }: { versione: number; iniziale: Config }) {
  const t = useT();
  const [c, setC] = useState<Config>(iniziale);
  const [sez, setSez] = useState<(typeof SEZIONI)[number]['id']>('figure');
  const [nota, setNota] = useState('');
  const [pending, start] = useTransition();
  const { toast, mostra } = useToast();
  const n = c.costiCondivisi.clientiAttivi + 1;
  const upd = (f: (x: Config) => void) => setC((p) => { const x = structuredClone(p); f(x); return x; });
  const salva = () => start(async () => {
    const r = await salvaConfig(c, nota);
    mostra(r.errore ? { tipo: 'errore', testo: r.errore } : { tipo: 'conferma', testo: t('par.salvata') });
  });

  return (
    <div className="shell">
      <aside className="subnav" aria-label="Sottosezioni">
        <p className="subnav__title">{t('mon.parametri')}</p>
        {SEZIONI.map((s) => (
          <a key={s.id} className="subnav__a" href="#" aria-current={sez === s.id ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); setSez(s.id); }}><span>{t(s.nome)}</span></a>
        ))}
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

        {sez === 'figure' && (
          <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('par.figureProf')}</h2></div>
            <div className="alt-card__body">
              <div className="griglia-campi" style={{ marginBottom: 16 }}>
                <CampoNumero etichetta={t('par.margine')} valore={c.margineVenduto * 100} suffisso="%" min={0} max={99}
                  onChange={(v) => upd((x) => { x.margineVenduto = v / 100; })} />
              </div>
              <table className="alt-table">
                <thead><tr><th>{t('par.figura')}</th><th className="is-num">{t('par.costoGg')}</th><th className="is-num">{t('par.tariffaGg')}</th></tr></thead>
                <tbody>
                  {c.figure.map((f, i) => (
                    <tr key={f.id}>
                      <td>{f.nome}</td>
                      <td className="is-num"><CampoNumero compatto etichetta={`${t('par.costoGg')} ${f.nome}`} valore={f.costo} min={1}
                        onChange={(v) => upd((x) => { x.figure[i].costo = v; })} /></td>
                      <td className="is-num">{euro(f.costo / (1 - c.margineVenduto))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
        )}

        {sez === 'condivisi' && (
          <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('par.condivisi')}</h2></div>
            <div className="alt-card__body">
              <div className="griglia-campi">
                <CampoNumero etichetta={t('par.clienti')} valore={c.costiCondivisi.clientiAttivi} min={0}
                  onChange={(v) => upd((x) => { x.costiCondivisi.clientiAttivi = v; })} />
                <CampoNumero etichetta={t('par.n8n')} valore={c.costiCondivisi.n8nOcrMese} min={0}
                  onChange={(v) => upd((x) => { x.costiCondivisi.n8nOcrMese = v; })} />
                <CampoNumero etichetta={t('par.ams')} valore={c.costiCondivisi.amsSaasAnno} min={0}
                  onChange={(v) => upd((x) => { x.costiCondivisi.amsSaasAnno = v; })} />
                <CampoNumero etichetta={t('par.supporto')} valore={c.costiCondivisi.supportoAnno} min={0}
                  onChange={(v) => upd((x) => { x.costiCondivisi.supportoAnno = v; })} />
                <CampoNumero etichetta={t('par.reevoServizi')} valore={c.costiCondivisi.reevoServiziUnaTantum} min={0}
                  onChange={(v) => upd((x) => { x.costiCondivisi.reevoServiziUnaTantum = v; })} />
              </div>
              <table className="alt-table" style={{ marginTop: 20 }}>
                <thead><tr><th>ReeVo</th><th className="is-num">{t('par.meseEur')}</th><th className="is-num">{t('par.quota', { n })}</th></tr></thead>
                <tbody>
                  {c.costiCondivisi.reevo.map((r, i) => (
                    <tr key={r.nome}>
                      <td>{r.nome}</td>
                      <td className="is-num"><CampoNumero compatto etichetta={r.nome} valore={r.mese} min={0}
                        onChange={(v) => upd((x) => { x.costiCondivisi.reevo[i].mese = v; })} /></td>
                      <td className="is-num">{euro((r.mese * 12) / n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
        )}

        {sez === 'catalogo' && (
          <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('par.catalogo')}</h2></div>
            <div className="alt-card__body">
              {(['connettori', 'integrazioni', 'cicd'] as const).map((k) => (
                <table key={k} className="alt-table" style={{ marginBottom: 20 }}>
                  <thead><tr><th>{t(k === 'cicd' ? 'par.cicd' : k === 'connettori' ? 'par.connettori' : 'par.integrazioni')}</th><th className="is-num">{t('par.giornate')}</th></tr></thead>
                  <tbody>
                    {c.catalogo[k].map((v, i) => (
                      <tr key={v.id}>
                        <td>{v.nome}</td>
                        <td className="is-num"><CampoNumero compatto etichetta={v.nome} valore={v.gg} min={0}
                          onChange={(g) => upd((x) => { x.catalogo[k][i].gg = g; })} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div></div>
        )}

        {sez === 'ai' && (
          <div className="alt-card"><div className="alt-card__head"><h2 className="alt-card__title">{t('par.aiTitolo')}</h2></div>
            <div className="alt-card__body griglia-campi">
              <CampoNumero etichetta={t('par.perDoc')} valore={c.ai.perDocumento} min={0} passo={0.01}
                onChange={(v) => upd((x) => { x.ai.perDocumento = v; })} />
              <CampoNumero etichetta={t('par.docPratica')} valore={c.ai.documentiPerPratica} min={0}
                onChange={(v) => upd((x) => { x.ai.documentiPerPratica = v; })} />
            </div></div>
        )}
      </main>
      <aside className="rail" aria-label="Statistiche">
        <div className="rail__card">
          <p className="rail__h">{t('par.versione')}</p>
          <div className="rail__stat"><span>{t('par.attiva')}</span><b>{versione}</b></div>
          <div className="rail__stat"><span>{t('par.margine')}</span><b>{perc(c.margineVenduto)}</b></div>
          <div className="rail__stat"><span>{t('par.divisore')}</span><b>{n}</b></div>
        </div>
      </aside>
      <Toast toast={toast} />
    </div>
  );
}
