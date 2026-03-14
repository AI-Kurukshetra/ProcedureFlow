import { ModulePage } from '@/components/modules/ModulePage';
import { moduleConfigs } from '@/lib/module-configs';
import { requireAnyRole } from '@/lib/guards';

export default async function Page() {
  await requireAnyRole(['admin','physician','technician']);
  return <ModulePage config={moduleConfigs.medications} />;
}
