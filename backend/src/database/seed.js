require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectDB } = require('../config/database');
const {
  Organization, Specialty, User, Template, Patient,
  Procedure, BillingCode, Consent, Schedule, Notification, Report, AuditLog,
} = require('../models');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  // ── Organizations ──────────────────────────────────────────────
  const [org] = await Organization.findOrCreate({
    where: { name: 'Demo Medical Center' },
    defaults: {
      type: 'Hospital',
      address: '123 Medical Drive, Healthcare City, HC 12345',
      phone: '555-0100',
      emrSystem: 'Epic',
      subscriptionPlan: 'enterprise',
    },
  });
  console.log('Organization:', org.id);

  // ── Specialties ────────────────────────────────────────────────
  const [[giSpec], [pulmSpec], [cardSpec], [neuroSpec], [orthoSpec]] = await Promise.all([
    Specialty.findOrCreate({ where: { code: 'GI' }, defaults: { name: 'Gastroenterology', description: 'GI procedures including endoscopy and colonoscopy' } }),
    Specialty.findOrCreate({ where: { code: 'PULM' }, defaults: { name: 'Pulmonology', description: 'Pulmonary procedures including bronchoscopy' } }),
    Specialty.findOrCreate({ where: { code: 'CARD' }, defaults: { name: 'Cardiology', description: 'Cardiac procedures including catheterization' } }),
    Specialty.findOrCreate({ where: { code: 'NEURO' }, defaults: { name: 'Neurology', description: 'Neurological procedures' } }),
    Specialty.findOrCreate({ where: { code: 'ORTHO' }, defaults: { name: 'Orthopedics', description: 'Orthopedic procedures' } }),
  ]);
  console.log('Specialties created');

  // ── Users ──────────────────────────────────────────────────────
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@demo.com' },
    defaults: { organizationId: org.id, firstName: 'System', lastName: 'Admin', passwordHash: 'Admin@123', role: 'admin' },
  });

  const [drSmith] = await User.findOrCreate({
    where: { email: 'dr.smith@demo.com' },
    defaults: { organizationId: org.id, specialtyId: giSpec.id, firstName: 'John', lastName: 'Smith', passwordHash: 'Doctor@123', role: 'physician' },
  });

  const [drJohnson] = await User.findOrCreate({
    where: { email: 'dr.johnson@demo.com' },
    defaults: { organizationId: org.id, specialtyId: cardSpec.id, firstName: 'Emily', lastName: 'Johnson', passwordHash: 'Doctor@123', role: 'physician' },
  });

  const [drPatel] = await User.findOrCreate({
    where: { email: 'dr.patel@demo.com' },
    defaults: { organizationId: org.id, specialtyId: pulmSpec.id, firstName: 'Raj', lastName: 'Patel', passwordHash: 'Doctor@123', role: 'physician' },
  });

  const [nurseWilson] = await User.findOrCreate({
    where: { email: 'nurse.wilson@demo.com' },
    defaults: { organizationId: org.id, firstName: 'Sarah', lastName: 'Wilson', passwordHash: 'Nurse@123', role: 'nurse' },
  });

  const [techBrown] = await User.findOrCreate({
    where: { email: 'tech.brown@demo.com' },
    defaults: { organizationId: org.id, firstName: 'Mike', lastName: 'Brown', passwordHash: 'Tech@123', role: 'technician' },
  });
  console.log('Users created');

  // ── Templates ──────────────────────────────────────────────────
  await Template.findOrCreate({
    where: { name: 'Upper GI Endoscopy', organizationId: org.id },
    defaults: {
      organizationId: org.id, specialtyId: giSpec.id, createdBy: admin.id,
      description: 'Standard upper GI endoscopy (EGD) documentation template',
      fields: [
        { id: '1', label: 'Indication', type: 'textarea', required: true, order: 1, options: [] },
        { id: '2', label: 'Instrument', type: 'text', required: true, order: 2, options: [] },
        { id: '3', label: 'Sedation Type', type: 'select', required: true, order: 3, options: ['Moderate sedation', 'General anesthesia', 'Topical only', 'Propofol'] },
        { id: '4', label: 'Esophagus Findings', type: 'textarea', required: false, order: 4, options: [] },
        { id: '5', label: 'Stomach Findings', type: 'textarea', required: false, order: 5, options: [] },
        { id: '6', label: 'Duodenum Findings', type: 'textarea', required: false, order: 6, options: [] },
        { id: '7', label: 'Biopsy Taken', type: 'checkbox', required: false, order: 7, options: [] },
        { id: '8', label: 'Biopsy Site', type: 'text', required: false, order: 8, options: [] },
        { id: '9', label: 'Complications', type: 'textarea', required: false, order: 9, options: [] },
        { id: '10', label: 'Impression', type: 'textarea', required: true, order: 10, options: [] },
        { id: '11', label: 'Recommendations', type: 'textarea', required: false, order: 11, options: [] },
      ],
    },
  });

  await Template.findOrCreate({
    where: { name: 'Colonoscopy', organizationId: org.id },
    defaults: {
      organizationId: org.id, specialtyId: giSpec.id, createdBy: admin.id,
      description: 'Standard colonoscopy documentation template',
      fields: [
        { id: '1', label: 'Indication', type: 'textarea', required: true, order: 1 },
        { id: '2', label: 'Bowel Prep Quality', type: 'select', required: true, order: 2, options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { id: '3', label: 'Cecal Intubation', type: 'checkbox', required: true, order: 3 },
        { id: '4', label: 'Cecal Intubation Landmarks', type: 'text', required: false, order: 4 },
        { id: '5', label: 'Polyps Found', type: 'checkbox', required: false, order: 5 },
        { id: '6', label: 'Polyp Details', type: 'textarea', required: false, order: 6 },
        { id: '7', label: 'Withdrawal Time (minutes)', type: 'number', required: true, order: 7 },
        { id: '8', label: 'Diverticulosis', type: 'checkbox', required: false, order: 8 },
        { id: '9', label: 'Hemorrhoids', type: 'checkbox', required: false, order: 9 },
        { id: '10', label: 'Impression', type: 'textarea', required: true, order: 10 },
        { id: '11', label: 'Follow-up Interval', type: 'select', required: false, order: 11, options: ['1 year', '3 years', '5 years', '10 years', 'As needed'] },
      ],
    },
  });

  await Template.findOrCreate({
    where: { name: 'Bronchoscopy', organizationId: org.id },
    defaults: {
      organizationId: org.id, specialtyId: pulmSpec.id, createdBy: admin.id,
      description: 'Flexible bronchoscopy documentation template',
      fields: [
        { id: '1', label: 'Indication', type: 'textarea', required: true, order: 1 },
        { id: '2', label: 'Sedation', type: 'select', required: true, order: 2, options: ['Moderate sedation', 'Topical + mild IV', 'General anesthesia'] },
        { id: '3', label: 'Scope Used', type: 'text', required: true, order: 3 },
        { id: '4', label: 'Vocal Cords', type: 'select', required: false, order: 4, options: ['Normal', 'Erythema', 'Nodules', 'Paralysis', 'Mass'] },
        { id: '5', label: 'Trachea', type: 'textarea', required: false, order: 5 },
        { id: '6', label: 'Carina', type: 'select', required: false, order: 6, options: ['Sharp', 'Blunted', 'Widened'] },
        { id: '7', label: 'Right Bronchial Findings', type: 'textarea', required: false, order: 7 },
        { id: '8', label: 'Left Bronchial Findings', type: 'textarea', required: false, order: 8 },
        { id: '9', label: 'BAL Performed', type: 'checkbox', required: false, order: 9 },
        { id: '10', label: 'Biopsy Taken', type: 'checkbox', required: false, order: 10 },
        { id: '11', label: 'Impression', type: 'textarea', required: true, order: 11 },
      ],
    },
  });

  await Template.findOrCreate({
    where: { name: 'Left Heart Catheterization', organizationId: org.id },
    defaults: {
      organizationId: org.id, specialtyId: cardSpec.id, createdBy: admin.id,
      description: 'Left heart catheterization and coronary angiography',
      fields: [
        { id: '1', label: 'Indication', type: 'textarea', required: true, order: 1 },
        { id: '2', label: 'Access Site', type: 'select', required: true, order: 2, options: ['Right radial', 'Left radial', 'Right femoral', 'Left femoral'] },
        { id: '3', label: 'Sheath Size', type: 'text', required: true, order: 3 },
        { id: '4', label: 'LCA Findings', type: 'textarea', required: false, order: 4 },
        { id: '5', label: 'RCA Findings', type: 'textarea', required: false, order: 5 },
        { id: '6', label: 'LV Function', type: 'select', required: false, order: 6, options: ['Normal', 'Mildly reduced', 'Moderately reduced', 'Severely reduced'] },
        { id: '7', label: 'LVEF (%)', type: 'number', required: false, order: 7 },
        { id: '8', label: 'Contrast Used (mL)', type: 'number', required: false, order: 8 },
        { id: '9', label: 'Fluoroscopy Time (min)', type: 'number', required: false, order: 9 },
        { id: '10', label: 'Complications', type: 'textarea', required: false, order: 10 },
        { id: '11', label: 'Impression & Plan', type: 'textarea', required: true, order: 11 },
      ],
    },
  });
  console.log('Templates created');

  // ── Patients ───────────────────────────────────────────────────
  const patientData = [
    { mrn: 'MRN-001', firstName: 'Alice', lastName: 'Thompson', dateOfBirth: '1968-04-12', gender: 'Female', email: 'alice.t@email.com', phone: '555-0201', insuranceInfo: { provider: 'Blue Cross', memberId: 'BC123456', groupNumber: 'GRP-100' } },
    { mrn: 'MRN-002', firstName: 'Robert', lastName: 'Martinez', dateOfBirth: '1955-09-23', gender: 'Male', email: 'robert.m@email.com', phone: '555-0202', insuranceInfo: { provider: 'Aetna', memberId: 'AE789012', groupNumber: 'GRP-200' } },
    { mrn: 'MRN-003', firstName: 'Patricia', lastName: 'Williams', dateOfBirth: '1972-01-30', gender: 'Female', email: 'patricia.w@email.com', phone: '555-0203', insuranceInfo: { provider: 'Cigna', memberId: 'CG345678', groupNumber: 'GRP-300' } },
    { mrn: 'MRN-004', firstName: 'James', lastName: 'Davis', dateOfBirth: '1948-07-14', gender: 'Male', email: 'james.d@email.com', phone: '555-0204', insuranceInfo: { provider: 'Medicare', memberId: 'MC901234', groupNumber: 'GRP-400' } },
    { mrn: 'MRN-005', firstName: 'Linda', lastName: 'Garcia', dateOfBirth: '1981-11-05', gender: 'Female', email: 'linda.g@email.com', phone: '555-0205', insuranceInfo: { provider: 'UnitedHealth', memberId: 'UH567890', groupNumber: 'GRP-500' } },
    { mrn: 'MRN-006', firstName: 'Michael', lastName: 'Anderson', dateOfBirth: '1963-03-28', gender: 'Male', email: 'michael.a@email.com', phone: '555-0206', insuranceInfo: { provider: 'Blue Cross', memberId: 'BC234567', groupNumber: 'GRP-100' } },
    { mrn: 'MRN-007', firstName: 'Barbara', lastName: 'Taylor', dateOfBirth: '1958-08-19', gender: 'Female', email: 'barbara.t@email.com', phone: '555-0207', insuranceInfo: { provider: 'Humana', memberId: 'HU345678', groupNumber: 'GRP-600' } },
    { mrn: 'MRN-008', firstName: 'David', lastName: 'Wilson', dateOfBirth: '1975-12-03', gender: 'Male', email: 'david.w@email.com', phone: '555-0208', insuranceInfo: { provider: 'Aetna', memberId: 'AE456789', groupNumber: 'GRP-200' } },
  ];

  const patients = [];
  for (const pd of patientData) {
    const [p] = await Patient.findOrCreate({
      where: { mrn: pd.mrn, organizationId: org.id },
      defaults: { ...pd, organizationId: org.id },
    });
    patients.push(p);
  }
  console.log('Patients created');

  // ── Procedures ─────────────────────────────────────────────────
  const procedureData = [
    {
      patientId: patients[0].id, physicianId: drSmith.id, specialtyId: giSpec.id,
      title: 'Upper GI Endoscopy', procedureDate: '2026-03-01', status: 'signed',
      findings: 'Esophagus: Normal mucosa, no erosions. Stomach: Mild antral gastritis. Duodenum: Normal.',
      impression: 'Mild antral gastritis, likely H. pylori related. Biopsy submitted.',
      qualityScore: 92.5,
      medications: [{ name: 'Midazolam', dose: '2mg', route: 'IV', time: '09:05' }, { name: 'Fentanyl', dose: '50mcg', route: 'IV', time: '09:05' }],
      equipment: [{ name: 'Olympus GIF-H190 Gastroscope', serialNo: 'OLY-001', checkTime: '09:00' }],
      documentationData: { indication: 'Dyspepsia and epigastric pain', instrument: 'Olympus GIF-H190', sedation: 'Moderate sedation', biopsyTaken: true, biopsySite: 'Antrum' },
    },
    {
      patientId: patients[1].id, physicianId: drSmith.id, specialtyId: giSpec.id,
      title: 'Colonoscopy', procedureDate: '2026-03-03', status: 'signed',
      findings: 'Cecal intubation achieved. Excellent bowel prep. Two small polyps in sigmoid colon (5mm, 4mm), removed by cold snare. Mild diverticulosis sigmoid. No bleeding.',
      impression: 'Sigmoid adenomatous polyps removed. Diverticulosis sigmoid. Follow-up colonoscopy in 3 years.',
      qualityScore: 96.0,
      medications: [{ name: 'Propofol', dose: '150mg', route: 'IV', time: '10:30' }],
      equipment: [{ name: 'Olympus CF-HQ190L Colonoscope', serialNo: 'OLY-002', checkTime: '10:20' }],
      documentationData: { indication: 'Screening colonoscopy', bowelPrep: 'Excellent', cecalIntubation: true, polypsFound: true, withdrawalTime: 14 },
    },
    {
      patientId: patients[2].id, physicianId: drPatel.id, specialtyId: pulmSpec.id,
      title: 'Bronchoscopy with BAL', procedureDate: '2026-03-05', status: 'completed',
      findings: 'Vocal cords normal. Trachea patent. Carina sharp. Right lower lobe mass visualized. BAL performed RML. Endobronchial biopsy x3 from RLL lesion.',
      impression: 'RLL endobronchial lesion, biopsies sent for pathology. BAL sent for cultures.',
      qualityScore: 88.0,
      medications: [{ name: 'Midazolam', dose: '3mg', route: 'IV', time: '14:00' }, { name: 'Lidocaine 2%', dose: '200mg', route: 'Topical', time: '14:05' }],
      equipment: [{ name: 'Olympus BF-P190 Bronchoscope', serialNo: 'OLY-003', checkTime: '13:50' }],
      documentationData: { indication: 'RLL mass evaluation', sedation: 'Moderate sedation', scope: 'Olympus BF-P190', balPerformed: true, biopsyTaken: true },
    },
    {
      patientId: patients[3].id, physicianId: drJohnson.id, specialtyId: cardSpec.id,
      title: 'Left Heart Catheterization', procedureDate: '2026-03-07', status: 'signed',
      findings: 'LCA: LAD 70% stenosis mid-vessel. LCx: 40% marginal branch. RCA: Dominant, 60% proximal stenosis. LV function mildly reduced. LVEF 45%.',
      impression: 'Significant two-vessel CAD. LAD and RCA disease. Recommend cardiothoracic surgery consultation for CABG vs PCI decision.',
      qualityScore: 94.5,
      medications: [{ name: 'Heparin', dose: '5000 units', route: 'IV', time: '08:00' }, { name: 'Iodixanol contrast', dose: '180mL', route: 'IA', time: '08:15' }],
      equipment: [{ name: 'Siemens Artis zee Cath Lab', serialNo: 'SIE-001', checkTime: '07:45' }],
      documentationData: { indication: 'NSTEMI evaluation', accessSite: 'Right radial', sheathSize: '6Fr', lvef: 45, contrastUsed: 180, fluoroscopyTime: 18.5 },
    },
    {
      patientId: patients[4].id, physicianId: drSmith.id, specialtyId: giSpec.id,
      title: 'Upper GI Endoscopy', procedureDate: '2026-03-08', status: 'completed',
      findings: 'Esophagus: Grade A esophagitis (LA classification), scattered erosions distal 5cm. Stomach: Normal. Duodenum: Normal.',
      impression: 'Los Angeles Grade A reflux esophagitis. Start PPI therapy.',
      qualityScore: 90.0,
      medications: [{ name: 'Midazolam', dose: '1.5mg', route: 'IV', time: '11:00' }],
      equipment: [{ name: 'Olympus GIF-H190 Gastroscope', serialNo: 'OLY-001', checkTime: '10:55' }],
      documentationData: { indication: 'Chronic GERD evaluation', instrument: 'Olympus GIF-H190', sedation: 'Moderate sedation' },
    },
    {
      patientId: patients[5].id, physicianId: drJohnson.id, specialtyId: cardSpec.id,
      title: 'Echocardiography-Guided Pericardiocentesis', procedureDate: '2026-03-10', status: 'in-progress',
      findings: 'Large pericardial effusion confirmed. Echoguided needle insertion subxiphoid approach.',
      impression: 'Procedure in progress.',
      qualityScore: null,
      medications: [{ name: 'Lidocaine 1%', dose: '10mL', route: 'Local', time: '15:30' }],
      equipment: [{ name: 'GE Vivid E9 Echo Machine', serialNo: 'GE-001', checkTime: '15:20' }],
      documentationData: { indication: 'Cardiac tamponade', accessSite: 'Subxiphoid' },
    },
    {
      patientId: patients[6].id, physicianId: drPatel.id, specialtyId: pulmSpec.id,
      title: 'Bronchoscopy Surveillance', procedureDate: '2026-03-11', status: 'draft',
      findings: '',
      impression: '',
      qualityScore: null,
      medications: [],
      equipment: [],
      documentationData: { indication: '3-month lung cancer surveillance' },
    },
    {
      patientId: patients[7].id, physicianId: drSmith.id, specialtyId: giSpec.id,
      title: 'Colonoscopy', procedureDate: '2026-03-12', status: 'draft',
      findings: '',
      impression: '',
      qualityScore: null,
      medications: [],
      equipment: [],
      documentationData: { indication: 'Colorectal cancer screening age 50' },
    },
  ];

  const createdProcedures = [];
  for (const pd of procedureData) {
    const [proc] = await Procedure.findOrCreate({
      where: { patientId: pd.patientId, title: pd.title, procedureDate: pd.procedureDate },
      defaults: { ...pd, organizationId: org.id },
    });
    createdProcedures.push(proc);
  }
  console.log('Procedures created');

  // ── Billing Codes ──────────────────────────────────────────────
  const billingData = [
    { procedureId: createdProcedures[0].id, cptCode: '43239', icdCode: 'K29.70', description: 'EGD with biopsy', amount: 450.00, status: 'billed' },
    { procedureId: createdProcedures[1].id, cptCode: '45380', icdCode: 'K57.30', description: 'Colonoscopy with polypectomy', amount: 850.00, status: 'confirmed' },
    { procedureId: createdProcedures[2].id, cptCode: '31625', icdCode: 'C34.31', description: 'Bronchoscopy with biopsy', amount: 950.00, status: 'suggested' },
    { procedureId: createdProcedures[3].id, cptCode: '93458', icdCode: 'I25.10', description: 'Left heart cath with ventriculography', amount: 3200.00, status: 'billed' },
    { procedureId: createdProcedures[4].id, cptCode: '43239', icdCode: 'K21.0', description: 'EGD with biopsy - GERD', amount: 450.00, status: 'suggested' },
  ];

  for (const bd of billingData) {
    await BillingCode.findOrCreate({ where: { procedureId: bd.procedureId, cptCode: bd.cptCode }, defaults: bd });
  }
  console.log('Billing codes created');

  // ── Consents ───────────────────────────────────────────────────
  const consentData = [
    { patientId: patients[0].id, procedureId: createdProcedures[0].id, witnessId: nurseWilson.id, consentType: 'procedure', signatureData: 'Alice Thompson', signedAt: new Date('2026-03-01T08:30:00'), isValid: true },
    { patientId: patients[1].id, procedureId: createdProcedures[1].id, witnessId: nurseWilson.id, consentType: 'procedure', signatureData: 'Robert Martinez', signedAt: new Date('2026-03-03T09:45:00'), isValid: true },
    { patientId: patients[2].id, procedureId: createdProcedures[2].id, witnessId: nurseWilson.id, consentType: 'procedure', signatureData: 'Patricia Williams', signedAt: new Date('2026-03-05T13:20:00'), isValid: true },
    { patientId: patients[3].id, procedureId: createdProcedures[3].id, witnessId: nurseWilson.id, consentType: 'procedure', signatureData: 'James Davis', signedAt: new Date('2026-03-07T07:30:00'), isValid: true },
    { patientId: patients[4].id, procedureId: createdProcedures[4].id, witnessId: nurseWilson.id, consentType: 'procedure', signatureData: null, isValid: false },
    { patientId: patients[5].id, procedureId: createdProcedures[5].id, witnessId: nurseWilson.id, consentType: 'procedure', signatureData: 'Michael Anderson', signedAt: new Date('2026-03-10T15:00:00'), isValid: true },
  ];

  for (const cd of consentData) {
    await Consent.findOrCreate({
      where: { patientId: cd.patientId, procedureId: cd.procedureId },
      defaults: cd,
    });
  }
  console.log('Consents created');

  // â”€â”€ Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const reportData = [
    {
      procedureId: createdProcedures[0].id,
      type: 'structured',
      content: JSON.stringify({
        summary: 'Upper GI endoscopy completed with biopsy.',
        findings: 'Mild antral gastritis.',
        impression: 'Likely H. pylori related gastritis.',
      }),
      generatedBy: drSmith.id,
    },
    {
      procedureId: createdProcedures[1].id,
      type: 'hl7',
      content: 'MSH|^~\\&|PROCEDUREFLOW||EMR||20260303114500||ORU^R01|demo-1|P|2.5',
      generatedBy: drSmith.id,
    },
    {
      procedureId: createdProcedures[3].id,
      type: 'structured',
      content: JSON.stringify({
        summary: 'Diagnostic cath completed.',
        findings: 'Two-vessel coronary artery disease.',
        plan: 'Surgical consult for CABG vs PCI.',
      }),
      generatedBy: drJohnson.id,
    },
  ];

  for (const rd of reportData) {
    await Report.findOrCreate({
      where: { procedureId: rd.procedureId, type: rd.type },
      defaults: rd,
    });
  }
  console.log('Reports created');

  // ── Schedules ──────────────────────────────────────────────────
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const scheduleData = [
    { patientId: patients[0].id, physicianId: drSmith.id, specialtyId: giSpec.id, scheduledDate: today, scheduledTime: '09:00:00', procedureType: 'Upper GI Endoscopy Follow-up', status: 'confirmed', priority: 'routine', room: 'Endo Suite 1', estimatedDuration: 30 },
    { patientId: patients[1].id, physicianId: drSmith.id, specialtyId: giSpec.id, scheduledDate: today, scheduledTime: '10:00:00', procedureType: 'Colonoscopy Screening', status: 'scheduled', priority: 'routine', room: 'Endo Suite 2', estimatedDuration: 45 },
    { patientId: patients[2].id, physicianId: drPatel.id, specialtyId: pulmSpec.id, scheduledDate: today, scheduledTime: '14:00:00', procedureType: 'Bronchoscopy Follow-up', status: 'confirmed', priority: 'urgent', room: 'Bronch Suite', estimatedDuration: 60 },
    { patientId: patients[3].id, physicianId: drJohnson.id, specialtyId: cardSpec.id, scheduledDate: tomorrowStr, scheduledTime: '08:00:00', procedureType: 'PCI - LAD Stenting', status: 'confirmed', priority: 'urgent', room: 'Cath Lab 1', estimatedDuration: 90 },
    { patientId: patients[4].id, physicianId: drSmith.id, specialtyId: giSpec.id, scheduledDate: tomorrowStr, scheduledTime: '11:00:00', procedureType: 'Upper GI Endoscopy', status: 'scheduled', priority: 'routine', room: 'Endo Suite 1', estimatedDuration: 30 },
    { patientId: patients[5].id, physicianId: drJohnson.id, specialtyId: cardSpec.id, scheduledDate: tomorrowStr, scheduledTime: '15:00:00', procedureType: 'Echocardiogram', status: 'scheduled', priority: 'routine', room: 'Echo Lab', estimatedDuration: 45 },
    { patientId: patients[6].id, physicianId: drPatel.id, specialtyId: pulmSpec.id, scheduledDate: tomorrowStr, scheduledTime: '09:00:00', procedureType: 'Thoracentesis', status: 'confirmed', priority: 'urgent', room: 'Procedure Room 2', estimatedDuration: 60 },
  ];

  for (const sd of scheduleData) {
    await Schedule.findOrCreate({
      where: { patientId: sd.patientId, scheduledDate: sd.scheduledDate, scheduledTime: sd.scheduledTime },
      defaults: { ...sd, organizationId: org.id },
    });
  }
  console.log('Schedules created');

  // ── Notifications ──────────────────────────────────────────────
  const notifData = [
    { userId: drSmith.id, organizationId: org.id, type: 'procedure_completed', title: 'Procedure Completed', message: 'Colonoscopy for Robert Martinez has been completed and is ready for signature.', entityType: 'Procedure', entityId: createdProcedures[1].id, priority: 'high', isRead: false },
    { userId: drSmith.id, organizationId: org.id, type: 'schedule_reminder', title: 'Upcoming Procedure - 1 Hour', message: 'Upper GI Endoscopy scheduled for Alice Thompson at 09:00 today.', entityType: 'Schedule', priority: 'medium', isRead: false },
    { userId: drJohnson.id, organizationId: org.id, type: 'billing_pending', title: 'Billing Review Required', message: 'Left heart catheterization for James Davis requires billing code review.', entityType: 'Procedure', entityId: createdProcedures[3].id, priority: 'medium', isRead: false },
    { userId: admin.id, organizationId: org.id, type: 'report_ready', title: 'Compliance Report Ready', message: 'Monthly compliance report for February 2026 has been generated.', entityType: 'Report', priority: 'low', isRead: true },
    { userId: drPatel.id, organizationId: org.id, type: 'consent_required', title: 'Consent Pending', message: 'Patient Patricia Williams has a pending consent for upcoming bronchoscopy.', entityType: 'Consent', priority: 'high', isRead: false },
    { userId: nurseWilson.id, organizationId: org.id, type: 'schedule_reminder', title: 'Today\'s Schedule', message: '3 procedures scheduled today. Next: Upper GI Endoscopy at 09:00.', priority: 'medium', isRead: false },
    { userId: admin.id, organizationId: org.id, type: 'quality_alert', title: 'Quality Score Alert', message: 'Bronchoscopy procedure quality score (88.0) is below target threshold of 90.', entityType: 'Procedure', entityId: createdProcedures[2].id, priority: 'high', isRead: false },
  ];

  for (const nd of notifData) {
    await Notification.findOrCreate({
      where: { userId: nd.userId, type: nd.type, message: nd.message },
      defaults: nd,
    });
  }
  console.log('Notifications created');

  // â”€â”€ Audit Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const auditLogData = [
    {
      userId: admin.id,
      action: 'CREATE_PATIENT',
      entityType: 'Patient',
      entityId: patients[0].id,
      details: { mrn: patients[0].mrn },
    },
    {
      userId: drSmith.id,
      action: 'CREATE_PROCEDURE',
      entityType: 'Procedure',
      entityId: createdProcedures[0].id,
      details: { title: createdProcedures[0].title, status: createdProcedures[0].status },
    },
    {
      userId: drSmith.id,
      action: 'STATUS_CHANGE',
      entityType: 'Procedure',
      entityId: createdProcedures[1].id,
      details: { from: 'completed', to: 'signed' },
    },
    {
      userId: nurseWilson.id,
      action: 'UPDATE_PATIENT',
      entityType: 'Patient',
      entityId: patients[2].id,
      details: { field: 'insuranceInfo' },
    },
    {
      userId: admin.id,
      action: 'GENERATE_REPORT',
      entityType: 'Report',
      entityId: null,
      details: { reportTypes: reportData.map((report) => report.type) },
    },
  ];

  for (const entry of auditLogData) {
    await AuditLog.findOrCreate({
      where: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
      },
      defaults: entry,
    });
  }
  console.log('Audit logs created');

  console.log('\n═══════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log('  Admin:      admin@demo.com       / Admin@123');
  console.log('  Physician:  dr.smith@demo.com    / Doctor@123');
  console.log('  Physician:  dr.johnson@demo.com  / Doctor@123');
  console.log('  Physician:  dr.patel@demo.com    / Doctor@123');
  console.log('  Nurse:      nurse.wilson@demo.com/ Nurse@123');
  console.log('  Technician: tech.brown@demo.com  / Tech@123');
  console.log('  Organization ID:', org.id);
  console.log('═══════════════════════════════════════════\n');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
