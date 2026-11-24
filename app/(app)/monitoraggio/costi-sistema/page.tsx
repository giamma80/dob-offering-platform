import { configAttiva } from '@/lib/dati';
import { EditorCostiSistema } from './EditorCostiSistema';

export default async function CostiSistema() {
  const { versione, dati } = await configAttiva();
  return <EditorCostiSistema versione={versione} iniziale={dati} />;
}
