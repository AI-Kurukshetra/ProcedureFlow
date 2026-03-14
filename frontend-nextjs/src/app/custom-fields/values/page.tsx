import { ModulePage } from '@/components/modules/ModulePage';
import { moduleConfigs } from '@/lib/module-configs';
import { requireAdmin } from '@/lib/guards';

export default async function Page() {
  await requireAdmin();
  return <ModulePage config={moduleConfigs.customFieldValues} />;
}
