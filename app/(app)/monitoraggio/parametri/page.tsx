import { configAttiva } from '@/lib/dati';
import { EditorParametri } from './EditorParametri';

export default async function Parametri() {
  const { versione, dati } = await configAttiva();
  return <EditorParametri versione={versione} iniziale={dati} />;
}
