'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/AppShell';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'json';

type CustomField = {
  id: string;
  organization_id: string | null;
  name: string;
  group_name: string | null;
  display_order: number | null;
  field_type: FieldType;
  options: any;
  applies_to: 'patient' | 'procedure';
  is_required: boolean;
  is_active: boolean;
  visibility_rule: any;
};

const emptyForm = {
  name: '',
  group_name: '',
  display_order: '',
  field_type: 'text' as FieldType,
  applies_to: 'procedure' as 'patient' | 'procedure',
  is_required: 'false',
  is_active: 'true',
  options_raw: '',
  // visibility rule fields
  vis_field_name: '',
  vis_equals: '',
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Short text',
  textarea: 'Long text',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  json: 'JSON / key-value',
};

const fieldTypeTone = (ft: FieldType) => {
  const map: Record<FieldType, 'slate' | 'sky' | 'emerald' | 'amber' | 'rose'> = {
    text: 'slate', textarea: 'sky', number: 'amber', date: 'emerald', select: 'rose', json: 'slate',
  };
  return map[ft] ?? 'slate';
};

export default function CustomFieldsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [allFields, setAllFields] = useState<CustomField[]>([]); // for visibility rule picker
  const [form, setForm] = useState({ ...emptyForm });
  const [orgId, setOrgId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAppliesTo, setFilterAppliesTo] = useState<'all' | 'patient' | 'procedure'>('all');

  const loadFields = async () => {
    setLoading(true);
    const [fieldRes, orgRes] = await Promise.all([
      supabase.from('custom_fields').select('*').order('applies_to').order('group_name').order('display_order'),
      supabase.from('organizations').select('id,name').order('name'),
    ]);
    setFields(fieldRes.data ?? []);
    setAllFields(fieldRes.data ?? []);
    setOrganizations(orgRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadFields();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (field: CustomField) => {
    setEditingId(field.id);
    const rule = field.visibility_rule ?? {};
    setForm({
      name: field.name,
      group_name: field.group_name ?? '',
      display_order: field.display_order?.toString() ?? '',
      field_type: field.field_type,
      applies_to: field.applies_to,
      is_required: field.is_required ? 'true' : 'false',
      is_active: field.is_active ? 'true' : 'false',
      options_raw: field.options ? JSON.stringify(field.options, null, 2) : '',
      vis_field_name: rule.field_name ?? '',
      vis_equals: rule.equals ?? '',
    });
    setOrgId(field.organization_id ?? '');
  };

  const handleDuplicate = (field: CustomField) => {
    setEditingId(null);
    const rule = field.visibility_rule ?? {};
    setForm({
      name: `${field.name} (copy)`,
      group_name: field.group_name ?? '',
      display_order: '',
      field_type: field.field_type,
      applies_to: field.applies_to,
      is_required: field.is_required ? 'true' : 'false',
      is_active: 'true',
      options_raw: field.options ? JSON.stringify(field.options, null, 2) : '',
      vis_field_name: rule.field_name ?? '',
      vis_equals: rule.equals ?? '',
    });
    setOrgId(field.organization_id ?? '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom field? Existing values will also be removed.')) return;
    await supabase.from('custom_field_values').delete().eq('custom_field_id', id);
    await supabase.from('custom_fields').delete().eq('id', id);
    await loadFields();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Field name is required.'); return; }
    setSaving(true);
    setError(null);

    let parsedOptions = null;
    if (form.options_raw.trim()) {
      try {
        parsedOptions = JSON.parse(form.options_raw);
      } catch {
        setError('Options JSON is invalid. Use format: [{"label":"Yes","value":"yes"}]');
        setSaving(false);
        return;
      }
    }

    const visibilityRule =
      form.vis_field_name.trim()
        ? { field_name: form.vis_field_name.trim(), equals: form.vis_equals.trim() }
        : null;

    const payload = {
      organization_id: orgId || null,
      name: form.name.trim(),
      group_name: form.group_name.trim() || null,
      display_order: form.display_order ? Number(form.display_order) : null,
      field_type: form.field_type,
      applies_to: form.applies_to,
      is_required: form.is_required === 'true',
      is_active: form.is_active === 'true',
      options: parsedOptions,
      visibility_rule: visibilityRule,
    };

    const op = editingId
      ? supabase.from('custom_fields').update(payload).eq('id', editingId)
      : supabase.from('custom_fields').insert(payload);

    const { error: err } = await op;
    if (err) {
      setError(err.message);
    } else {
      resetForm();
      await loadFields();
    }
    setSaving(false);
  };

  const displayed = fields.filter((f) => filterAppliesTo === 'all' || f.applies_to === filterAppliesTo);

  // Group displayed fields for the table
  const grouped = displayed.reduce<Record<string, Record<string, CustomField[]>>>((acc, f) => {
    const entity = f.applies_to;
    const group = f.group_name ?? 'General';
    acc[entity] = acc[entity] ?? {};
    acc[entity][group] = acc[entity][group] ?? [];
    acc[entity][group].push(f);
    return acc;
  }, {});

  // Live preview helpers
  const previewField = form;

  if (loading) return <AppShell><PageSkeleton /></AppShell>;

  return (
    <AppShell>
      <AdminGuard>
        <SectionHeader
          title="Custom Field Builder"
          description="Create organization-specific fields for patient and procedure records. Fields can be grouped, ordered, and conditionally shown based on visibility rules."
          action={
            <div className="flex items-center gap-2">
              {(['all', 'procedure', 'patient'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterAppliesTo(v)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    filterAppliesTo === v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'procedure' ? 'Procedure fields' : 'Patient fields'}
                </button>
              ))}
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          {/* Builder Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader
                title={editingId ? 'Edit Field' : 'New Custom Field'}
                subtitle="Configure the field type, group, and visibility rules."
              />
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-600">
                  Organization
                  <Select className="mt-2" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                    <option value="">All organizations (global)</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </Select>
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Field name *
                  <Input
                    className="mt-2"
                    placeholder='e.g. "Polyp size (mm)"'
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-600">
                    Applies to *
                    <Select className="mt-2" value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value as any })}>
                      <option value="procedure">Procedure</option>
                      <option value="patient">Patient</option>
                    </Select>
                  </label>
                  <label className="block text-sm font-medium text-slate-600">
                    Field type *
                    <Select className="mt-2" value={form.field_type} onChange={(e) => setForm({ ...form, field_type: e.target.value as FieldType })}>
                      {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </Select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-600">
                    Display group
                    <Input
                      className="mt-2"
                      placeholder='e.g. "Findings"'
                      value={form.group_name}
                      onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-600">
                    Display order
                    <Input
                      className="mt-2"
                      type="number"
                      placeholder="1"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-600">
                    Required
                    <Select className="mt-2" value={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.value })}>
                      <option value="false">Optional</option>
                      <option value="true">Required</option>
                    </Select>
                  </label>
                  <label className="block text-sm font-medium text-slate-600">
                    Status
                    <Select className="mt-2" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </label>
                </div>

                {form.field_type === 'select' && (
                  <label className="block text-sm font-medium text-slate-600">
                    Options (JSON array)
                    <Textarea
                      className="mt-2 font-mono text-xs"
                      rows={4}
                      placeholder={'[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]'}
                      value={form.options_raw}
                      onChange={(e) => setForm({ ...form, options_raw: e.target.value })}
                    />
                    <span className="mt-1 block text-xs text-slate-400">Array of {`{"label":"…","value":"…"}`} objects</span>
                  </label>
                )}

                {/* Visibility Rule Builder */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Visibility Rule (optional)</p>
                  <p className="mb-3 text-xs text-slate-500">Only show this field when another field equals a specific value.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-slate-600">
                      When field named
                      <Input
                        className="mt-1"
                        placeholder='e.g. "procedure_type"'
                        value={form.vis_field_name}
                        onChange={(e) => setForm({ ...form, vis_field_name: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-slate-600">
                      Equals value
                      <Input
                        className="mt-1"
                        placeholder='e.g. "colonoscopy"'
                        value={form.vis_equals}
                        onChange={(e) => setForm({ ...form, vis_equals: e.target.value })}
                      />
                    </label>
                  </div>
                  {form.vis_field_name && (
                    <p className="mt-2 text-xs text-sky-600">
                      Show when <strong>{form.vis_field_name}</strong> = "<strong>{form.vis_equals}</strong>"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update field' : 'Create field'}
                  </Button>
                  {editingId && (
                    <Button variant="ghost" onClick={resetForm}>Cancel edit</Button>
                  )}
                </div>
                {error && <p className="text-sm text-rose-600">{error}</p>}
              </div>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader title="Live Preview" subtitle="How this field will appear in forms." />
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>{previewField.name || 'Field name'}</span>
                    {previewField.is_required === 'true' && (
                      <span className="text-xs text-rose-500">required</span>
                    )}
                    <Badge label={FIELD_TYPE_LABELS[previewField.field_type]} tone={fieldTypeTone(previewField.field_type)} />
                  </div>
                  <div className="mt-2">
                    {previewField.field_type === 'textarea' ? (
                      <Textarea placeholder="Enter text…" disabled />
                    ) : previewField.field_type === 'select' ? (
                      <Select disabled>
                        <option>Select option</option>
                        {(() => {
                          try {
                            const opts = JSON.parse(previewField.options_raw || '[]');
                            return opts.map((o: any) => (
                              <option key={o.value}>{o.label}</option>
                            ));
                          } catch { return null; }
                        })()}
                      </Select>
                    ) : previewField.field_type === 'json' ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-400">
                        Key / value editor renders here
                      </div>
                    ) : (
                      <Input
                        type={previewField.field_type === 'number' ? 'number' : previewField.field_type === 'date' ? 'date' : 'text'}
                        placeholder="Enter value…"
                        disabled
                      />
                    )}
                  </div>
                </label>
                {previewField.group_name && (
                  <p className="mt-3 text-xs text-slate-400">Group: {previewField.group_name}</p>
                )}
                {previewField.vis_field_name && (
                  <p className="mt-1 text-xs text-sky-500">
                    Visible when {previewField.vis_field_name} = "{previewField.vis_equals}"
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Field List */}
          <Card>
            <CardHeader
              title="Configured Fields"
              subtitle={`${displayed.length} field${displayed.length !== 1 ? 's' : ''}`}
            />

            {displayed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                No custom fields yet. Create your first field using the builder.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([entity, groups]) => (
                  <div key={entity}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {entity === 'procedure' ? 'Procedure fields' : 'Patient fields'}
                    </p>
                    <div className="space-y-4">
                      {Object.entries(groups).map(([groupName, groupFields]) => (
                        <div key={groupName}>
                          <p className="mb-2 text-xs font-medium text-slate-500">{groupName}</p>
                          <div className="space-y-2">
                            {groupFields.map((field) => (
                              <div
                                key={field.id}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-slate-800">{field.name}</p>
                                    <Badge label={FIELD_TYPE_LABELS[field.field_type] ?? field.field_type} tone={fieldTypeTone(field.field_type)} />
                                    {field.is_required && <Badge label="required" tone="amber" />}
                                    {!field.is_active && <Badge label="inactive" tone="rose" />}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                                    {field.display_order !== null && <span>Order: {field.display_order}</span>}
                                    {field.visibility_rule?.field_name && (
                                      <span className="text-sky-500">
                                        Visible when {field.visibility_rule.field_name} = "{field.visibility_rule.equals}"
                                      </span>
                                    )}
                                    {field.options && Array.isArray(field.options) && (
                                      <span>{field.options.length} option{field.options.length !== 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex shrink-0 flex-col gap-1">
                                  <button
                                    onClick={() => handleEdit(field)}
                                    className="rounded-xl px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDuplicate(field)}
                                    className="rounded-xl px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50"
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={() => handleDelete(field.id)}
                                    className="rounded-xl px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AdminGuard>
    </AppShell>
  );
}
