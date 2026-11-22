// Genera supabase/seed/configurazione.json dal default del motore: una sola fonte di verità.
import { writeFileSync } from 'node:fs';
const { CONFIG_DEFAULT } = await import('../lib/engine/defaults.ts');
writeFileSync(new URL('../supabase/seed/configurazione.json', import.meta.url), JSON.stringify(CONFIG_DEFAULT, null, 2) + '\n');
console.log('supabase/seed/configurazione.json');
