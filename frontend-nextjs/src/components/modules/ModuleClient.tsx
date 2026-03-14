'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Table, TCell, THead, THeadCell, TRow } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { KeyValueEditor } from '@/components/ui/KeyValueEditor';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'json';

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
};

export type ModuleConfig = {
  title: string;
  description?: string;
  table: string;
  columns: Array<{ key: string; label: string }>;
  fields: FieldConfig[];
  defaultValues?: Record<string, string | number | boolean | null>;
  customFields?: {
    entityType: 'patient' | 'procedure';
  };
  orderBy?: { column: string; ascending: boolean };
};

export function ModuleClient({ config }: { config: ModuleConfig }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [allCustomFields, setAllCustomFields] = useState<any[]>([]);
  const [refLoading, setRefLoading] = useState(true);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [quickAddOpen, setQuickAddOpen] = useState<string | null>(null);
  const [quickAddForm, setQuickAddForm] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(config.defaultValues ?? {});

  const fetchRows = async () => {
    setLoading(true);
    const orderBy = config.orderBy ?? { column: 'created_at', ascending: false };
    const query = supabase.from(config.table).select('*');
    const { data, error } =
      orderBy.column && orderBy.column.length > 0
        ? await query.order(orderBy.column, { ascending: orderBy.ascending })
        : await query;
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows(data ?? []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  useEffect(() => {
    if (!config.customFields) return;
    const loadCustomFields = async () => {
      const orgId = formData.organization_id;
      let query = supabase
        .from('custom_fields')
        .select('*')
        .eq('applies_to', config.customFields!.entityType)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (orgId) {
        query = query.or(`organization_id.eq.${orgId},organization_id.is.null`);
      }

      const { data } = await query;
      setCustomFields(data ?? []);
    };
    loadCustomFields();
  }, [config.customFields, formData.organization_id]);

  useEffect(() => {
    const loadOrganizations = async () => {
      const { data } = await supabase.from('organizations').select('*').order('name', { ascending: true });
      setOrganizations(data ?? []);
    };
    loadOrganizations();
  }, []);

  const loadReferenceLists = async () => {
    setRefLoading(true);
    try {
      const [
        patientRes,
        userRes,
        specialtyRes,
        templateRes,
        procedureRes,
        medicationRes,
        equipmentRes,
        customFieldRes,
      ] = await Promise.all([
        supabase.from('patients').select('id,first_name,last_name,organization_id').order('last_name', { ascending: true }),
        supabase.from('users').select('id,first_name,last_name,organization_id,role').order('last_name', { ascending: true }),
        supabase.from('specialties').select('id,name').order('name', { ascending: true }),
        supabase.from('templates').select('id,name,organization_id,specialty_id').order('name', { ascending: true }),
        supabase.from('procedures').select('id,title,organization_id,patient_id').order('created_at', { ascending: false }),
        supabase.from('medications').select('id,name,organization_id').order('name', { ascending: true }),
        supabase.from('equipment').select('id,name,organization_id').order('name', { ascending: true }),
        supabase.from('custom_fields').select('id,name,organization_id').order('name', { ascending: true }),
      ]);

      setPatients(patientRes.data ?? []);
      setUsers(userRes.data ?? []);
      setSpecialties(specialtyRes.data ?? []);
      setTemplates(templateRes.data ?? []);
      setProcedures(procedureRes.data ?? []);
      setMedications(medicationRes.data ?? []);
      setEquipment(equipmentRes.data ?? []);
      setAllCustomFields(customFieldRes.data ?? []);
    } catch {
      setError('Failed to load reference data. Please refresh the page.');
    } finally {
      setRefLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceLists();
  }, []);

  const organizationId = formData.organization_id;
  const specialtyId = formData.specialty_id;
  const patientId = formData.patient_id;

  // Memoize every filtered list — plain .filter() returns a new array reference each render,
  // which would cause useEffects below (that depend on these lists) to loop infinitely.
  const filteredPatients = useMemo(
    () => (organizationId ? patients.filter((p) => p.organization_id === organizationId) : patients),
    [patients, organizationId]
  );

  const filteredUsers = useMemo(
    () => (organizationId ? users.filter((u) => u.organization_id === organizationId) : users),
    [users, organizationId]
  );

  const filteredTemplates = useMemo(
    () =>
      templates.filter((t) => {
        if (organizationId && t.organization_id && t.organization_id !== organizationId) return false;
        if (specialtyId && t.specialty_id && t.specialty_id !== specialtyId) return false;
        return true;
      }),
    [templates, organizationId, specialtyId]
  );

  const filteredProcedures = useMemo(
    () =>
      procedures.filter((p) => {
        if (organizationId && p.organization_id && p.organization_id !== organizationId) return false;
        if (patientId && p.patient_id && p.patient_id !== patientId) return false;
        return true;
      }),
    [procedures, organizationId, patientId]
  );

  const filteredMedications = useMemo(
    () => (organizationId ? medications.filter((m) => m.organization_id === organizationId) : medications),
    [medications, organizationId]
  );

  const filteredEquipment = useMemo(
    () => (organizationId ? equipment.filter((e) => e.organization_id === organizationId) : equipment),
    [equipment, organizationId]
  );

  const filteredCustomFields = useMemo(
    () =>
      organizationId
        ? allCustomFields.filter((f) => f.organization_id === organizationId || !f.organization_id)
        : allCustomFields,
    [allCustomFields, organizationId]
  );

  const visibleCustomFields = useMemo(
    () =>
      customFields
        .filter((field) => {
          const rule = field.visibility_rule;
          if (!rule || Object.keys(rule).length === 0) return true;
          const fieldId = rule.field_id;
          const equals = rule.equals;
          if (!fieldId) return true;
          return customValues[fieldId] === equals;
        })
        .sort((a, b) => {
          const groupA = a.group_name ?? '';
          const groupB = b.group_name ?? '';
          if (groupA !== groupB) return groupA.localeCompare(groupB);
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        }),
    [customFields, customValues]
  );

  useEffect(() => {
    if (!organizationId) {
      if (formData.patient_id || formData.template_id || formData.procedure_id || formData.medication_id || formData.equipment_id || formData.custom_field_id) {
        setFormData((prev) => ({
          ...prev,
          patient_id: '',
          template_id: '',
          procedure_id: '',
          medication_id: '',
          equipment_id: '',
          custom_field_id: '',
        }));
      }
      return;
    }

    setFormData((prev) => {
      const next = { ...prev };
      if (prev.patient_id && !filteredPatients.find((p) => p.id === prev.patient_id)) next.patient_id = '';
      if (prev.template_id && !filteredTemplates.find((t) => t.id === prev.template_id)) next.template_id = '';
      if (prev.procedure_id && !filteredProcedures.find((p) => p.id === prev.procedure_id)) next.procedure_id = '';
      if (prev.medication_id && !filteredMedications.find((m) => m.id === prev.medication_id)) next.medication_id = '';
      if (prev.equipment_id && !filteredEquipment.find((e) => e.id === prev.equipment_id)) next.equipment_id = '';
      if (prev.custom_field_id && !filteredCustomFields.find((f) => f.id === prev.custom_field_id)) next.custom_field_id = '';
      if (prev.physician_id && !filteredUsers.find((u) => u.id === prev.physician_id)) next.physician_id = '';
      if (prev.user_id && !filteredUsers.find((u) => u.id === prev.user_id)) next.user_id = '';
      return next;
    });
  }, [
    organizationId,
    filteredPatients,
    filteredTemplates,
    filteredProcedures,
    filteredMedications,
    filteredEquipment,
    filteredCustomFields,
    filteredUsers,
  ]);

  useEffect(() => {
    if (!specialtyId) return;
    setFormData((prev) => {
      if (prev.template_id && !filteredTemplates.find((t) => t.id === prev.template_id)) {
        return { ...prev, template_id: '' };
      }
      return prev;
    });
  }, [specialtyId, filteredTemplates]);

  useEffect(() => {
    if (!patientId) return;
    setFormData((prev) => {
      if (prev.procedure_id && !filteredProcedures.find((p) => p.id === prev.procedure_id)) {
        return { ...prev, procedure_id: '' };
      }
      return prev;
    });
  }, [patientId, filteredProcedures]);

  useEffect(() => {
    if (!formData.template_id) return;
    const selectedTemplate = templates.find((template) => template.id === formData.template_id);
    if (!selectedTemplate) return;
    setFormData((prev) => {
      const next = { ...prev };
      if (!prev.specialty_id && selectedTemplate.specialty_id) next.specialty_id = selectedTemplate.specialty_id;
      if (!prev.organization_id && selectedTemplate.organization_id) next.organization_id = selectedTemplate.organization_id;
      return next;
    });
  }, [formData.template_id, templates]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(config.defaultValues ?? {});
    setCustomValues({});
    setQuickAddOpen(null);
    setQuickAddForm({});
  };

  const filteredRows = rows.filter((row) => {
    if (!searchTerm.trim()) return true;
    const haystack = Object.values(row).join(' ').toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av > bv ? -1 : 1);
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  const quickCreate = async (fieldKey: string) => {
    setQuickAddOpen((prev) => (prev === fieldKey ? null : fieldKey));
    setQuickAddForm({});
  };

  const submitQuickAdd = async (fieldKey: string) => {
    const orgId = formData.organization_id || null;
    setError(null);

    if (fieldKey === 'patient_id') {
      if (!quickAddForm.first_name?.trim() || !quickAddForm.last_name?.trim()) {
        setError('First name and last name are required.');
        return;
      }
      const payload = {
        first_name: quickAddForm.first_name.trim(),
        last_name: quickAddForm.last_name.trim(),
        email: quickAddForm.email?.trim() || null,
        organization_id: orgId,
      };
      const { data, error: insertError } = await supabase.from('patients').insert(payload).select('id').single();
      if (insertError) { setError(insertError.message); return; }
      await loadReferenceLists();
      if (data?.id) setFormData((prev) => ({ ...prev, patient_id: data.id }));
    }
    if (fieldKey === 'specialty_id') {
      if (!quickAddForm.name?.trim()) { setError('Specialty name is required.'); return; }
      const payload = { name: quickAddForm.name.trim(), code: quickAddForm.code?.trim() || null };
      const { data, error: insertError } = await supabase.from('specialties').insert(payload).select('id').single();
      if (insertError) { setError(insertError.message); return; }
      await loadReferenceLists();
      if (data?.id) setFormData((prev) => ({ ...prev, specialty_id: data.id }));
    }
    if (fieldKey === 'template_id') {
      if (!quickAddForm.name?.trim()) { setError('Template name is required.'); return; }
      const payload = {
        name: quickAddForm.name.trim(),
        description: quickAddForm.description?.trim() || null,
        organization_id: orgId,
        specialty_id: formData.specialty_id || null,
      };
      const { data, error: insertError } = await supabase.from('templates').insert(payload).select('id').single();
      if (insertError) { setError(insertError.message); return; }
      await loadReferenceLists();
      if (data?.id) setFormData((prev) => ({ ...prev, template_id: data.id }));
    }
    if (fieldKey === 'medication_id') {
      if (!quickAddForm.name?.trim()) { setError('Medication name is required.'); return; }
      const payload = {
        name: quickAddForm.name.trim(),
        strength: quickAddForm.strength?.trim() || null,
        route: quickAddForm.route?.trim() || null,
        organization_id: orgId,
      };
      const { data, error: insertError } = await supabase.from('medications').insert(payload).select('id').single();
      if (insertError) { setError(insertError.message); return; }
      await loadReferenceLists();
      if (data?.id) setFormData((prev) => ({ ...prev, medication_id: data.id }));
    }
    if (fieldKey === 'equipment_id') {
      if (!quickAddForm.name?.trim()) { setError('Equipment name is required.'); return; }
      const payload = {
        name: quickAddForm.name.trim(),
        type: quickAddForm.type?.trim() || null,
        model: quickAddForm.model?.trim() || null,
        organization_id: orgId,
      };
      const { data, error: insertError } = await supabase.from('equipment').insert(payload).select('id').single();
      if (insertError) { setError(insertError.message); return; }
      await loadReferenceLists();
      if (data?.id) setFormData((prev) => ({ ...prev, equipment_id: data.id }));
    }
    setQuickAddOpen(null);
    setQuickAddForm({});
  };

  const saveCustomFields = async (entityId: string) => {
    if (!config.customFields) return;
    const entityType = config.customFields.entityType;
    await supabase.from('custom_field_values').delete().eq('entity_type', entityType).eq('entity_id', entityId);
    if (customFields.length === 0) return;
    const payload = customFields.map((field) => ({
      custom_field_id: field.id,
      entity_type: entityType,
      entity_id: entityId,
      value: { value: customValues[field.id] ?? '' },
    }));
    await supabase.from('custom_field_values').insert(payload);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    const payload: Record<string, any> = { ...formData };
    for (const field of config.fields) {
      if (field.required && !payload[field.key]) {
        setError(`${field.label} is required.`);
        setSaving(false);
        return;
      }
    }
    for (const field of config.fields) {
      if (field.type === 'json' && typeof payload[field.key] === 'string') {
        try {
          payload[field.key] = payload[field.key] ? JSON.parse(payload[field.key]) : null;
        } catch {
          setError(`Invalid JSON for ${field.label}`);
          setSaving(false);
          return;
        }
      }
    }

    const operation = editingId
      ? supabase.from(config.table).update(payload).eq('id', editingId).select('*').single()
      : supabase.from(config.table).insert(payload).select('*').single();

    const { data, error } = await operation;
    if (error) {
      setError(error.message);
    } else {
      if (data?.id) {
        await saveCustomFields(data.id);
      }
      resetForm();
      await fetchRows();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${config.title.toLowerCase().replace(/s$/, '')}? This cannot be undone.`)) return;
    setDeleting(id);
    setRowMenuOpen(null);
    const { error } = await supabase.from(config.table).delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      await fetchRows();
    }
    setDeleting(null);
  };

  const handleEdit = (row: any) => {
    setEditingId(row.id);
    const updated: Record<string, any> = {};
    config.fields.forEach((field) => {
      const value = row[field.key];
      if (field.type === 'json') {
        updated[field.key] = value ?? {};
      } else if (value === null || value === undefined) {
        updated[field.key] = '';
      } else {
        updated[field.key] = value;
      }
    });
    setFormData(updated);
    if (config.customFields) {
      supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_type', config.customFields.entityType)
        .eq('entity_id', row.id)
        .then(({ data }) => {
          const next: Record<string, any> = {};
          (data ?? []).forEach((item) => {
            next[item.custom_field_id] = item.value?.value ?? item.value ?? '';
          });
          setCustomValues(next);
        });
    }
  };

  if (loading || refLoading) return <PageSkeleton />;

  return (
    <div>
      <SectionHeader
        title={config.title}
        description={config.description}
        action={
          <Button variant="secondary" onClick={resetForm}>
            Reset form
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        <Card>
          <div className="space-y-4">
            {config.fields.map((field) => {
              const common = {
                id: field.key,
                value: formData[field.key] ?? '',
                onChange: (event: any) =>
                  setFormData((prev) => ({ ...prev, [field.key]: event.target.value })),
              };

              return (
                <label key={field.key} className="block text-sm font-medium text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>{field.label}</span>
                    {['patient_id', 'specialty_id', 'template_id', 'medication_id', 'equipment_id'].includes(field.key) ? (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => quickCreate(field.key)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && quickCreate(field.key)}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50"
                        aria-label="Quick add"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-3">
                    {field.key === 'organization_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading organizations...' : 'Select organization'}</option>
                        {!refLoading && organizations.length === 0 ? (
                          <option value="" disabled>
                            No organizations available
                          </option>
                        ) : (
                          organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'patient_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading patients...' : 'Select patient'}</option>
                        {!refLoading && filteredPatients.length === 0 ? (
                          <option value="" disabled>
                            No patients available
                          </option>
                        ) : (
                          filteredPatients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                              {patient.last_name}, {patient.first_name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'physician_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading physicians...' : 'Select physician'}</option>
                        {!refLoading && filteredUsers.filter((user) => user.role === 'physician').length === 0 ? (
                          <option value="" disabled>
                            No physicians available
                          </option>
                        ) : (
                          filteredUsers
                            .filter((user) => user.role === 'physician')
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.last_name}, {user.first_name}
                              </option>
                            ))
                        )}
                      </Select>
                    ) : field.key === 'user_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading users...' : 'Select user'}</option>
                        {!refLoading && filteredUsers.length === 0 ? (
                          <option value="" disabled>
                            No users available
                          </option>
                        ) : (
                          filteredUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.last_name}, {user.first_name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'specialty_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading specialties...' : 'Select specialty'}</option>
                        {!refLoading && specialties.length === 0 ? (
                          <option value="" disabled>
                            No specialties available
                          </option>
                        ) : (
                          specialties.map((specialty) => (
                            <option key={specialty.id} value={specialty.id}>
                              {specialty.name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'template_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading templates...' : 'Select template'}</option>
                        {!refLoading && filteredTemplates.length === 0 ? (
                          <option value="" disabled>
                            No templates available
                          </option>
                        ) : (
                          filteredTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'procedure_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading procedures...' : 'Select procedure'}</option>
                        {!refLoading && filteredProcedures.length === 0 ? (
                          <option value="" disabled>
                            No procedures available
                          </option>
                        ) : (
                          filteredProcedures.map((procedure) => (
                            <option key={procedure.id} value={procedure.id}>
                              {procedure.title}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'medication_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading medications...' : 'Select medication'}</option>
                        {!refLoading && filteredMedications.length === 0 ? (
                          <option value="" disabled>
                            No medications available
                          </option>
                        ) : (
                          filteredMedications.map((medication) => (
                            <option key={medication.id} value={medication.id}>
                              {medication.name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'equipment_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading equipment...' : 'Select equipment'}</option>
                        {!refLoading && filteredEquipment.length === 0 ? (
                          <option value="" disabled>
                            No equipment available
                          </option>
                        ) : (
                          filteredEquipment.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.key === 'custom_field_id' ? (
                      <Select {...common}>
                        <option value="">{refLoading ? 'Loading fields...' : 'Select custom field'}</option>
                        {!refLoading && filteredCustomFields.length === 0 ? (
                          <option value="" disabled>
                            No custom fields available
                          </option>
                        ) : (
                          filteredCustomFields.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))
                        )}
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea {...common} placeholder={field.placeholder} />
                    ) : field.type === 'select' ? (
                      <Select {...common}>
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    ) : field.type === 'json' ? (
                      <div className="space-y-2">
                        <KeyValueEditor
                          value={typeof common.value === 'string' ? {} : (common.value ?? {})}
                          onChange={(next) => setFormData((prev) => ({ ...prev, [field.key]: next }))}
                        />
                        <p className="text-xs text-slate-400">Add key/value pairs for structured data.</p>
                      </div>
                    ) : (
                      <Input type={field.type} {...common} placeholder={field.placeholder} />
                    )}
                    {quickAddOpen === field.key ? (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        {field.key === 'patient_id' ? (
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
                          </div>
                        ) : null}
                        {field.key === 'specialty_id' ? (
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
                          </div>
                        ) : null}
                        {field.key === 'template_id' ? (
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
                          </div>
                        ) : null}
                        {field.key === 'medication_id' ? (
                          <div className="grid gap-3">
                            <Input
                              placeholder="Medication name"
                              value={quickAddForm.name ?? ''}
                              onChange={(event) => setQuickAddForm((prev) => ({ ...prev, name: event.target.value }))}
                            />
                            <Input
                              placeholder="Strength (optional)"
                              value={quickAddForm.strength ?? ''}
                              onChange={(event) => setQuickAddForm((prev) => ({ ...prev, strength: event.target.value }))}
                            />
                            <Input
                              placeholder="Route (optional)"
                              value={quickAddForm.route ?? ''}
                              onChange={(event) => setQuickAddForm((prev) => ({ ...prev, route: event.target.value }))}
                            />
                          </div>
                        ) : null}
                        {field.key === 'equipment_id' ? (
                          <div className="grid gap-3">
                            <Input
                              placeholder="Equipment name"
                              value={quickAddForm.name ?? ''}
                              onChange={(event) => setQuickAddForm((prev) => ({ ...prev, name: event.target.value }))}
                            />
                            <Input
                              placeholder="Type (optional)"
                              value={quickAddForm.type ?? ''}
                              onChange={(event) => setQuickAddForm((prev) => ({ ...prev, type: event.target.value }))}
                            />
                            <Input
                              placeholder="Model (optional)"
                              value={quickAddForm.model ?? ''}
                              onChange={(event) => setQuickAddForm((prev) => ({ ...prev, model: event.target.value }))}
                            />
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button type="button" onClick={() => submitQuickAdd(field.key)}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setQuickAddOpen(null);
                              setQuickAddForm({});
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
            {config.customFields && visibleCustomFields.length > 0 ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Custom Fields</p>
                {Object.entries(
                  visibleCustomFields.reduce((acc: Record<string, any[]>, field: any) => {
                    const group = field.group_name || 'General';
                    acc[group] = acc[group] ?? [];
                    acc[group].push(field);
                    return acc;
                  }, {})
                ).map(([group, fields]) => (
                  <div key={group} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{group}</p>
                    {fields.map((field: any) => (
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
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              {editingId ? (
                <Button variant="ghost" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </Card>
        <Card>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-10 w-full animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title={`No ${config.title.toLowerCase()} yet`}
              description="Create your first entry using the form."
              action={<Button onClick={() => setPage(1)}>Create entry</Button>}
            />
          ) : (
            <Table>
              <THead>
                <tr>
                  {config.columns.map((col) => (
                    <THeadCell
                      key={col.key}
                      className="cursor-pointer"
                      onClick={() => {
                        if (sortKey === col.key) {
                          setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setSortKey(col.key);
                          setSortDir('asc');
                        }
                      }}
                    >
                      {col.label}
                    </THeadCell>
                  ))}
                  <THeadCell>Actions</THeadCell>
                </tr>
              </THead>
              <tbody>
                {pagedRows.map((row) => (
                  <TRow key={row.id}>
                    {config.columns.map((col) => (
                      <TCell key={col.key}>
                        {col.key === 'is_active'
                          ? row[col.key] === true || row[col.key] === 'true'
                            ? 'Active'
                            : 'Inactive'
                          : col.key === 'role'
                            ? (row[col.key] ?? '')
                                .toString()
                                .toLowerCase()
                                .replace(/[-_]/g, ' ')
                                .replace(/\b\w/g, (c: string) => c.toUpperCase())
                          : String(row[col.key] ?? '-')}
                      </TCell>
                    ))}
                    <TCell className="flex gap-2">
                      <div className="relative">
                        {deleting === row.id ? (
                          <span className="text-xs text-slate-400 italic">Deleting…</span>
                        ) : (
                          <>
                            <Button variant="secondary" onClick={() => setRowMenuOpen((prev) => (prev === row.id ? null : row.id))}>
                              Actions
                            </Button>
                            {rowMenuOpen === row.id ? (
                              <div className="absolute right-0 z-10 mt-2 w-36 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                                <button
                                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                  onClick={() => {
                                    handleEdit(row);
                                    setRowMenuOpen(null);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
          {rows.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <Input
                className="max-w-xs"
                placeholder="Search in table"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {filteredRows.length === rows.length
                    ? `${rows.length} item${rows.length !== 1 ? 's' : ''}`
                    : `${filteredRows.length} of ${rows.length} items`}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Prev
                  </Button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
