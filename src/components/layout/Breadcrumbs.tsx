'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigation } from '@/lib/navigation-context';

const labelMap: Record<string, string> = {
  // Clinical
  procedures: 'Procedures',
  templates: 'Templates',
  patients: 'Patients',
  consents: 'Consents',
  clinical: 'Clinical Support',
  specialties: 'Specialties',
  // Operations
  scheduling: 'Scheduling',
  staff: 'Staff Assignments',
  medications: 'Medications',
  equipment: 'Equipment',
  billing: 'Billing Codes',
  reports: 'Reports',
  // Analytics
  analytics: 'Analytics',
  quality: 'Quality Metrics',
  history: 'History Timeline',
  devices: 'Device Data',
  research: 'Research Data',
  // Admin
  users: 'Users & Roles',
  'custom-fields': 'Custom Fields',
  values: 'Field Values',
  integrations: 'Integrations',
  emr: 'EMR Integration',
  compliance: 'Compliance',
  // Settings
  offline: 'Offline Hub',
  notifications: 'Notifications',
  profile: 'Profile',
  'roles-test': 'Role Test',
  // Misc
  search: 'Search',
  reset: 'Reset Password',
  login: 'Sign In',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { isNavigating, pendingPath } = useNavigation();

  // Use the pending path immediately on click — no waiting for the server round-trip
  const activePath = isNavigating && pendingPath ? pendingPath : pathname;
  const segments = activePath.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 text-xs">
      <Link href="/" className="font-medium text-slate-400 hover:text-indigo-600 transition-colors">
        Home
      </Link>
      {segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const label = labelMap[segment] ?? segment;
        const isLast = index === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1.5">
            <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {isLast ? (
              <span className="font-semibold text-slate-700">{label}</span>
            ) : (
              <Link href={href} className="font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
