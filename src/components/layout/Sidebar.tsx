'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useNavigation } from '@/lib/navigation-context';

const groups = [
  {
    title: 'Clinical',
    items: [
      { label: 'Overview', href: '/' },
      { label: 'Procedures', href: '/procedures' },
      { label: 'Templates', href: '/templates' },
      { label: 'Patients', href: '/patients' },
      { label: 'Consents', href: '/consents' },
      { label: 'Clinical Support', href: '/clinical' },
      { label: 'Specialties', href: '/specialties' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Scheduling', href: '/scheduling' },
      { label: 'Staff Assignments', href: '/staff' },
      { label: 'Medications', href: '/medications' },
      { label: 'Equipment', href: '/equipment' },
      { label: 'Billing Codes', href: '/billing' },
      { label: 'Reports', href: '/reports' },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Quality Metrics', href: '/analytics/quality' },
      { label: 'History Timeline', href: '/history' },
      { label: 'Device Data', href: '/devices' },
      { label: 'Research Data', href: '/research' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users & Roles', href: '/users' },
      { label: 'Custom Fields', href: '/custom-fields' },
      { label: 'Field Values', href: '/custom-fields/values' },
      { label: 'EMR Integrations', href: '/integrations/emr' },
      { label: 'Compliance', href: '/compliance' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Offline Hub', href: '/offline' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Profile', href: '/profile' },
      { label: 'Role Test', href: '/roles-test' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { startNavigation } = useNavigation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const loadRole = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (!email) return;
      const { data: profile } = await supabase.from('users').select('role').eq('email', email).single();
      setRole(profile?.role ?? null);
    };
    const loadUnread = async () => {
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false);
      setUnreadCount(count ?? 0);
    };
    loadRole();
    loadUnread();
  }, []);

  // persist sidebar scroll position across navigations
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const saved = sessionStorage.getItem('sidebar-scroll');
    if (saved) node.scrollTop = Number(saved);
    const onScroll = () => {
      sessionStorage.setItem('sidebar-scroll', String(node.scrollTop));
    };
    node.addEventListener('scroll', onScroll);
    return () => node.removeEventListener('scroll', onScroll);
  }, [pathname]);

  const filterByRole = (href: string) => {
    const adminOnly = ['/users', '/integrations/emr', '/compliance', '/roles-test', '/custom-fields', '/custom-fields/values'];
    const adminOrAnalyst = ['/devices', '/research'];
    if (adminOnly.some((p) => href === p)) return role === 'admin';
    if (adminOrAnalyst.some((p) => href === p)) return role === 'admin';
    return true;
  };

  return (
    <aside className="sidebar-dark hidden h-full w-60 flex-shrink-0 flex-col lg:flex overflow-hidden">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-gradient shadow-lg shadow-indigo-900/50">
          <span className="text-xs font-bold text-white">PF</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">ProcedureFlow</p>
          <p className="text-[10px] text-white/40 leading-none mt-0.5">Clinical Platform</p>
        </div>
      </div>

      {/* Nav */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {groups.map((group) => {
          const items = group.items.filter((item) => filterByRole(item.href));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                {group.title}
              </p>
              <nav className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href + '/'));
                  const isNotifications = item.href === '/notifications';
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => !isActive && startNavigation(item.href)}
                      className={cn(
                        'group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                      )}
                      style={isActive ? {} : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-indigo-400" />
                      )}
                      <span>{item.label}</span>
                      {isNotifications && unreadCount > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                            isActive
                              ? 'bg-indigo-400/30 text-indigo-200'
                              : 'bg-rose-500/20 text-rose-300'
                          )}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/25 text-center">v1.0 · © 2025 ProcedureFlow</p>
      </div>
    </aside>
  );
}
