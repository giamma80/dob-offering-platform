import { describe, expect, it } from 'vitest';
import { leggiNumero } from './numero';

describe('leggiNumero', () => {
  it('punto e virgola decimali valgono uguale', () => {
    expect(leggiNumero('50.5')).toBe(50.5);
    expect(leggiNumero('50,5')).toBe(50.5);
    expect(leggiNumero('0.25')).toBe(0.25);
  });
  it('il punto raggruppa solo a gruppi di tre cifre', () => {
    expect(leggiNumero('1.000')).toBe(1000);
    expect(leggiNumero('140.000')).toBe(140000);
    expect(leggiNumero('1.234,5')).toBe(1234.5);
    expect(leggiNumero('1.234.567')).toBe(1234567);
  });
  it('testi non numerici o ambigui sono rifiutati', () => {
    expect(leggiNumero('')).toBeNaN();
    expect(leggiNumero('abc')).toBeNaN();
    expect(leggiNumero('1,2,3')).toBeNaN();
    expect(leggiNumero('1.2.3')).toBeNaN();
    expect(leggiNumero('12.34,5')).toBeNaN();
  });
});
