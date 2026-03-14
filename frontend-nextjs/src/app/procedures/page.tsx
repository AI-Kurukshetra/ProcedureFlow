'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { KeyValueEditor } from '@/components/ui/KeyValueEditor';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const emptyProcedure = {
  title: '',
  patient_id: '',
  physician_id: '',
  template_id: '',
  specialty_id: '',
  organization_id: '',
  status: 'draft',
  procedure_date: new Date().toISOString().slice(0, 10),
  notes: '',
  findings: '',
  impression: '',
  complications: '',
};

export default function ProceduresPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [clinicalGuidelines, setClinicalGuidelines] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState<any>({ ...emptyProcedure });
  const [documentation, setDocumentation] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [billingCodes, setBillingCodes] = useState<any[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [quickAddOpen, setQuickAddOpen] = useState<'patient' | 'specialty' | 'template' | null>(null);
  const [quickAddForm, setQuickAddForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [initialLoading, setInitialLoading] = useState(true);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const autosaveDocTimer = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [procedureStarted, setProcedureStarted] = useState(false);

  const loadLists = async () => {
    const [pRes, uRes, tRes, sRes, schRes, gRes, cfRes, oRes] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('users').select('*'),
      supabase.from('templates').select('*'),
      supabase.from('specialties').select('*'),
      supabase.from('schedules').select('*').order('scheduled_date', { ascending: true }),
      supabase.from('clinical_guidelines').select('*').eq('is_active', true),
      supabase.from('custom_fields').select('*').eq('applies_to', 'procedure').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('organizations').select('*').order('name', { ascending: true }),
    ]);
    setPatients(pRes.data ?? []);
    setUsers(uRes.data ?? []);
    setTemplates(tRes.data ?? []);
    setSpecialties(sRes.data ?? []);
    setSchedules(schRes.data ?? []);
    setClinicalGuidelines(gRes.data ?? []);
    setCustomFields(cfRes.data ?? []);
    setOrganizations(oRes.data ?? []);
  };

  const toggleQuickAdd = (type: 'patient' | 'specialty' | 'template') => {
    setQuickAddOpen((prev) => (prev === type ? null : type));
    setQuickAddForm({});
  };

  const submitQuickAdd = async (type: 'patient' | 'specialty' | 'template') => {
    if (type === 'patient') {
      const payload = {
        first_name: quickAddForm.first_name,
        last_name: quickAddForm.last_name,
        email: quickAddForm.email || null,
        organization_id: form.organization_id || null,
      };
      const { data } = await supabase.from('patients').insert(payload).select('id').single();
      if (data?.id) setForm((prev: any) => ({ ...prev, patient_id: data.id }));
    }
    if (type === 'specialty') {
      const payload = { name: quickAddForm.name, code: quickAddForm.code || null };
      const { data } = await supabase.from('specialties').insert(payload).select('id').single();
      if (data?.id) setForm((prev: any) => ({ ...prev, specialty_id: data.id }));
    }
    if (type === 'template') {
      const payload = {
        name: quickAddForm.name,
        description: quickAddForm.description || null,
        organization_id: form.organization_id || null,
        specialty_id: form.specialty_id || null,
      };
      const { data } = await supabase.from('templates').insert(payload).select('id').single();
      if (data?.id) setForm((prev: any) => ({ ...prev, template_id: data.id }));
    }
    await loadLists();
    setQuickAddOpen(null);
    setQuickAddForm({});
  };

  const loadProcedures = async () => {
    const { data } = await supabase.from('procedures').select('*').order('created_at', { ascending: false });
    setProcedures(data ?? []);
    if (!selectedId && data?.[0]?.id) {
      setSelectedId(data[0].id);
    }
  };

  const loadProcedureDetails = async (procedureId: string) => {
    const [eventRes, transcriptRes, imageRes, medRes, equipRes, billingRes, staffRes, consentRes, reportRes, qualityRes] =
      await Promise.all([
        supabase.from('procedure_events').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('procedure_transcripts').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('procedure_images').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('procedure_medications').select('*, medications(name)').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('procedure_equipment').select('*, equipment(name)').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('billing_codes').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('staff_assignments').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('consents').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('reports').select('*').eq('procedure_id', procedureId).order('created_at', { ascending: false }),
        supabase.from('quality_metrics').select('*').eq('procedure_id', procedureId).order('recorded_at', { ascending: false }),
      ]);

    setEvents(eventRes.data ?? []);
    setTranscripts(transcriptRes.data ?? []);
    setImages(imageRes.data ?? []);
    setMedications(medRes.data ?? []);
    setEquipment(equipRes.data ?? []);
    setBillingCodes(billingRes.data ?? []);
    setStaffAssignments(staffRes.data ?? []);
    setConsents(consentRes.data ?? []);
    setReports(reportRes.data ?? []);
    setQualityMetrics(qualityRes.data ?? []);
  };

  useEffect(() => {
    const boot = async () => {
      setInitialLoading(true);
      await Promise.all([loadLists(), loadProcedures()]);
      setInitialLoading(false);
    };
    boot();

    return () => {
      stopVoice();
    };
  }, []);

  useEffect(() => {
    const selected = procedures.find((item) => item.id === selectedId);
    if (selected) {
      setForm({ ...selected });
      setDocumentation(selected.documentation_data ?? {});
      loadProcedureDetails(selected.id);
      supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_type', 'procedure')
        .eq('entity_id', selected.id)
        .then(({ data }) => {
          const next: Record<string, any> = {};
          (data ?? []).forEach((item) => {
            next[item.custom_field_id] = item.value?.value ?? item.value ?? '';
          });
          setCustomValues(next);
        });
    }
  }, [selectedId, procedures]);

  useEffect(() => {
    if (!form.organization_id) return;
    supabase
      .from('custom_fields')
      .select('*')
      .eq('applies_to', 'procedure')
      .eq('is_active', true)
      .or(`organization_id.eq.${form.organization_id},organization_id.is.null`)
      .order('created_at', { ascending: true })
      .then(({ data }) => setCustomFields(data ?? []));
  }, [form.organization_id]);

  useEffect(() => {
    if (!form.template_id) return;
    const selectedTemplate = templates.find((template) => template.id === form.template_id);
    if (!selectedTemplate) return;
    setForm((prev: any) => {
      const next = { ...prev };
      if (!prev.specialty_id && selectedTemplate.specialty_id) next.specialty_id = selectedTemplate.specialty_id;
      if (!prev.organization_id && selectedTemplate.organization_id) next.organization_id = selectedTemplate.organization_id;
      return next;
    });
  }, [form.template_id, templates]);

  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`procedures-${selectedId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'procedure_events', filter: `procedure_id=eq.${selectedId}` },
        () => loadProcedureDetails(selectedId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'procedure_transcripts', filter: `procedure_id=eq.${selectedId}` },
        () => loadProcedureDetails(selectedId)
      )
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (state === 'CHANNEL_ERROR') setRealtimeStatus('disconnected');
        else setRealtimeStatus('connecting');
      });

    return () => {
      supabase.removeChannel(channel);
      stopVoice();
    };
  }, [selectedId]);

  const createProcedure = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('procedures').insert({ ...form, documentation_data: documentation }).select('*').single();
    if (error) {
      setStatus(error.message);
    } else if (data) {
      await saveCustomFields(data.id);
      setLastSavedAt(new Date().toISOString());
      setStatus('Procedure created.');
      setSelectedId(data.id);
      await loadProcedures();
    }
    setSaving(false);
  };

  const updateProcedure = async (payload?: any) => {
    if (!selectedId) return;
    const updatePayload = payload ?? { ...form, documentation_data: documentation };
    await supabase.from('procedures').update(updatePayload).eq('id', selectedId);
    await supabase.from('procedure_events').insert({
      procedure_id: selectedId,
      event_type: 'documentation_update',
      payload: { updated_at: new Date().toISOString() },
    });
    await saveCustomFields(selectedId);
    setLastSavedAt(new Date().toISOString());
    setStatus('Saved updates.');
    await loadProcedures();
  };

  const saveCustomFields = async (procedureId: string) => {
    if (customFields.length === 0) return;
    await supabase.from('custom_field_values').delete().eq('entity_type', 'procedure').eq('entity_id', procedureId);
    const payload = customFields.map((field) => ({
      custom_field_id: field.id,
      entity_type: 'procedure',
      entity_id: procedureId,
      value: { value: customValues[field.id] ?? '' },
    }));
    await supabase.from('custom_field_values').insert(payload);
  };

  const scheduleToProcedure = async (schedule: any) => {
    const insertPayload = {
      title: schedule.procedure_type,
      patient_id: schedule.patient_id,
      physician_id: schedule.physician_id,
      template_id: schedule.template_id,
      specialty_id: schedule.specialty_id,
      organization_id: schedule.organization_id,
      status: 'draft',
      procedure_date: schedule.scheduled_date,
      notes: schedule.notes,
    };
    const { data } = await supabase.from('procedures').insert(insertPayload).select('*').single();
    if (data?.id) {
      setSelectedId(data.id);
      await loadProcedures();
    }
  };

  const autosaveDocumentation = (nextDoc: any) => {
    setDocumentation(nextDoc);
    if (!selectedId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      updateProcedure({ documentation_data: nextDoc });
    }, 1200);
  };

  const addTranscript = async (text: string) => {
    if (!selectedId || !text) return;
    await supabase.from('procedure_transcripts').insert({
      procedure_id: selectedId,
      source: 'speech',
      transcript: text,
    });
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText) {
        addTranscript(finalText.trim());
      }
    };
    recognition.onerror = () => {
      setVoiceError('Mic error. Please check permissions.');
      setVoiceActive(false);
    };
    recognition.onend = () => setVoiceActive(false);
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceActive(true);
    setVoiceError(null);
    setStatus('Voice capture started.');
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setVoiceActive(false);
    setStatus('Voice capture stopped.');
  };

  const startProcedure = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      startVoice();
      setProcedureStarted(true);
      setStatus('Procedure started. Voice capture active.');
    } catch (err) {
      setVoiceError('Microphone permission denied or unavailable.');
      setProcedureStarted(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!selectedId) return;
    const filePath = `${selectedId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('procedure-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) {
      setStatus(uploadError.message);
      return;
    }
    await supabase.from('procedure_images').insert({
      procedure_id: selectedId,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      captured_at: new Date().toISOString(),
    });
    await loadProcedureDetails(selectedId);
  };

  const addMediaAnnotation = async (imageId: string, note: string) => {
    if (!note.trim()) return;
    await supabase.from('procedure_events').insert({
      procedure_id: selectedId,
      event_type: 'image_annotation',
      payload: { image_id: imageId, note, annotated_at: new Date().toISOString() },
    });
    await loadProcedureDetails(selectedId);
    setStatus('Annotation saved.');
  };

  const addMedicationUsage = async (payload: any) => {
    if (!selectedId) return;
    await supabase.from('procedure_medications').insert({ procedure_id: selectedId, ...payload });
    await loadProcedureDetails(selectedId);
  };

  const addEquipmentUsage = async (payload: any) => {
    if (!selectedId) return;
    await supabase.from('procedure_equipment').insert({ procedure_id: selectedId, ...payload });
    await loadProcedureDetails(selectedId);
  };

  const addBillingCode = async (payload: any) => {
    if (!selectedId) return;
    await supabase.from('billing_codes').insert({ procedure_id: selectedId, ...payload });
    await loadProcedureDetails(selectedId);
  };

  const addStaffAssignment = async (payload: any) => {
    if (!selectedId) return;
    await supabase.from('staff_assignments').insert({ procedure_id: selectedId, ...payload });
    await loadProcedureDetails(selectedId);
  };

  const addConsent = async (payload: any) => {
    if (!selectedId) return;
    await supabase.from('consents').insert({ procedure_id: selectedId, ...payload });
    await loadProcedureDetails(selectedId);
  };

  const generateReport = async () => {
    if (!selectedId) return;
    await supabase.from('reports').insert({
      procedure_id: selectedId,
      type: 'pdf',
      content: `Procedure report generated on ${new Date().toISOString()}`,
      generated_by: form.physician_id || null,
    });
    await loadProcedureDetails(selectedId);
  };

  const addQualityMetric = async (payload: any) => {
    if (!selectedId) return;
    await supabase.from('quality_metrics').insert({ procedure_id: selectedId, ...payload });
    await loadProcedureDetails(selectedId);
  };

  // autosave core documentation text + structured doc
  useEffect(() => {
    if (!selectedId) return;
    if (autosaveDocTimer.current) clearTimeout(autosaveDocTimer.current);
    autosaveDocTimer.current = setTimeout(() => {
      updateProcedure({
        notes: form.notes,
        findings: form.findings,
        impression: form.impression,
        complications: form.complications,
        documentation_data: documentation,
      });
    }, 1200);
    return () => {
      if (autosaveDocTimer.current) clearTimeout(autosaveDocTimer.current);
    };
  }, [form.notes, form.findings, form.impression, form.complications, documentation, selectedId]);

  const selectedSpecialtyGuidelines = clinicalGuidelines.filter((g) => g.specialty_id === form.specialty_id);
  const statusTone = form.status === 'completed' || form.status === 'signed' ? 'emerald' : form.status === 'in-progress' ? 'amber' : 'slate';
  const checklist = [
    { label: 'Patient selected', done: Boolean(form.patient_id) },
    { label: 'Template selected', done: Boolean(form.template_id) },
    { label: 'Documentation started', done: Boolean(form.notes || form.findings || form.impression) },
    { label: 'Consent captured', done: consents.length > 0 },
    { label: 'Staff assigned', done: staffAssignments.length > 0 },
  ];


  if (initialLoading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <RoleGuard roles={['admin', 'physician', 'nurse', 'technician']}>
      <SectionHeader
        title="Real-time Procedure Documentation"
        description="Live documentation with autosave, voice capture, imaging, and compliance tracking."
        action={
          <div className="flex items-center gap-3">
            <Badge label={form.status ?? 'draft'} tone={statusTone as any} />
            <Button variant="secondary" onClick={() => setForm({ ...emptyProcedure })}>New procedure</Button>
          </div>
        }
      />
      <Card className="mb-6">
        <CardHeader title="Workflow Steps" subtitle="Jump between key documentation stages." />
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { label: 'Overview', id: 'overview' },
            { label: 'Documentation', id: 'documentation' },
            { label: 'Voice/Guidelines', id: 'voice' },
            { label: 'Media & Events', id: 'media' },
            { label: 'Medications & Equipment', id: 'meds' },
            { label: 'Billing & Consent', id: 'billing' },
            { label: 'Reports & Quality', id: 'reports' },
            { label: 'Scheduling', id: 'scheduling' },
          ].map((step) => (
            <a key={step.id} href={`#${step.id}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              {step.label}
            </a>
          ))}
        </div>
      </Card>

      <div id="overview" className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <div id="documentation">
        <Card>
          <CardHeader title="Procedure Overview" subtitle="Create or update procedure context." />
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-600">
              Selected procedure
              <Select className="mt-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                <option value="">Select procedure</option>
                {procedures.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · {item.procedure_date}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Title
              <Input className="mt-2" value={form.title ?? ''} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Patient</span>
                  <Button type="button" variant="ghost" className="h-7 px-2 text-xs hover:bg-transparent" onClick={() => toggleQuickAdd('patient')}>
                    <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </Button>
                </div>
                <Select className="mt-2" value={form.patient_id ?? ''} onChange={(event) => setForm({ ...form, patient_id: event.target.value })}>
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </Select>
                {quickAddOpen === 'patient' ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3">
                      <Input
                        placeholder="First name"
                        value={quickAddForm.first_name ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, first_name: event.target.value }))}
                      />
                      <Input
                        placeholder="Last name"
                        value={quickAddForm.last_name ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, last_name: event.target.value }))}
                      />
                      <Input
                        placeholder="Email (optional)"
                        value={quickAddForm.email ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, email: event.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => submitQuickAdd('patient')}>
                          Save
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setQuickAddOpen(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </label>
              <label className="text-sm font-medium text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Physician</span>
                  <Button type="button" variant="ghost" className="h-7 px-2 text-xs hover:bg-transparent">
                  </Button>
                </div>
                <Select className="mt-2" value={form.physician_id ?? ''} onChange={(event) => setForm({ ...form, physician_id: event.target.value })}>
                  <option value="">Select physician</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Specialty</span>
                  <Button type="button" variant="ghost" className="h-7 px-2 text-xs hover:bg-transparent" onClick={() => toggleQuickAdd('specialty')}>
                    <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </Button>
                </div>
                <Select className="mt-2" value={form.specialty_id ?? ''} onChange={(event) => setForm({ ...form, specialty_id: event.target.value })}>
                  <option value="">Select specialty</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                {quickAddOpen === 'specialty' ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3">
                      <Input
                        placeholder="Specialty name"
                        value={quickAddForm.name ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <Input
                        placeholder="Code (optional)"
                        value={quickAddForm.code ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, code: event.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => submitQuickAdd('specialty')}>
                          Save
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setQuickAddOpen(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </label>
              <label className="text-sm font-medium text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Template</span>
                  <Button type="button" variant="ghost" className="h-7 px-2 text-xs hover:bg-transparent" onClick={() => toggleQuickAdd('template')}>
                    <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </Button>
                </div>
                <Select className="mt-2" value={form.template_id ?? ''} onChange={(event) => setForm({ ...form, template_id: event.target.value })}>
                  <option value="">Select template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
                {quickAddOpen === 'template' ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3">
                      <Input
                        placeholder="Template name"
                        value={quickAddForm.name ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={quickAddForm.description ?? ''}
                        onChange={(event) => setQuickAddForm((prev) => ({ ...prev, description: event.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => submitQuickAdd('template')}>
                          Save
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setQuickAddOpen(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                Status
                <Select className="mt-2" value={form.status ?? 'draft'} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="signed">Signed</option>
                </Select>
              </label>
              <label className="text-sm font-medium text-slate-600">
                Procedure date
                <Input className="mt-2" type="date" value={form.procedure_date ?? ''} onChange={(event) => setForm({ ...form, procedure_date: event.target.value })} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                Organization ID
                <Select className="mt-2" value={form.organization_id ?? ''} onChange={(event) => setForm({ ...form, organization_id: event.target.value })}>
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={createProcedure} disabled={saving}>Create procedure</Button>
              <Button variant="secondary" onClick={() => updateProcedure()}>Save updates</Button>
            </div>
            {status ? <p className="text-sm text-slate-500">{status}</p> : null}
          </div>
        </Card>
        </div>

        <Card>
          <CardHeader title="Live Documentation" subtitle="Autosave narrative documentation and observations." />
          <div className="grid gap-4">
            {lastSavedAt ? (
              <p className="text-xs text-slate-400">Last saved at {new Date(lastSavedAt).toLocaleTimeString()}</p>
            ) : null}
            <Textarea value={form.notes ?? ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Procedure notes" />
            <Textarea value={form.findings ?? ''} onChange={(event) => setForm({ ...form, findings: event.target.value })} placeholder="Findings" />
            <Textarea value={form.impression ?? ''} onChange={(event) => setForm({ ...form, impression: event.target.value })} placeholder="Impression" />
            <Textarea value={form.complications ?? ''} onChange={(event) => setForm({ ...form, complications: event.target.value })} placeholder="Complications" />
            <KeyValueEditor value={documentation ?? {}} onChange={(next) => autosaveDocumentation(next)} />
            {customFields.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Custom Procedure Fields</p>
                <div className="mt-3 grid gap-3">
                  {customFields.map((field) => (
                    <label key={field.id} className="block text-sm font-medium text-slate-600">
                      {field.name}
                      <div className="mt-2">
                        {field.field_type === 'textarea' || field.field_type === 'json' ? (
                          field.field_type === 'json' ? (
                            <KeyValueEditor
                              value={customValues[field.id] ?? {}}
                              onChange={(next) => setCustomValues((prev) => ({ ...prev, [field.id]: next }))}
                            />
                          ) : (
                          <Textarea
                            value={customValues[field.id] ?? ''}
                            onChange={(event) => setCustomValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
                          />
                          )
                        ) : field.field_type === 'select' ? (
                          <Select
                            value={customValues[field.id] ?? ''}
                            onChange={(event) => setCustomValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
                          >
                            <option value="">Select option</option>
                            {(field.options ?? []).map((option: any) => (
                              <option key={option.value ?? option} value={option.value ?? option}>
                                {option.label ?? option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            type={field.field_type === 'number' ? 'number' : 'text'}
                            value={customValues[field.id] ?? ''}
                            onChange={(event) => setCustomValues((prev) => ({ ...prev, [field.id]: event.target.value }))}
                          />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="h-10 px-4"
                onClick={() => {
                  stopVoice();
                  updateProcedure();
                  setProcedureStarted(false);
                }}
              >
                Save procedure
              </Button>
              {procedureStarted ? (
                <Button variant="secondary" className="h-10 px-4" onClick={stopVoice} disabled={!voiceActive}>
                  Stop voice
                </Button>
              ) : (
                <Button variant="secondary" className="h-10 px-4" onClick={startProcedure}>
                  Start procedure
                </Button>
              )}
            </div>
            {voiceError ? <p className="text-xs text-rose-500">{voiceError}</p> : null}
          </div>
        </Card>
      </div>

      <div id="voice" className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Voice-to-Text Transcripts" subtitle="Captured speech segments." />
          <div className="space-y-3 text-sm text-slate-600">
            {transcripts.length === 0 ? 'No transcripts yet.' : transcripts.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">{t.transcript}</div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Clinical Decision Support" subtitle="Guidelines by specialty." />
          <div className="space-y-3 text-sm text-slate-600">
            {selectedSpecialtyGuidelines.length === 0 ? (
              <p>No guidelines configured for this specialty.</p>
            ) : (
              selectedSpecialtyGuidelines.map((g) => (
                <div key={g.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{g.title}</p>
                    <Badge label={g.severity ?? 'info'} tone={g.severity === 'high' ? 'rose' : 'amber'} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{g.summary}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div id="media" className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Procedure Images" subtitle="Upload images and videos for procedure documentation." />
          <input type="file" accept="image/*,video/*" onChange={(event) => event.target.files?.[0] && uploadImage(event.target.files[0])} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {images.length === 0 ? 'No media yet.' : images.map((img) => {
              const { data } = supabase.storage.from('procedure-media').getPublicUrl(img.file_path);
              const isVideo = img.mime_type?.startsWith('video');
              return (
                <div key={img.id} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {data?.publicUrl ? (
                        isVideo ? (
                          <video src={data.publicUrl} controls className="h-24 w-32 rounded-xl bg-slate-100 object-cover" />
                        ) : (
                          <img src={data.publicUrl} alt={img.file_name} className="h-24 w-32 rounded-xl object-cover" />
                        )
                      ) : null}
                      <div>
                        <p className="font-semibold text-slate-800">{img.file_name}</p>
                        <p className="text-xs text-slate-400">{img.captured_at}</p>
                        <p className="text-xs text-slate-500">{img.mime_type}</p>
                      </div>
                    </div>
                    <Badge label="Captured" tone="slate" />
                  </div>
                  <div className="grid gap-2">
                    <Textarea
                      placeholder="Add an annotation or finding for this media"
                      value={(img.annotation_note as string) ?? ''}
                      onChange={(e) => setImages((prev) => prev.map((m) => (m.id === img.id ? { ...m, annotation_note: e.target.value } : m)))}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => addMediaAnnotation(img.id, (img.annotation_note as string) ?? '')}
                      >
                        Save annotation
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Procedure Timeline" subtitle="Multi-device synchronization feed." />
          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 text-sm text-slate-600">
            {events.length === 0
              ? 'No events yet.'
              : events.map((evt) => {
                const created = evt.created_at ? new Date(evt.created_at) : null;
                const payloadTime =
                  (evt.payload as any)?.updated_at ? new Date((evt.payload as any).updated_at) : null;
                const formatRelative = (date: Date | null) => {
                  if (!date) return '';
                  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
                  if (diffSec < 60) return 'just now';
                  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
                  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
                  return `${Math.floor(diffSec / 86400)} day${Math.floor(diffSec / 86400) === 1 ? '' : 's'} ago`;
                };
                const relativeTime = formatRelative(created);
                const summary =
                  evt.event_type === 'documentation_update' && payloadTime
                    ? `Documentation saved at ${payloadTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : evt.event_type === 'image_annotation'
                    ? `Annotated media ${(evt.payload as any)?.image_id ?? ''}`
                      : evt.event_type;
                  const detail =
                    evt.event_type === 'documentation_update' && payloadTime
                      ? null
                      : JSON.stringify(evt.payload, null, 2);

                  return (
                      <div key={evt.id} className="relative border-l border-slate-200 pl-4">
                        <div className="absolute -left-2 top-1 h-3 w-3 rounded-full bg-slate-400" />
                        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">{summary}</p>
                              {detail ? (
                                <pre className="whitespace-pre-wrap text-xs text-slate-500">{detail}</pre>
                              ) : null}
                            </div>
                          <div className="text-right text-xs text-slate-500">{relativeTime}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Completion Checklist" subtitle="Ensure key steps are captured." />
          <div className="space-y-2 text-sm text-slate-600">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <span>{item.label}</span>
                <Badge label={item.done ? 'Done' : 'Pending'} tone={item.done ? 'emerald' : 'amber'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div id="meds" className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Medication Tracking" subtitle="Document medications administered during procedure." />
          <MedicationForm onAdd={addMedicationUsage} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {medications.length === 0 ? 'No medication records yet.' : medications.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <strong>{m.medications?.name ?? 'Medication'}</strong> {m.dosage} {m.unit}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Equipment Utilization" subtitle="Log equipment usage for maintenance and inventory." />
          <EquipmentForm onAdd={addEquipmentUsage} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {equipment.length === 0 ? 'No equipment records yet.' : equipment.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <strong>{e.equipment?.name ?? 'Equipment'}</strong> {e.notes}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div id="billing" className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Billing Codes" subtitle="CPT and ICD code tracking." />
          <BillingForm onAdd={addBillingCode} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {billingCodes.length === 0 ? 'No billing codes yet.' : billingCodes.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                {b.cpt_code} / {b.icd_code} · {b.status}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Staff Assignments" subtitle="Assign staff and check-in status." />
          <StaffForm users={users} onAdd={addStaffAssignment} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {staffAssignments.length === 0 ? 'No staff assigned yet.' : staffAssignments.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                {s.user_id} · {s.role}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Digital Consent" subtitle="Patient consent capture." />
          <ConsentForm patients={patients} onAdd={addConsent} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {consents.length === 0 ? 'No consents yet.' : consents.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                {c.consent_type} · {c.signed_at ?? 'Pending'}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div id="reports" className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Automated Report Generation" subtitle="Generate structured outputs in PDF/HL7 formats." />
          <div className="flex gap-3">
            <Button onClick={generateReport}>Generate report</Button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {reports.length === 0 ? 'No reports yet.' : reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                {r.type} · {r.created_at}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Quality Metrics" subtitle="Capture quality indicators and outcomes." />
          <QualityMetricForm onAdd={addQualityMetric} />
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {qualityMetrics.length === 0 ? 'No quality metrics yet.' : qualityMetrics.map((q) => (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                {q.metric_type} · {q.value}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div id="scheduling" className="mt-8">
        <Card>
          <CardHeader title="Scheduling Integration" subtitle="Upcoming procedures from scheduling system." />
          <div className="grid gap-3">
            {schedules.length === 0 ? 'No schedules available.' : schedules.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-800">{s.procedure_type}</p>
                  <p className="text-xs text-slate-500">{s.scheduled_date} · {s.scheduled_time}</p>
                </div>
                <Button variant="secondary" onClick={() => scheduleToProcedure(s)}>Create procedure</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </RoleGuard>
    </AppShell>
  );
}

type MedicationPayload = { medication_id: string; dosage: string; unit: string; route: string; notes: string };
type EquipmentPayload = { equipment_id: string; usage_duration_minutes: string; notes: string };
type BillingPayload = { cpt_code: string; icd_code: string; description: string; status: 'suggested' | 'confirmed' | 'billed' };
type StaffPayload = { user_id: string; role: string; notes: string };
type StaffUser = { id: string; first_name?: string; last_name?: string };

function MedicationForm({ onAdd }: { onAdd: (payload: MedicationPayload) => void }) {
  const [payload, setPayload] = useState<MedicationPayload>({ medication_id: '', dosage: '', unit: 'mg', route: '', notes: '' });
  return (
    <div className="grid gap-3">
      <Input placeholder="Medication ID" value={payload.medication_id} onChange={(e) => setPayload({ ...payload, medication_id: e.target.value })} />
      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Dosage" value={payload.dosage} onChange={(e) => setPayload({ ...payload, dosage: e.target.value })} />
        <Input placeholder="Unit" value={payload.unit} onChange={(e) => setPayload({ ...payload, unit: e.target.value })} />
      </div>
      <Input placeholder="Route" value={payload.route} onChange={(e) => setPayload({ ...payload, route: e.target.value })} />
      <Textarea placeholder="Notes" value={payload.notes} onChange={(e) => setPayload({ ...payload, notes: e.target.value })} />
      <Button onClick={() => onAdd(payload)}>Add medication</Button>
    </div>
  );
}

function EquipmentForm({ onAdd }: { onAdd: (payload: EquipmentPayload) => void }) {
  const [payload, setPayload] = useState<EquipmentPayload>({ equipment_id: '', usage_duration_minutes: '', notes: '' });
  return (
    <div className="grid gap-3">
      <Input placeholder="Equipment ID" value={payload.equipment_id} onChange={(e) => setPayload({ ...payload, equipment_id: e.target.value })} />
      <Input placeholder="Usage duration (minutes)" value={payload.usage_duration_minutes} onChange={(e) => setPayload({ ...payload, usage_duration_minutes: e.target.value })} />
      <Textarea placeholder="Notes" value={payload.notes} onChange={(e) => setPayload({ ...payload, notes: e.target.value })} />
      <Button onClick={() => onAdd(payload)}>Log equipment usage</Button>
    </div>
  );
}

function BillingForm({ onAdd }: { onAdd: (payload: BillingPayload) => void }) {
  const [payload, setPayload] = useState<BillingPayload>({ cpt_code: '', icd_code: '', description: '', status: 'suggested' });
  return (
    <div className="grid gap-3">
      <Input placeholder="CPT code" value={payload.cpt_code} onChange={(e) => setPayload({ ...payload, cpt_code: e.target.value })} />
      <Input placeholder="ICD code" value={payload.icd_code} onChange={(e) => setPayload({ ...payload, icd_code: e.target.value })} />
      <Textarea placeholder="Description" value={payload.description} onChange={(e) => setPayload({ ...payload, description: e.target.value })} />
      <Select value={payload.status} onChange={(e) => setPayload({ ...payload, status: e.target.value })}>
        <option value="suggested">Suggested</option>
        <option value="confirmed">Confirmed</option>
        <option value="billed">Billed</option>
      </Select>
      <Button onClick={() => onAdd(payload)}>Add billing code</Button>
    </div>
  );
}

function StaffForm({ users, onAdd }: { users: StaffUser[]; onAdd: (payload: StaffPayload) => void }) {
  const [payload, setPayload] = useState<StaffPayload>({ user_id: '', role: 'nurse', notes: '' });
  return (
    <div className="grid gap-3">
      <Select value={payload.user_id} onChange={(e) => setPayload({ ...payload, user_id: e.target.value })}>
        <option value="">Select staff</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.first_name} {u.last_name}
          </option>
        ))}
      </Select>
      <Select value={payload.role} onChange={(e) => setPayload({ ...payload, role: e.target.value })}>
        <option value="primary_physician">Primary physician</option>
        <option value="assisting_physician">Assisting physician</option>
        <option value="nurse">Nurse</option>
        <option value="technician">Technician</option>
        <option value="anesthesiologist">Anesthesiologist</option>
        <option value="scrub_tech">Scrub tech</option>
      </Select>
      <Textarea placeholder="Notes" value={payload.notes} onChange={(e) => setPayload({ ...payload, notes: e.target.value })} />
      <Button onClick={() => onAdd(payload)}>Assign staff</Button>
    </div>
  );
}

function ConsentForm({ patients, onAdd }: { patients: any[]; onAdd: (payload: any) => void }) {
  const [payload, setPayload] = useState({ patient_id: '', consent_type: 'Procedure Consent', signature_data: '' });
  return (
    <div className="grid gap-3">
      <Select value={payload.patient_id} onChange={(e) => setPayload({ ...payload, patient_id: e.target.value })}>
        <option value="">Select patient</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.first_name} {p.last_name}
          </option>
        ))}
      </Select>
      <Input placeholder="Consent type" value={payload.consent_type} onChange={(e) => setPayload({ ...payload, consent_type: e.target.value })} />
      <Textarea placeholder="Signature (typed)" value={payload.signature_data} onChange={(e) => setPayload({ ...payload, signature_data: e.target.value })} />
      <Button onClick={() => onAdd({ ...payload, signed_at: new Date().toISOString() })}>Capture consent</Button>
    </div>
  );
}

function QualityMetricForm({ onAdd }: { onAdd: (payload: any) => void }) {
  const [payload, setPayload] = useState({ metric_type: '', value: '', target: '' });
  return (
    <div className="grid gap-3">
      <Input placeholder="Metric type" value={payload.metric_type} onChange={(e) => setPayload({ ...payload, metric_type: e.target.value })} />
      <Input placeholder="Value" value={payload.value} onChange={(e) => setPayload({ ...payload, value: e.target.value })} />
      <Input placeholder="Target" value={payload.target} onChange={(e) => setPayload({ ...payload, target: e.target.value })} />
      <Button onClick={() => onAdd(payload)}>Add metric</Button>
    </div>
  );
}
