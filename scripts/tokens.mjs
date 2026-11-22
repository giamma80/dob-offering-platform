// Genera app/styles/tokens.css da design-system/tokens.json (tema chiaro su :root, scuro su [data-theme=dark]).
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../design-system/tokens.json', import.meta.url)));
const light = [], dark = [];
for (const t of d.color.tokens) { light.push(`--${t.name}:${t.value.light}`); dark.push(`--${t.name}:${t.value.dark}`); }
for (const t of d.shadow.tokens) { light.push(`--${t.name}:${t.value.light}`); dark.push(`--${t.name}:${t.value.dark}`); }
for (const t of [...d.spacing.tokens, ...d.radius.tokens]) light.push(`--${t.name}:${t.value}`);
light.push(`--font-sans:${d.type.families.sans}`, `--font-numeric:${d.type.families.numeric}`);
for (const g of d.type.groups) for (const s of g.styles) {
  light.push(`--type-${s.name}-size:${s.fontSize}`, `--type-${s.name}-line:${s.lineHeight}`, `--type-${s.name}-weight:${s.fontWeight}`);
}
const css = `/* Generato da scripts/tokens.mjs — non modificare a mano */\n:root{${light.join(';')}}\n[data-theme="dark"]{${dark.join(';')}}\n`;
writeFileSync(new URL('../app/styles/tokens.css', import.meta.url), css);
console.log('app/styles/tokens.css', css.length);
