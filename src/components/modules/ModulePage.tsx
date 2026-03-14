import { AppShell } from '@/components/layout/AppShell';
import { ModuleClient, ModuleConfig } from '@/components/modules/ModuleClient';

export function ModulePage({ config }: { config: ModuleConfig }) {
  return (
    <AppShell>
      <ModuleClient config={config} />
    </AppShell>
  );
}
