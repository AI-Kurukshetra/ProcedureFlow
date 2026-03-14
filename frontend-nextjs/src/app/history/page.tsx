'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const statusTone = (status: string): 'emerald' | 'amber' | 'rose' | 'slate' | 'sky' => {
  if (status === 'signed') return 'emerald';
  if (status === 'completed') return 'sky';
  if (status === 'in-progress') return 'amber';
  if (status === 'draft') return 'slate';
  return 'slate';
};

const formatStatus = (status: string) =>
  status
    ? status
        .toLowerCase()
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : '—';

export default function HistoryTimelinePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [patients, setPatients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [physicians, setPhysicians] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pRes, sRes, uRes] = await Promise.all([
        supabase.from('patients').select('id,first_name,last_name,mrn,date_of_birth,gender').order('last_name', { ascending: true }),
        supabase.from('specialties').select('id,name').order('name', { ascending: true }),
        supabase.from('users').select('id,first_name,last_name,role').order('last_name', { ascending: true }),
      ]);
      setPatients(pRes.data ?? []);
      setSpecialties(sRes.data ?? []);
      setPhysicians((uRes.data ?? []).filter((u: any) => u.role === 'physician'));
      setInitialLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!patientId) {
      setProcedures([]);
      setConsents([]);
      return;
    }
    const loadTimeline = async () => {
      setLoading(true);
      const [procRes, consentRes] = await Promise.all([
        supabase
          .from('procedures')
          .select('*')
          .eq('patient_id', patientId)
          .order('procedure_date', { ascending: false }),
        supabase
          .from('consents')
          .select('*')
          .eq('patient_id', patientId)
          .order('signed_at', { ascending: false }),
      ]);
      setProcedures(procRes.data ?? []);
      setConsents(consentRes.data ?? []);
      setLoading(false);
    };
    loadTimeline();
  }, [patientId]);

  const specialtyMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of specialties) m[s.id] = s.name;
    return m;
  }, [specialties]);

  const physicianMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of physicians) m[u.id] = `Dr. ${u.first_name} ${u.last_name}`;
    return m;
  }, [physicians]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const consentsByProcedure = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of consents) {
      if (c.procedure_id) m[c.procedure_id] = (m[c.procedure_id] ?? 0) + 1;
    }
    return m;
  }, [consents]);

  if (initialLoading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <SectionHeader
        title="Procedure History Timeline"
        description="Chronological view of a patient's complete procedure history across all specialties — with findings, physician, consent records, and outcomes."
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Patient selector */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Select Patient" />
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">— Choose a patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.last_name}, {p.first_name} {p.mrn ? `(${p.mrn})` : ''}
                </option>
              ))}
            </Select>
          </Card>

          {selectedPatient && (
            <Card>
              <CardHeader title="Patient Summary" />
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="font-medium text-slate-800">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                </div>
                {selectedPatient.mrn && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">MRN</span>
                    <span className="font-medium text-slate-800">{selectedPatient.mrn}</span>
                  </div>
                )}
                {selectedPatient.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">DOB</span>
                    <span className="font-medium text-slate-800">{selectedPatient.date_of_birth}</span>
                  </div>
                )}
                {selectedPatient.gender && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gender</span>
                    <span className="font-medium text-slate-800 capitalize">{selectedPatient.gender}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-400">Procedures</span>
                  <span className="font-semibold text-slate-900">{procedures.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consents on file</span>
                  <span className="font-semibold text-slate-900">{consents.length}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader
            title="Procedure Timeline"
            subtitle={patientId ? `${procedures.length} procedure${procedures.length !== 1 ? 's' : ''} found` : 'Select a patient to view their history'}
          />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : !patientId ? (
            <p className="text-sm text-slate-400">Select a patient from the panel on the left.</p>
          ) : procedures.length === 0 ? (
            <p className="text-sm text-slate-500">No procedures found for this patient.</p>
          ) : (
            <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-full before:w-0.5 before:bg-slate-200">
              {procedures.map((proc) => (
                <div key={proc.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-4 top-3 h-3 w-3 rounded-full border-2 border-white shadow ${
                      proc.status === 'signed' ? 'bg-emerald-400' :
                      proc.status === 'completed' ? 'bg-sky-400' :
                      proc.status === 'in-progress' ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{proc.title || 'Untitled procedure'}</p>
                        <p className="text-xs text-slate-400">{proc.procedure_date}</p>
                      </div>
                      <Badge label={formatStatus(proc.status)} tone={statusTone(proc.status)} />
                    </div>

                    <div className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                      {proc.specialty_id && (
                        <span>
                          <span className="text-slate-400">Specialty: </span>
                          <span className="font-medium text-slate-700">{specialtyMap[proc.specialty_id] ?? 'Unknown'}</span>
                        </span>
                      )}
                      {proc.physician_id && (
                        <span>
                          <span className="text-slate-400">Physician: </span>
                          <span className="font-medium text-slate-700">{physicianMap[proc.physician_id] ?? 'Unknown'}</span>
                        </span>
                      )}
                      {consentsByProcedure[proc.id] ? (
                        <span>
                          <span className="text-slate-400">Consents: </span>
                          <span className="font-medium text-emerald-600">{consentsByProcedure[proc.id]} on file</span>
                        </span>
                      ) : (
                        <span className="text-amber-500">No consents on file</span>
                      )}
                      {proc.quality_score !== null && proc.quality_score !== undefined && (
                        <span>
                          <span className="text-slate-400">Quality score: </span>
                          <span className="font-medium text-slate-700">{proc.quality_score}/10</span>
                        </span>
                      )}
                    </div>

                    {proc.findings && (
                      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <p className="mb-1 font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Findings</p>
                        <p className="line-clamp-2">{proc.findings}</p>
                      </div>
                    )}

                    {proc.impression && (
                      <div className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-slate-600">
                        <p className="mb-1 font-semibold text-sky-400 uppercase tracking-wide text-[10px]">Impression</p>
                        <p className="line-clamp-2">{proc.impression}</p>
                      </div>
                    )}

                    {proc.complications && (
                      <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        <p className="mb-1 font-semibold text-rose-400 uppercase tracking-wide text-[10px]">Complications</p>
                        <p className="line-clamp-2">{proc.complications}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
