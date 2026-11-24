import { caricaBusinessPlan } from '@/lib/businessPlan';
import { VistaBusinessPlan } from './VistaBusinessPlan';

export default async function BusinessPlan() {
  const d = await caricaBusinessPlan();
  return <VistaBusinessPlan investimento={d.investimento} progetti={d.progetti} piattaforma={d.piattaforma} />;
}
