/** Legge un numero digitato in formato italiano o con punto decimale.
    "50,5" e "50.5" valgono 50,5; "1.234,5" e "1.000" valgono 1234,5 e 1000 (il punto raggruppa solo a gruppi di tre cifre).
    Restituisce NaN se il testo non è un numero: mai un valore diverso da quello digitato. */
export function leggiNumero(testo: string): number {
  const s = testo.trim().replace(/\s/g, '');
  if (s === '' || !/^[+-]?[\d.,]+$/.test(s)) return NaN;
  if (s.includes(',')) {
    if (s.indexOf(',') !== s.lastIndexOf(',')) return NaN;
    const [i, d] = s.split(',');
    if (i.includes('.') && !/^[+-]?\d{1,3}(\.\d{3})+$/.test(i)) return NaN;
    return Number(`${i.replace(/\./g, '')}.${d}`);
  }
  if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(s) && !/^[+-]?0\./.test(s)) return Number(s.replace(/\./g, ''));
  if ((s.match(/\./g) ?? []).length > 1) return NaN;
  return Number(s);
}
