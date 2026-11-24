'use client';

import { useT } from '@/lib/i18n/client';
import { Icona } from '@/components/Icona';

/* Esporta in PDF la sola colonna centrale dello specchietto: la stampa del browser, con il foglio di stile `@media print`
   che nasconde testata, schede, menu e colonna laterale. Il nome del file è quello del titolo della pagina. */
export function EsportaPdf({ nomeFile }: { nomeFile: string }) {
  const t = useT();
  const esporta = () => {
    const prima = document.title;
    const ripristina = () => { document.title = prima; window.removeEventListener('afterprint', ripristina); };
    document.title = nomeFile;
    window.addEventListener('afterprint', ripristina);
    window.print();
  };
  return (
    <button className="alt-btn alt-btn--primary" type="button" onClick={esporta} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <Icona nome="specch" />{t('sp.esportaPdf')}
    </button>
  );
}
