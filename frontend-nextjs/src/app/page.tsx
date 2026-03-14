import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { SectionHeader } from '@/components/ui/SectionHeader';

const featureGroups = [
  {
    group: 'Clinical',
    tiles: [
      {
        number: 1,
        title: 'Procedure Template Management',
        description: 'Customizable templates for different procedure types with structured data fields, versioning, and specialty-specific workflows.',
        href: '/templates',
        priority: 'must-have',
      },
      {
        number: 2,
        title: 'Real-time Procedure Documentation',
        description: 'Live procedure documentation with autosave, voice-to-text capture, imaging, multi-device sync, and compliance tracking.',
        href: '/procedures',
        priority: 'must-have',
      },
      {
        number: 3,
        title: 'Voice-to-Text Integration',
        description: 'Hands-free speech recognition during procedures. Transcripts are saved in real time within the procedures module.',
        href: '/procedures',
        priority: 'must-have',
      },
      {
        number: 4,
        title: 'Medical Image Integration',
        description: 'Capture, annotate, and embed procedure images and videos directly into the procedure record via file upload.',
        href: '/procedures',
        priority: 'must-have',
      },
      {
        number: 6,
        title: 'Patient Demographics',
        description: 'Automatic patient data population from EMR with manual override. Stores MRN, insurance, allergies, and emergency contacts.',
        href: '/patients',
        priority: 'must-have',
      },
      {
        number: 7,
        title: 'Clinical Decision Support',
        description: 'Built-in specialty-specific guidelines, contraindication alerts, and evidence-based protocol checklists shown during live documentation.',
        href: '/clinical',
        priority: 'must-have',
      },
      {
        number: 11,
        title: 'Multi-Specialty Support',
        description: 'Support for GI, pulmonology, cardiology, and all specialties with specialty-specific workflows and documentation requirements.',
        href: '/specialties',
        priority: 'must-have',
      },
      {
        number: 14,
        title: 'Digital Consent Management',
        description: 'Electronic consent forms with digital signature capture, witness verification, and procedure-linked consent tracking.',
        href: '/consents',
        priority: 'important',
      },
    ],
  },
  {
    group: 'Operations',
    tiles: [
      {
        number: 5,
        title: 'EMR Integration',
        description: 'Seamless bi-directional integration with Epic, Cerner, Athenahealth, and major EMR systems via FHIR R4 and HL7.',
        href: '/integrations/emr',
        priority: 'must-have',
      },
      {
        number: 13,
        title: 'Procedure Scheduling',
        description: 'Integration with scheduling systems to auto-populate upcoming procedures, with priority triage and room assignment.',
        href: '/scheduling',
        priority: 'important',
      },
      {
        number: 16,
        title: 'Medication Tracking',
        description: 'Track medications administered during procedures with dosage, route, timing, and controlled substance management.',
        href: '/medications',
        priority: 'important',
      },
      {
        number: 17,
        title: 'Equipment Utilization Tracking',
        description: 'Log medical equipment used during procedures for maintenance scheduling, sterilization workflows, and inventory control.',
        href: '/equipment',
        priority: 'important',
      },
      {
        number: 18,
        title: 'Billing Code Integration',
        description: 'Automatic CPT and ICD-10 code suggestions based on procedure documentation with full billing lifecycle tracking.',
        href: '/billing',
        priority: 'must-have',
      },
      {
        number: 19,
        title: 'Staff Assignment Management',
        description: 'Assign and track staff members to procedures with credential verification and role-based participation records.',
        href: '/staff',
        priority: 'important',
      },
    ],
  },
  {
    group: 'Analytics & Reporting',
    tiles: [
      {
        number: 9,
        title: 'Automated Report Generation',
        description: 'Generate structured procedure reports in multiple formats (PDF, HL7, CSV) with downloadable artifacts.',
        href: '/reports',
        priority: 'must-have',
      },
      {
        number: 10,
        title: 'Quality Metrics Dashboard',
        description: 'Real-time analytics on procedure completion rates, quality indicators, outcome trends, and compliance performance.',
        href: '/analytics/quality',
        priority: 'important',
      },
      {
        number: 22,
        title: 'Procedure History Timeline',
        description: 'Chronological view of a patient\'s complete procedure history across all specialties with findings and status summaries.',
        href: '/history',
        priority: 'important',
      },
      {
        number: 15,
        title: 'Compliance Reporting',
        description: 'Automated generation of regulatory compliance records and audit trails for JC, CMS, and HIPAA accreditation.',
        href: '/compliance',
        priority: 'must-have',
      },
    ],
  },
  {
    group: 'Platform & Settings',
    tiles: [
      {
        number: 8,
        title: 'Multi-Device Synchronization',
        description: 'Cross-device compatibility with real-time sync across tablets, computers, and mobile via Supabase Realtime channels.',
        href: '/devices',
        priority: 'must-have',
      },
      {
        number: 12,
        title: 'Role-Based Access Control',
        description: 'Granular permissions for physicians, nurses, technicians, and administrators with multi-layer enforcement.',
        href: '/users',
        priority: 'must-have',
      },
      {
        number: 20,
        title: 'Offline Mode Capability',
        description: 'Continue documentation when internet is unavailable with automatic sync queue restoration when connectivity is restored.',
        href: '/offline',
        priority: 'important',
      },
      {
        number: 21,
        title: 'Custom Field Builder',
        description: 'Allow healthcare organizations to create custom data fields with visibility rules and group organization for any procedure type.',
        href: '/custom-fields',
        priority: 'important',
      },
    ],
  },
];

const groupAccent: Record<string, { bar: string }> = {
  'Clinical':              { bar: 'from-indigo-500 to-violet-500' },
  'Operations':            { bar: 'from-sky-500 to-cyan-400' },
  'Analytics & Reporting': { bar: 'from-violet-500 to-pink-500' },
  'Platform & Settings':   { bar: 'from-emerald-500 to-teal-400' },
};

export default function Home() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Command Center</h1>
        <p className="mt-1.5 text-sm text-slate-500">End-to-end clinical documentation platform.</p>
      </div>
      <div className="space-y-10">
        {featureGroups.map((group) => {
          const accent = groupAccent[group.group] ?? groupAccent['Clinical'];
          return (
            <div key={group.group}>
              {/* Group header */}
              <div className="mb-4 flex items-center gap-3">
                <div className={`h-5 w-1 rounded-full bg-gradient-to-b ${accent.bar}`} />
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{group.group}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {group.tiles.map((tile) => (
                  <Link key={tile.href + tile.number} href={tile.href} className="group block">
                    <div className="relative h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(99,102,241,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(99,102,241,0.18)] hover:border-indigo-100">
                      {/* Color accent bar */}
                      <div className={`h-1 w-full bg-gradient-to-r ${accent.bar}`} />
                      <div className="p-5">
                        <h3 className="text-sm font-bold leading-snug text-slate-900">{tile.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{tile.description}</p>
                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-400 transition-colors duration-150 group-hover:text-indigo-600">
                          Open module
                          <svg className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
