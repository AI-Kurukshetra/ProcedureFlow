'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { SessionProvider } from '@/lib/session-context';
import { NavigationProvider, useNavigation } from '@/lib/navigation-context';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

function NavProgressBar() {
  const { isNavigating } = useNavigation();
  return (
    <div
      className={`absolute left-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 z-50 ${
        isNavigating ? 'w-[85%] opacity-100' : 'w-0 opacity-0'
      }`}
    />
  );
}

function MainContent({ children }: { children: ReactNode }) {
  const { isNavigating } = useNavigation();
  return (
    <main className="relative flex-1 overflow-y-auto px-6 py-7 lg:px-8">
      <NavProgressBar />
      <div className="mx-auto max-w-[1200px]">
        <Breadcrumbs />
        <OfflineBanner />
        {isNavigating ? <PageSkeleton /> : children}
      </div>
    </main>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NavigationProvider>
        <div className="flex h-screen overflow-hidden bg-app">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <MainContent>{children}</MainContent>
          </div>
        </div>
      </NavigationProvider>
    </SessionProvider>
  );
}
