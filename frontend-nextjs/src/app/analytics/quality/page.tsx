'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card, CardHeader } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

type Procedure = {
  id: string;
  status: string;
  quality_score: number | null;
  procedure_date: string;
  specialty_id: string | null;
  complications: string | null;
};

type Metric = {
  id: string;
  metric_type: string;
  value: number;
  target: number | null;
  recorded_at: string;
  procedure_id: string | null;
};

type Specialty = { id: string; name: string };

export default function QualityDashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [mRes, pRes, sRes] = await Promise.all([
        supabase.from('quality_metrics').select('*').order('recorded_at', { ascending: false }),
        supabase.from('procedures').select('id,status,quality_score,procedure_date,specialty_id,complications').order('procedure_date', { ascending: false }),
        supabase.from('specialties').select('id,name').order('name', { ascending: true }),
      ]);
      setMetrics(mRes.data ?? []);
      setProcedures(pRes.data ?? []);
      setSpecialties(sRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // Computed stats
  const totalProcedures = procedures.length;
  const completedOrSigned = procedures.filter((p) => p.status === 'completed' || p.status === 'signed').length;
  const completionRate = totalProcedures ? Math.round((completedOrSigned / totalProcedures) * 100) : 0;

  const scoredProcedures = procedures.filter((p) => p.quality_score !== null && p.quality_score !== undefined);
  const averageScore = scoredProcedures.length
    ? (scoredProcedures.reduce((sum, p) => sum + Number(p.quality_score), 0) / scoredProcedures.length).toFixed(1)
    : '—';

  const withComplications = procedures.filter((p) => p.complications && p.complications.trim().length > 0).length;
  const complicationRate = totalProcedures ? ((withComplications / totalProcedures) * 100).toFixed(1) : '0';

  const metricsAboveTarget = metrics.filter((m) => m.target !== null && Number(m.value) >= Number(m.target)).length;
  const metricsTotal = metrics.filter((m) => m.target !== null).length;
  const targetAttainment = metricsTotal ? Math.round((metricsAboveTarget / metricsTotal) * 100) : 0;

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const p of procedures) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  }

  // Specialty breakdown
  const specialtyMap: Record<string, string> = {};
  for (const s of specialties) specialtyMap[s.id] = s.name;

  const specialtyCounts: Record<string, number> = {};
  for (const p of procedures) {
    if (p.specialty_id) {
      const name = specialtyMap[p.specialty_id] ?? 'Unknown';
      specialtyCounts[name] = (specialtyCounts[name] ?? 0) + 1;
    }
  }

  const statusTone = (status: string) => {
    if (status === 'signed' || status === 'completed') return 'emerald';
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

  if (loading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <RoleGuard roles={['admin', 'physician']}>
        <>
          <SectionHeader
            title="Quality Metrics Dashboard"
            description="Real-time analytics on procedure completion rates, quality indicators, outcome trends, and compliance performance across all specialties."
          />

          {/* KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader title="Average Quality Score" />
              <p className="text-3xl font-semibold text-slate-900">{averageScore}</p>
              <p className="mt-1 text-sm text-slate-500">Out of 10 · {scoredProcedures.length} scored procedures</p>
            </Card>
            <Card>
              <CardHeader title="Completion Rate" />
              <p className="text-3xl font-semibold text-slate-900">{completionRate}%</p>
              <p className="mt-1 text-sm text-slate-500">{completedOrSigned} of {totalProcedures} completed or signed</p>
            </Card>
            <Card>
              <CardHeader title="Complication Rate" />
              <p className="text-3xl font-semibold text-slate-900">{complicationRate}%</p>
              <p className="mt-1 text-sm text-slate-500">{withComplications} procedures with noted complications</p>
            </Card>
            <Card>
              <CardHeader title="Metric Target Attainment" />
              <p className="text-3xl font-semibold text-slate-900">{metricsTotal ? `${targetAttainment}%` : '—'}</p>
              <p className="mt-1 text-sm text-slate-500">{metricsAboveTarget} of {metricsTotal} KPIs at or above target</p>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Status Breakdown */}
            <Card>
              <CardHeader title="Procedures by Status" />
              {Object.keys(statusCounts).length === 0 ? (
                <p className="text-sm text-slate-500">No procedures tracked.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([status, count]) => (
                          <div key={status} className="flex items-center gap-3 text-sm">
                        <Badge label={formatStatus(status)} tone={statusTone(status) as any} />
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-slate-700"
                              style={{ width: `${Math.round((count / totalProcedures) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-10 text-right font-semibold text-slate-700">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Specialty Breakdown */}
            <Card>
              <CardHeader title="Procedures by Specialty" />
              {Object.keys(specialtyCounts).length === 0 ? (
                <p className="text-sm text-slate-500">No specialty data available.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(specialtyCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center gap-3 text-sm">
                        <span className="w-36 truncate font-medium text-slate-700">{name}</span>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-sky-400"
                              style={{ width: `${Math.round((count / totalProcedures) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-10 text-right font-semibold text-slate-700">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Quality Metrics List */}
            <Card>
              <CardHeader title="Latest Quality Metrics" />
              <div className="space-y-2 text-sm text-slate-600">
                {metrics.length === 0 ? (
                  <p>No metrics recorded yet. Add quality metrics from the Procedures module.</p>
                ) : (
                  metrics.slice(0, 10).map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{metric.metric_type}</p>
                        <p className="text-xs text-slate-400">{metric.recorded_at ? new Date(metric.recorded_at).toLocaleDateString() : '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {metric.target !== null && (
                          <span className="text-xs text-slate-400">Target: {metric.target}</span>
                        )}
                        <Badge
                          label={`${metric.value ?? 0}`}
                          tone={metric.target !== null && Number(metric.value) >= Number(metric.target) ? 'emerald' : 'amber'}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Quality Score Trend */}
            <Card>
              <CardHeader title="Quality Score Trend" />
              {scoredProcedures.length === 0 ? (
                <p className="text-sm text-slate-500">No scored procedures. Quality scores are set in procedure records.</p>
              ) : (
                <div className="space-y-2">
                  {scoredProcedures.slice(0, 10).map((proc) => (
                    <div key={proc.id} className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="w-24 shrink-0">{proc.procedure_date}</span>
                      <div className="flex-1 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${Math.min(100, Number(proc.quality_score ?? 0) * 10)}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-semibold text-slate-700">{proc.quality_score}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Outcome Indicators */}
            <Card>
              <CardHeader title="Outcome Indicators" />
              <div className="space-y-2 text-sm text-slate-600">
                {procedures.length === 0 ? (
                  <p>No procedures tracked.</p>
                ) : (
                  procedures.slice(0, 8).map((proc) => (
                    <div
                      key={proc.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{proc.procedure_date}</p>
                        <p className="text-xs text-slate-400">
                          {proc.specialty_id ? (specialtyMap[proc.specialty_id] ?? 'Unknown specialty') : 'No specialty'}
                          {proc.complications ? ' · has complications' : ''}
                        </p>
                      </div>
                      <Badge
                        label={formatStatus(proc.status)}
                        tone={statusTone(proc.status) as any}
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Completion Trend bars */}
            <Card>
              <CardHeader title="Completion Trend (last 10 procedures)" />
              {procedures.length === 0 ? (
                <p className="text-sm text-slate-500">No procedures tracked.</p>
              ) : (
                <div className="space-y-2">
                  {procedures.slice(0, 10).map((proc) => {
                    const done = proc.status === 'completed' || proc.status === 'signed';
                    return (
                      <div key={proc.id} className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="w-24 shrink-0">{proc.procedure_date}</span>
                        <div className="flex-1 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-amber-300'}`}
                            style={{ width: done ? '100%' : proc.status === 'in-progress' ? '60%' : '20%' }}
                          />
                        </div>
                        <span className="w-24 truncate text-right">{formatStatus(proc.status)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      </RoleGuard>
    </AppShell>
  );
}
