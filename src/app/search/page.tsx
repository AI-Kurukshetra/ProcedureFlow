'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

function SearchResults() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const [patients, setPatients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    const run = async () => {
      setLoading(true);
      const [pRes, procRes, tRes, schRes, medRes, gRes, uRes] = await Promise.all([
        supabase.from('patients').select('id,first_name,last_name,mrn,date_of_birth').or(`last_name.ilike.%${query}%,first_name.ilike.%${query}%,mrn.ilike.%${query}%`).limit(10),
        supabase.from('procedures').select('id,title,status,procedure_date').ilike('title', `%${query}%`).limit(10),
        supabase.from('templates').select('id,name,description').ilike('name', `%${query}%`).limit(10),
        supabase.from('schedules').select('id,procedure_type,scheduled_date,status,priority').ilike('procedure_type', `%${query}%`).limit(10),
        supabase.from('medications').select('id,name,form,strength,route').ilike('name', `%${query}%`).limit(10),
        supabase.from('clinical_guidelines').select('id,title,severity,guideline_type').ilike('title', `%${query}%`).limit(10),
        supabase.from('users').select('id,first_name,last_name,role,email').or(`last_name.ilike.%${query}%,first_name.ilike.%${query}%,email.ilike.%${query}%`).limit(10),
      ]);
      setPatients(pRes.data ?? []);
      setProcedures(procRes.data ?? []);
      setTemplates(tRes.data ?? []);
      setSchedules(schRes.data ?? []);
      setMedications(medRes.data ?? []);
      setGuidelines(gRes.data ?? []);
      setStaff(uRes.data ?? []);
      setLoading(false);
    };
    run();
  }, [query]);

  const totalResults = patients.length + procedures.length + templates.length + schedules.length + medications.length + guidelines.length + staff.length;

  const statusTone = (status: string): 'emerald' | 'amber' | 'slate' => {
    if (status === 'signed' || status === 'completed' || status === 'active') return 'emerald';
    if (status === 'in-progress' || status === 'scheduled') return 'amber';
    return 'slate';
  };

  const severityTone = (severity: string): 'rose' | 'amber' | 'sky' => {
    if (severity === 'critical') return 'rose';
    if (severity === 'warning') return 'amber';
    return 'sky';
  };

  if (loading) return <PageSkeleton hasHeader={false} />;

  return (
    <AppShell>
      <>
        <SectionHeader
          title="Search"
          description={query ? `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}" across patients, procedures, templates, schedules, medications, guidelines, and staff.` : 'Use the search bar above to find anything in ProcedureFlow.'}
        />

        {!query ? (
          <Card>
            <p className="text-sm text-slate-500">Type a name, MRN, procedure title, medication name, or any keyword in the search bar above.</p>
          </Card>
        ) : totalResults === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">No results found for "{query}". Try a different keyword.</p>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Patients */}
            {patients.length > 0 && (
              <Card>
                <CardHeader title="Patients" subtitle={`${patients.length} match${patients.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {patients.map((p) => (
                    <Link key={p.id} href="/patients" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <p className="font-semibold text-slate-800">{p.last_name}, {p.first_name}</p>
                      <p className="text-xs text-slate-400">{p.mrn ? `MRN: ${p.mrn}` : ''}{p.date_of_birth ? ` · DOB: ${p.date_of_birth}` : ''}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Procedures */}
            {procedures.length > 0 && (
              <Card>
                <CardHeader title="Procedures" subtitle={`${procedures.length} match${procedures.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {procedures.map((p) => (
                    <Link key={p.id} href="/procedures" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-800">{p.title}</p>
                        <Badge label={p.status} tone={statusTone(p.status)} />
                      </div>
                      <p className="text-xs text-slate-400">{p.procedure_date}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Templates */}
            {templates.length > 0 && (
              <Card>
                <CardHeader title="Templates" subtitle={`${templates.length} match${templates.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {templates.map((t) => (
                    <Link key={t.id} href="/templates" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <p className="font-semibold text-slate-800">{t.name}</p>
                      {t.description && <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>}
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Schedules */}
            {schedules.length > 0 && (
              <Card>
                <CardHeader title="Scheduled Procedures" subtitle={`${schedules.length} match${schedules.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {schedules.map((s) => (
                    <Link key={s.id} href="/scheduling" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-800">{s.procedure_type}</p>
                        <Badge label={s.status} tone={statusTone(s.status)} />
                      </div>
                      <p className="text-xs text-slate-400">{s.scheduled_date}{s.priority ? ` · ${s.priority}` : ''}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Medications */}
            {medications.length > 0 && (
              <Card>
                <CardHeader title="Medications" subtitle={`${medications.length} match${medications.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {medications.map((m) => (
                    <Link key={m.id} href="/medications" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-400">{[m.form, m.strength, m.route].filter(Boolean).join(' · ')}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Clinical Guidelines */}
            {guidelines.length > 0 && (
              <Card>
                <CardHeader title="Clinical Guidelines" subtitle={`${guidelines.length} match${guidelines.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {guidelines.map((g) => (
                    <Link key={g.id} href="/clinical" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-slate-800">{g.title}</p>
                        <Badge label={g.severity ?? 'info'} tone={severityTone(g.severity)} />
                      </div>
                      {g.guideline_type && <p className="text-xs text-slate-400 capitalize">{g.guideline_type.replace('_', ' ')}</p>}
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Staff */}
            {staff.length > 0 && (
              <Card>
                <CardHeader title="Staff Members" subtitle={`${staff.length} match${staff.length !== 1 ? 'es' : ''}`} />
                <div className="space-y-2 text-sm text-slate-600">
                  {staff.map((u) => (
                    <Link key={u.id} href="/users" className="block rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{u.last_name}, {u.first_name}</p>
                        <Badge label={u.role ?? 'user'} tone="slate" />
                      </div>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
