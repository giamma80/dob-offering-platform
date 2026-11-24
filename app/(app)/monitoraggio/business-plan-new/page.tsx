import { caricaBusinessPlan } from '@/lib/businessPlan';
import { VistaBusinessPlanNew } from './VistaBusinessPlanNew';

export default async function BusinessPlanNew() {
  const d = await caricaBusinessPlan();
  return <VistaBusinessPlanNew investimento={d.investimento} progetti={d.progetti} piattaforma={d.piattaforma} />;
}
