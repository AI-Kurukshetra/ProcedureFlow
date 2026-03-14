import { ModuleConfig } from '@/components/modules/ModuleClient';

export const moduleConfigs: Record<string, ModuleConfig> = {
  templates: {
    title: 'Procedure Template Management',
    description:
      'Design and maintain reusable, customizable templates for each procedure type. Templates define structured data fields, required documentation steps, and specialty-specific workflows. Attach custom field groups, version templates for audit purposes, and set active/inactive status to control which templates are available to clinical staff.',
    table: 'templates',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'specialty_id', label: 'Specialty' },
      { key: 'version', label: 'Version' },
      { key: 'is_active', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Template name', type: 'text', required: true, placeholder: 'e.g. Upper GI Endoscopy' },
      { key: 'specialty_id', label: 'Specialty', type: 'text', placeholder: 'Specialty UUID' },
      { key: 'version', label: 'Version', type: 'text', placeholder: 'e.g. 2.1' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed overview of what this template covers and its intended clinical use' },
      { key: 'fields', label: 'Template fields (JSON)', type: 'json' },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
      },
    ],
  },

  patients: {
    title: 'Patient Demographics Management',
    description:
      'Centralized patient registry with complete demographic profiles. Supports automatic population from EMR systems via the EMR ID field, with manual override capability for corrections. Captures insurance details, contact information, emergency contacts, and clinical identifiers (MRN). Custom fields can extend patient profiles with organization-specific data points.',
    table: 'patients',
    customFields: { entityType: 'patient' },
    columns: [
      { key: 'mrn', label: 'MRN' },
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'date_of_birth', label: 'DOB' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text', placeholder: 'Organization UUID' },
      { key: 'mrn', label: 'Medical record number (MRN)', type: 'text', required: true, placeholder: 'e.g. MRN-00123456' },
      { key: 'first_name', label: 'First name', type: 'text', required: true },
      { key: 'last_name', label: 'Last name', type: 'text', required: true },
      { key: 'date_of_birth', label: 'Date of birth', type: 'date' },
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Non-binary', value: 'non-binary' },
          { label: 'Other', value: 'other' },
          { label: 'Prefer not to say', value: 'undisclosed' },
        ],
      },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'patient@email.com' },
      { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1-555-000-0000' },
      { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Street, City, State, ZIP' },
      { key: 'emergency_contact', label: 'Emergency contact name', type: 'text' },
      { key: 'emergency_phone', label: 'Emergency contact phone', type: 'text' },
      { key: 'blood_type', label: 'Blood type', type: 'select', options: [
        { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
        { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
        { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
        { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
      ]},
      { key: 'allergies', label: 'Known allergies', type: 'textarea', placeholder: 'List known drug/food allergies' },
      { key: 'insurance_info', label: 'Insurance information (JSON)', type: 'json' },
      { key: 'emr_id', label: 'EMR system ID', type: 'text', placeholder: 'External EMR reference ID' },
    ],
  },

  users: {
    title: 'Role-Based Access Control',
    description:
      'Granular user and role management for all clinical and administrative staff. Assign roles (physician, nurse, technician, admin) to control access to sensitive modules. Link staff to organizations and specialties. Each role has predefined permissions enforced at middleware, server, and client layers — physicians can document, nurses can assist, technicians handle equipment, admins have full system access.',
    table: 'users',
    columns: [
      { key: 'first_name', label: 'First name' },
      { key: 'last_name', label: 'Last name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text', placeholder: 'Organization UUID' },
      { key: 'specialty_id', label: 'Specialty', type: 'text', placeholder: 'Specialty UUID' },
      { key: 'first_name', label: 'First name', type: 'text', required: true },
      { key: 'last_name', label: 'Last name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true, placeholder: 'staff@hospital.com' },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        options: [
          { label: 'Physician — full clinical access', value: 'physician' },
          { label: 'Nurse — procedure assist & documentation', value: 'nurse' },
          { label: 'Technician — equipment & device data', value: 'technician' },
          { label: 'Admin — full system access', value: 'admin' },
        ],
      },
      { key: 'license_number', label: 'License / credential number', type: 'text', placeholder: 'e.g. MD-123456' },
      {
        key: 'is_active',
        label: 'Account status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
      },
    ],
  },

  scheduling: {
    title: 'Procedure Scheduling Integration',
    description:
      'Integration layer between scheduling systems and the procedure documentation workflow. Automatically populates upcoming procedures from schedule entries, reducing duplicate data entry. Supports priority triage (routine, urgent, emergency), room assignment, and status tracking from scheduled through completion. Scheduled entries can be converted to live procedures with one click.',
    table: 'schedules',
    columns: [
      { key: 'procedure_type', label: 'Procedure' },
      { key: 'scheduled_date', label: 'Date' },
      { key: 'scheduled_time', label: 'Time' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text' },
      { key: 'patient_id', label: 'Patient', type: 'text' },
      { key: 'physician_id', label: 'Physician', type: 'text' },
      { key: 'specialty_id', label: 'Specialty', type: 'text' },
      { key: 'procedure_type', label: 'Procedure type', type: 'text', required: true, placeholder: 'e.g. Colonoscopy, EGD, Bronchoscopy' },
      { key: 'scheduled_date', label: 'Scheduled date', type: 'date', required: true },
      { key: 'scheduled_time', label: 'Scheduled time (HH:MM)', type: 'text', placeholder: '08:30' },
      { key: 'duration_minutes', label: 'Estimated duration (minutes)', type: 'number', placeholder: '60' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Checked in', value: 'checked-in' },
          { label: 'In progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'No-show', value: 'no-show' },
          { label: 'Rescheduled', value: 'rescheduled' },
        ],
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { label: 'Routine', value: 'routine' },
          { label: 'Urgent', value: 'urgent' },
          { label: 'Emergency', value: 'emergency' },
        ],
      },
      { key: 'room', label: 'Room / location', type: 'text', placeholder: 'e.g. Suite 3A' },
      { key: 'notes', label: 'Scheduling notes', type: 'textarea', placeholder: 'Pre-procedure instructions, special requirements, prep notes' },
    ],
  },

  consents: {
    title: 'Digital Consent Management',
    description:
      'Capture, store, and verify electronic patient consent forms with digital signature workflows. Supports multiple consent types (procedure, anesthesia, media, research). Records witness IDs for co-signature, timestamps for legal compliance, and signature data. Integrates directly with the procedure workflow — consents are required before a procedure can be marked as completed.',
    table: 'consents',
    columns: [
      { key: 'consent_type', label: 'Type' },
      { key: 'patient_id', label: 'Patient' },
      { key: 'signed_at', label: 'Signed at' },
      { key: 'is_valid', label: 'Valid' },
    ],
    fields: [
      { key: 'patient_id', label: 'Patient', type: 'text', required: true },
      { key: 'procedure_id', label: 'Procedure', type: 'text' },
      {
        key: 'consent_type',
        label: 'Consent type',
        type: 'select',
        required: true,
        options: [
          { label: 'Procedure consent', value: 'procedure' },
          { label: 'Anesthesia consent', value: 'anesthesia' },
          { label: 'Blood transfusion consent', value: 'blood_transfusion' },
          { label: 'Photography / media consent', value: 'media' },
          { label: 'Research participation consent', value: 'research' },
          { label: 'Data sharing consent', value: 'data_sharing' },
          { label: 'General consent to treat', value: 'general' },
        ],
      },
      { key: 'signature_data', label: 'Patient signature (typed or encoded)', type: 'textarea', placeholder: 'Patient typed name or encoded signature' },
      { key: 'witness_id', label: 'Witness user ID', type: 'text', placeholder: 'User UUID of witnessing staff member' },
      { key: 'signed_at', label: 'Signed at (ISO datetime)', type: 'text', placeholder: '2024-01-15T10:30:00Z' },
      {
        key: 'is_valid',
        label: 'Consent validity',
        type: 'select',
        options: [
          { label: 'Valid', value: 'true' },
          { label: 'Revoked', value: 'false' },
        ],
      },
      { key: 'notes', label: 'Notes / special conditions', type: 'textarea', placeholder: 'Patient questions, modifications to standard consent, or special conditions noted' },
    ],
  },

  billing: {
    title: 'Billing Code Integration',
    description:
      'Automatic CPT and ICD-10 code suggestion engine based on procedure documentation. Codes are suggested by the system and confirmed by the billing team before submission. Tracks the full billing lifecycle from suggestion through final billed status. Stores amounts, modifiers, and links codes directly to procedure records for clean claim generation.',
    table: 'billing_codes',
    columns: [
      { key: 'procedure_id', label: 'Procedure' },
      { key: 'cpt_code', label: 'CPT' },
      { key: 'icd_code', label: 'ICD-10' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'procedure_id', label: 'Procedure', type: 'text', required: true },
      { key: 'cpt_code', label: 'CPT code', type: 'text', required: true, placeholder: 'e.g. 45378 (Colonoscopy)' },
      { key: 'icd_code', label: 'ICD-10 diagnosis code', type: 'text', placeholder: 'e.g. Z12.11 (colon cancer screening)' },
      { key: 'modifier', label: 'Modifier', type: 'text', placeholder: 'e.g. 26, TC, 59' },
      { key: 'description', label: 'Billing description', type: 'textarea', placeholder: 'Narrative description of the service rendered for claim purposes' },
      { key: 'amount', label: 'Billable amount (USD)', type: 'number', placeholder: '0.00' },
      { key: 'units', label: 'Units', type: 'number', placeholder: '1' },
      {
        key: 'status',
        label: 'Billing status',
        type: 'select',
        options: [
          { label: 'Suggested by system', value: 'suggested' },
          { label: 'Confirmed by physician', value: 'confirmed' },
          { label: 'Sent to billing', value: 'billed' },
          { label: 'Claim submitted', value: 'submitted' },
          { label: 'Claim paid', value: 'paid' },
          { label: 'Denied', value: 'denied' },
        ],
      },
    ],
  },

  medications: {
    title: 'Medication Tracking',
    description:
      'Track all medications administered during procedures with dosage, route, and timing records. Maintains an organization-specific medication catalog with formulary details. Links medication administrations to individual procedures for accurate clinical and billing documentation. Supports dosage tracking and flags potential drug interactions when combined with the clinical decision support module.',
    table: 'medications',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'form', label: 'Form' },
      { key: 'strength', label: 'Strength' },
      { key: 'route', label: 'Route' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text' },
      { key: 'name', label: 'Medication name', type: 'text', required: true, placeholder: 'e.g. Midazolam, Fentanyl, Propofol' },
      {
        key: 'form',
        label: 'Dosage form',
        type: 'select',
        options: [
          { label: 'Injection (IV)', value: 'injection_iv' },
          { label: 'Injection (IM)', value: 'injection_im' },
          { label: 'Oral tablet', value: 'tablet' },
          { label: 'Oral liquid', value: 'liquid' },
          { label: 'Topical / spray', value: 'topical' },
          { label: 'Inhaled', value: 'inhaled' },
          { label: 'Suppository', value: 'suppository' },
          { label: 'Other', value: 'other' },
        ],
      },
      { key: 'strength', label: 'Strength / concentration', type: 'text', placeholder: 'e.g. 5mg/mL, 10mg tablet' },
      {
        key: 'route',
        label: 'Route of administration',
        type: 'select',
        options: [
          { label: 'Intravenous (IV)', value: 'IV' },
          { label: 'Intramuscular (IM)', value: 'IM' },
          { label: 'Oral (PO)', value: 'PO' },
          { label: 'Sublingual (SL)', value: 'SL' },
          { label: 'Topical', value: 'topical' },
          { label: 'Inhalation', value: 'inhalation' },
          { label: 'Rectal', value: 'rectal' },
          { label: 'Other', value: 'other' },
        ],
      },
      { key: 'controlled_substance', label: 'Controlled substance', type: 'select', options: [
        { label: 'No', value: 'false' },
        { label: 'Yes – Schedule II', value: 'schedule_ii' },
        { label: 'Yes – Schedule III', value: 'schedule_iii' },
        { label: 'Yes – Schedule IV', value: 'schedule_iv' },
        { label: 'Yes – Schedule V', value: 'schedule_v' },
      ]},
      { key: 'contraindications', label: 'Contraindications', type: 'textarea', placeholder: 'Known contraindications and precautions' },
      {
        key: 'is_active',
        label: 'Formulary status',
        type: 'select',
        options: [
          { label: 'Active (on formulary)', value: 'true' },
          { label: 'Inactive / removed', value: 'false' },
        ],
      },
    ],
  },

  equipment: {
    title: 'Equipment Utilization Tracking',
    description:
      'Log and manage all medical equipment used during procedures for maintenance scheduling and inventory control. Tracks usage history, current operational status, and upcoming maintenance dates. Generates maintenance alerts when equipment is due for service. Links usage records to procedures to support post-procedure equipment decontamination and sterilization workflows.',
    table: 'equipment',
    columns: [
      { key: 'name', label: 'Equipment' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'maintenance_due', label: 'Maintenance due' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text' },
      { key: 'name', label: 'Equipment name', type: 'text', required: true, placeholder: 'e.g. Olympus CF-HQ190L Colonoscope' },
      {
        key: 'type',
        label: 'Equipment type',
        type: 'select',
        options: [
          { label: 'Endoscope', value: 'endoscope' },
          { label: 'Bronchoscope', value: 'bronchoscope' },
          { label: 'Ultrasound probe', value: 'ultrasound' },
          { label: 'Electrosurgical unit', value: 'esu' },
          { label: 'Monitor / display', value: 'monitor' },
          { label: 'Anesthesia machine', value: 'anesthesia' },
          { label: 'Surgical instrument', value: 'instrument' },
          { label: 'Patient positioning', value: 'positioning' },
          { label: 'Other', value: 'other' },
        ],
      },
      { key: 'model', label: 'Model / part number', type: 'text', placeholder: 'Manufacturer model number' },
      { key: 'serial_number', label: 'Serial number', type: 'text', placeholder: 'Unique device serial number' },
      { key: 'location', label: 'Current location / room', type: 'text', placeholder: 'e.g. Endoscopy Suite 2' },
      {
        key: 'status',
        label: 'Operational status',
        type: 'select',
        options: [
          { label: 'Available', value: 'available' },
          { label: 'In use', value: 'in_use' },
          { label: 'In sterilization', value: 'sterilization' },
          { label: 'Under maintenance', value: 'maintenance' },
          { label: 'Out of service', value: 'out_of_service' },
          { label: 'Retired', value: 'retired' },
        ],
      },
      { key: 'purchase_date', label: 'Purchase date', type: 'date' },
      { key: 'maintenance_due', label: 'Next maintenance due', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Service history, known issues, special handling instructions' },
    ],
  },

  staff: {
    title: 'Staff Assignment Management',
    description:
      'Track and assign staff members to specific procedures with role-based credential verification. Ensures required clinical roles are present before a procedure begins (primary physician, scrub tech, circulator, etc.). Records check-in times and participation notes. Integrates with credential management to verify active licenses and certifications prior to assignment.',
    table: 'staff_assignments',
    columns: [
      { key: 'procedure_id', label: 'Procedure' },
      { key: 'user_id', label: 'Staff member' },
      { key: 'role', label: 'Procedure role' },
      { key: 'checked_in', label: 'Checked in' },
    ],
    fields: [
      { key: 'procedure_id', label: 'Procedure', type: 'text', required: true },
      { key: 'user_id', label: 'Staff member (User)', type: 'text', required: true },
      {
        key: 'role',
        label: 'Procedure role',
        type: 'select',
        required: true,
        options: [
          { label: 'Primary physician / attending', value: 'primary_physician' },
          { label: 'Assisting physician / fellow', value: 'assisting_physician' },
          { label: 'Circulator nurse', value: 'circulator_nurse' },
          { label: 'Scrub nurse / tech', value: 'scrub_tech' },
          { label: 'Anesthesiologist', value: 'anesthesiologist' },
          { label: 'CRNA', value: 'crna' },
          { label: 'Radiology tech', value: 'radiology_tech' },
          { label: 'Observer / trainee', value: 'observer' },
        ],
      },
      {
        key: 'checked_in',
        label: 'Check-in status',
        type: 'select',
        options: [
          { label: 'Checked in', value: 'true' },
          { label: 'Not yet checked in', value: 'false' },
        ],
      },
      { key: 'notes', label: 'Assignment notes', type: 'textarea', placeholder: 'Special credentials, intraoperative notes, or role clarifications' },
    ],
  },

  specialties: {
    title: 'Multi-Specialty Support',
    description:
      'Maintain the complete registry of clinical specialties supported by the platform. Each specialty has its own templates, clinical guidelines, equipment preferences, and workflow configurations. Supports GI, pulmonology, cardiology, orthopedics, urology, and all other hospital departments. Specialty-specific workflows enforce the right documentation steps for each procedure type.',
    table: 'specialties',
    orderBy: { column: 'name', ascending: true },
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'department', label: 'Department' },
      { key: 'is_active', label: 'Active' },
    ],
    fields: [
      { key: 'name', label: 'Specialty name', type: 'text', required: true, placeholder: 'e.g. Gastroenterology' },
      { key: 'code', label: 'Short code', type: 'text', placeholder: 'e.g. GI, PULM, CARD' },
      {
        key: 'department',
        label: 'Hospital department',
        type: 'select',
        options: [
          { label: 'Gastroenterology', value: 'gastroenterology' },
          { label: 'Pulmonology', value: 'pulmonology' },
          { label: 'Cardiology', value: 'cardiology' },
          { label: 'Orthopedics', value: 'orthopedics' },
          { label: 'Urology', value: 'urology' },
          { label: 'Neurology', value: 'neurology' },
          { label: 'Oncology', value: 'oncology' },
          { label: 'General surgery', value: 'surgery' },
          { label: 'Radiology / Interventional', value: 'radiology' },
          { label: 'Other', value: 'other' },
        ],
      },
      { key: 'description', label: 'Specialty description', type: 'textarea', placeholder: 'Overview of procedures, scope, and clinical focus of this specialty' },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
      },
    ],
  },

  compliance: {
    title: 'Compliance Reporting',
    description:
      'Automated generation of regulatory compliance records and audit trails for accreditation bodies (JC, CMS, HIPAA). Tracks deviations, incident reports, infection control events, and quality improvement records linked to individual procedures. All records are timestamped and immutable for audit integrity. Generates PDF compliance summaries on demand for submission to regulatory authorities.',
    table: 'compliance_records',
    columns: [
      { key: 'record_type', label: 'Record type' },
      { key: 'status', label: 'Status' },
      { key: 'procedure_id', label: 'Procedure' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text' },
      { key: 'procedure_id', label: 'Procedure', type: 'text' },
      {
        key: 'record_type',
        label: 'Record type',
        type: 'select',
        required: true,
        options: [
          { label: 'Infection control', value: 'infection_control' },
          { label: 'Adverse event / incident', value: 'adverse_event' },
          { label: 'Near miss', value: 'near_miss' },
          { label: 'Medication error', value: 'medication_error' },
          { label: 'Equipment failure', value: 'equipment_failure' },
          { label: 'Patient fall', value: 'patient_fall' },
          { label: 'Consent deviation', value: 'consent_deviation' },
          { label: 'HIPAA breach', value: 'hipaa_breach' },
          { label: 'Quality improvement', value: 'quality_improvement' },
          { label: 'Audit record', value: 'audit' },
        ],
      },
      {
        key: 'status',
        label: 'Resolution status',
        type: 'select',
        options: [
          { label: 'Open – under review', value: 'open' },
          { label: 'In progress – corrective action', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Escalated to risk management', value: 'escalated' },
          { label: 'Closed', value: 'closed' },
        ],
      },
      { key: 'reviewed_by', label: 'Reviewed by (User ID)', type: 'text' },
      { key: 'regulation', label: 'Applicable regulation / standard', type: 'text', placeholder: 'e.g. HIPAA 164.530, JC EC.02.01.01' },
      { key: 'details', label: 'Incident details (JSON)', type: 'json' },
      { key: 'corrective_action', label: 'Corrective action taken', type: 'textarea', placeholder: 'Describe steps taken to address and prevent recurrence' },
    ],
  },

  clinical: {
    title: 'Clinical Decision Support',
    description:
      'Built-in clinical guidelines and real-time alerts specific to each procedure type and specialty. Surfaces evidence-based protocols, contraindication warnings, and step-by-step procedural checklists during live documentation. Guidelines are assigned severity levels (info, warning, critical) and are automatically filtered to the current procedure\'s specialty. Supports GERD, polyp surveillance, COPD protocols, cardiac catheterization checklists, and more.',
    table: 'clinical_guidelines',
    columns: [
      { key: 'title', label: 'Guideline title' },
      { key: 'specialty_id', label: 'Specialty' },
      { key: 'guideline_type', label: 'Type' },
      { key: 'severity', label: 'Severity' },
    ],
    fields: [
      { key: 'specialty_id', label: 'Specialty', type: 'text' },
      { key: 'title', label: 'Guideline title', type: 'text', required: true, placeholder: 'e.g. Colonoscopy adenoma surveillance intervals' },
      {
        key: 'guideline_type',
        label: 'Guideline type',
        type: 'select',
        options: [
          { label: 'Protocol / checklist', value: 'protocol' },
          { label: 'Contraindication alert', value: 'contraindication' },
          { label: 'Drug interaction warning', value: 'drug_interaction' },
          { label: 'Pre-procedure requirement', value: 'pre_procedure' },
          { label: 'Post-procedure instruction', value: 'post_procedure' },
          { label: 'Surveillance interval', value: 'surveillance' },
          { label: 'Evidence-based recommendation', value: 'recommendation' },
        ],
      },
      { key: 'summary', label: 'Summary', type: 'textarea', required: true, placeholder: 'Brief clinical summary visible to physicians during procedure documentation' },
      { key: 'steps', label: 'Protocol steps (JSON)', type: 'json' },
      {
        key: 'severity',
        label: 'Alert severity',
        type: 'select',
        options: [
          { label: 'Informational', value: 'info' },
          { label: 'Warning – review required', value: 'warning' },
          { label: 'Critical – action required', value: 'critical' },
        ],
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive / archived', value: 'false' },
        ],
      },
      { key: 'source_reference', label: 'Source / reference', type: 'text', placeholder: 'e.g. ACG Clinical Guideline 2023, AGA Guideline' },
    ],
  },

  customFields: {
    title: 'Custom Field Builder',
    description:
      'Allow healthcare organizations to create organization-specific data fields that extend the standard patient and procedure records. Build text, number, date, select, and JSON fields. Organize fields into display groups with ordering control. Set visibility rules so fields only appear when relevant conditions are met (e.g. only show "Polyp size" when procedure type is colonoscopy). Supports required field enforcement and custom validation.',
    table: 'custom_fields',
    columns: [
      { key: 'name', label: 'Field name' },
      { key: 'field_type', label: 'Type' },
      { key: 'applies_to', label: 'Applies to' },
      { key: 'is_required', label: 'Required' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text', required: true },
      { key: 'name', label: 'Field name', type: 'text', required: true, placeholder: 'e.g. Polyp size (mm)' },
      { key: 'group_name', label: 'Display group', type: 'text', placeholder: 'e.g. Findings, Post-Procedure, Clinical' },
      { key: 'display_order', label: 'Display order', type: 'number', placeholder: '1' },
      {
        key: 'field_type',
        label: 'Field input type',
        type: 'select',
        required: true,
        options: [
          { label: 'Short text', value: 'text' },
          { label: 'Long text / textarea', value: 'textarea' },
          { label: 'Number', value: 'number' },
          { label: 'Date picker', value: 'date' },
          { label: 'Dropdown select', value: 'select' },
          { label: 'JSON / key-value', value: 'json' },
        ],
      },
      { key: 'options', label: 'Select options (JSON array)', type: 'json' },
      {
        key: 'applies_to',
        label: 'Applies to entity',
        type: 'select',
        required: true,
        options: [
          { label: 'Patient record', value: 'patient' },
          { label: 'Procedure record', value: 'procedure' },
        ],
      },
      {
        key: 'is_required',
        label: 'Required field',
        type: 'select',
        options: [
          { label: 'Optional', value: 'false' },
          { label: 'Required', value: 'true' },
        ],
      },
      { key: 'visibility_rule', label: 'Visibility rule (JSON)', type: 'json' },
      {
        key: 'is_active',
        label: 'Field status',
        type: 'select',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive / hidden', value: 'false' },
        ],
      },
    ],
  },

  customFieldValues: {
    title: 'Custom Field Values',
    description:
      'Assign and manage actual values for custom fields against specific patient or procedure records. This module stores all custom field responses, linking them to their parent entity. Values are automatically loaded and saved when viewing patient or procedure records that have custom fields configured.',
    table: 'custom_field_values',
    columns: [
      { key: 'custom_field_id', label: 'Field' },
      { key: 'entity_type', label: 'Entity type' },
      { key: 'entity_id', label: 'Entity ID' },
    ],
    fields: [
      { key: 'custom_field_id', label: 'Custom field', type: 'text', required: true },
      {
        key: 'entity_type',
        label: 'Entity type',
        type: 'select',
        required: true,
        options: [
          { label: 'Patient', value: 'patient' },
          { label: 'Procedure', value: 'procedure' },
        ],
      },
      { key: 'entity_id', label: 'Entity ID (patient or procedure UUID)', type: 'text', required: true },
      { key: 'value', label: 'Field value (JSON)', type: 'json' },
    ],
  },

  emr: {
    title: 'EMR Integration',
    description:
      'Seamless bi-directional integration with major Electronic Medical Record (EMR) systems including Epic, Cerner, Athenahealth, and MEDITECH. Pulls patient demographics and scheduling data from the EMR into ProcedureFlow, and pushes completed procedure reports and billing codes back. Supports HL7 FHIR R4 and older HL7 v2 standards. Tracks sync status and last synchronization timestamps per integration.',
    table: 'emr_integrations',
    columns: [
      { key: 'vendor', label: 'EMR vendor' },
      { key: 'status', label: 'Status' },
      { key: 'last_sync_at', label: 'Last sync' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text', required: true },
      {
        key: 'vendor',
        label: 'EMR vendor',
        type: 'select',
        required: true,
        options: [
          { label: 'Epic', value: 'epic' },
          { label: 'Cerner / Oracle Health', value: 'cerner' },
          { label: 'Athenahealth', value: 'athenahealth' },
          { label: 'MEDITECH', value: 'meditech' },
          { label: 'Allscripts / Veradigm', value: 'allscripts' },
          { label: 'NextGen', value: 'nextgen' },
          { label: 'eClinicalWorks', value: 'eclinicalworks' },
          { label: 'Other / Custom', value: 'other' },
        ],
      },
      { key: 'base_url', label: 'Base API URL', type: 'text', placeholder: 'https://fhir.hospital.com/api/FHIR/R4' },
      {
        key: 'fhir_version',
        label: 'FHIR / HL7 version',
        type: 'select',
        options: [
          { label: 'FHIR R4', value: 'fhir_r4' },
          { label: 'FHIR DSTU2', value: 'fhir_dstu2' },
          { label: 'HL7 v2.x', value: 'hl7_v2' },
          { label: 'Custom REST', value: 'rest' },
        ],
      },
      {
        key: 'sync_direction',
        label: 'Sync direction',
        type: 'select',
        options: [
          { label: 'Bi-directional (push & pull)', value: 'bidirectional' },
          { label: 'Pull only (EMR → ProcedureFlow)', value: 'pull' },
          { label: 'Push only (ProcedureFlow → EMR)', value: 'push' },
        ],
      },
      {
        key: 'status',
        label: 'Integration status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Error – needs attention', value: 'error' },
          { label: 'Setup / pending configuration', value: 'setup' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
      { key: 'credentials', label: 'Credentials (JSON – store securely)', type: 'json' },
    ],
  },

  devices: {
    title: 'Multi-Device Synchronization',
    description:
      'Cross-device compatibility layer that captures device telemetry, vitals, and sensor data payloads during procedures. Supports integration with bedside monitors, endoscopy towers, imaging systems, and wearable sensors. Data is synced in real time across all connected tablets, computers, and mobile devices via Supabase Realtime. Ensures procedural data is consistent regardless of which device the clinician is using.',
    table: 'device_data',
    columns: [
      { key: 'device_id', label: 'Device ID' },
      { key: 'device_type', label: 'Type' },
      { key: 'procedure_id', label: 'Procedure' },
      { key: 'captured_at', label: 'Captured at' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text' },
      { key: 'procedure_id', label: 'Procedure', type: 'text', required: true },
      { key: 'device_id', label: 'Device identifier', type: 'text', required: true, placeholder: 'e.g. SCOPE-001, MONITOR-ICU-3' },
      {
        key: 'device_type',
        label: 'Device type',
        type: 'select',
        options: [
          { label: 'Endoscopy tower', value: 'endoscopy_tower' },
          { label: 'Patient monitor', value: 'patient_monitor' },
          { label: 'Ultrasound machine', value: 'ultrasound' },
          { label: 'Anesthesia machine', value: 'anesthesia_machine' },
          { label: 'Fluoroscopy / C-arm', value: 'fluoroscopy' },
          { label: 'Tablet / mobile device', value: 'mobile' },
          { label: 'Workstation / desktop', value: 'workstation' },
          { label: 'Wearable sensor', value: 'wearable' },
          { label: 'Other', value: 'other' },
        ],
      },
      { key: 'captured_at', label: 'Data captured at (ISO datetime)', type: 'text', placeholder: '2024-01-15T10:30:00Z' },
      { key: 'payload', label: 'Device data payload (JSON)', type: 'json' },
    ],
  },

  research: {
    title: 'Research Data',
    description:
      'Aggregate anonymized clinical datasets from procedure records for research initiatives, quality improvement studies, and population health analytics. Datasets are de-identified in compliance with HIPAA Safe Harbor standards before export. Supports structured data exports for IRB-approved studies and cohort analysis. Links to procedures for data provenance while maintaining patient privacy through anonymization pipelines.',
    table: 'research_data',
    columns: [
      { key: 'dataset_type', label: 'Dataset' },
      { key: 'procedure_id', label: 'Procedure' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created at' },
    ],
    fields: [
      { key: 'organization_id', label: 'Organization', type: 'text' },
      { key: 'procedure_id', label: 'Source procedure', type: 'text' },
      {
        key: 'dataset_type',
        label: 'Dataset type',
        type: 'select',
        options: [
          { label: 'Outcomes analysis', value: 'outcomes' },
          { label: 'Quality metrics', value: 'quality_metrics' },
          { label: 'Complication rates', value: 'complications' },
          { label: 'Medication usage', value: 'medications' },
          { label: 'Equipment utilization', value: 'equipment' },
          { label: 'Population cohort', value: 'cohort' },
          { label: 'Longitudinal follow-up', value: 'longitudinal' },
          { label: 'Other', value: 'other' },
        ],
      },
      {
        key: 'status',
        label: 'Dataset status',
        type: 'select',
        options: [
          { label: 'Raw – not de-identified', value: 'raw' },
          { label: 'De-identified', value: 'deidentified' },
          { label: 'Approved for study', value: 'approved' },
          { label: 'Exported', value: 'exported' },
        ],
      },
      { key: 'irb_protocol', label: 'IRB protocol number', type: 'text', placeholder: 'IRB-2024-XXXX' },
      { key: 'payload', label: 'Dataset payload (JSON)', type: 'json' },
    ],
  },
};
