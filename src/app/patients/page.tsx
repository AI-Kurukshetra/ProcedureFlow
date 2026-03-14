import { ModulePage } from '@/components/modules/ModulePage';
import { moduleConfigs } from '@/lib/module-configs';
import { requireAnyRole } from '@/lib/guards';

export default async function Page() {
  await requireAnyRole(['admin','physician','nurse']);
  return <ModulePage config={moduleConfigs.patients} />;
}
