const { Patient, Procedure } = require('../models');

// Simulates EMR integration endpoints
exports.emrSync = async (req, res) => {
  try {
    const { emrSystem, patientEmrId } = req.body;
    // Simulated EMR patient data (Epic/Cerner format)
    const emrPatientData = {
      emrId: patientEmrId,
      emrSystem,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1975-03-15',
      gender: 'Male',
      mrn: `EMR-${patientEmrId}`,
      phone: '555-0199',
      address: '456 Health Ave, Medical City, MC 54321',
      insuranceInfo: {
        provider: 'Blue Cross Blue Shield',
        memberId: `BCBS-${Date.now()}`,
        groupNumber: 'GRP-001',
        preAuthRequired: true,
      },
      lastSyncAt: new Date(),
    };
    res.json({ success: true, data: emrPatientData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.hl7Export = async (req, res) => {
  try {
    const { procedureId } = req.params;
    const procedure = await Procedure.findOne({
      where: { id: procedureId, organizationId: req.user.organizationId },
      include: [{ association: 'patient' }, { association: 'physician' }, { association: 'specialty' }],
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    const now = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const hl7 = [
      `MSH|^~\\&|PROCEDUREFLOW||EMR||${now}||ORU^R01|${procedure.id}|P|2.5`,
      `PID|1||${procedure.patient?.mrn || ''}|||${procedure.patient?.lastName || ''}^${procedure.patient?.firstName || ''}||${procedure.patient?.dateOfBirth || ''}|${procedure.patient?.gender || ''}`,
      `OBR|1||${procedure.id}|${procedure.title}|||${procedure.procedureDate}`,
      `OBX|1|TX|SPECIALTY||${procedure.specialty?.name || ''}`,
      `OBX|2|TX|PHYSICIAN||Dr. ${procedure.physician?.firstName || ''} ${procedure.physician?.lastName || ''}`,
      `OBX|3|TX|FINDINGS||${procedure.findings || ''}`,
      `OBX|4|TX|IMPRESSION||${procedure.impression || ''}`,
      `OBX|5|TX|COMPLICATIONS||${procedure.complications || 'None'}`,
      `OBX|6|TX|STATUS||${procedure.status}`,
    ].join('\r\n');

    res.json({ success: true, data: { hl7, procedureId, exportedAt: new Date() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.fhirExport = async (req, res) => {
  try {
    const { procedureId } = req.params;
    const procedure = await Procedure.findOne({
      where: { id: procedureId, organizationId: req.user.organizationId },
      include: [{ association: 'patient' }, { association: 'physician' }, { association: 'specialty' }],
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    const fhirResource = {
      resourceType: 'Procedure',
      id: procedure.id,
      status: procedure.status === 'signed' ? 'completed' : procedure.status,
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          display: procedure.title,
        }],
        text: procedure.title,
      },
      subject: {
        reference: `Patient/${procedure.patientId}`,
        display: `${procedure.patient?.firstName} ${procedure.patient?.lastName}`,
      },
      performedDateTime: procedure.procedureDate,
      performer: [{
        actor: {
          reference: `Practitioner/${procedure.physicianId}`,
          display: `Dr. ${procedure.physician?.firstName} ${procedure.physician?.lastName}`,
        },
      }],
      note: procedure.findings ? [{ text: procedure.findings }] : [],
    };

    res.json({ success: true, data: fhirResource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.voiceTranscribe = async (req, res) => {
  try {
    // Simulated voice-to-text transcription
    // In production, this would call a real speech-to-text API
    const mockTranscriptions = [
      'Patient underwent upper GI endoscopy. Esophagus appeared normal with no signs of reflux esophagitis. Stomach showed mild gastritis. Duodenum was normal. Biopsy taken from antrum for H. pylori testing.',
      'Colonoscopy performed to cecum. Bowel preparation was good. No polyps identified. Mild diverticulosis in sigmoid colon. Hemorrhoids noted at ano-rectal junction. Withdrawal time 12 minutes.',
      'Bronchoscopy performed under moderate sedation. Airways examined to subsegmental level bilaterally. Bronchoalveolar lavage performed in right middle lobe. Forceps biopsy taken from right lower lobe lesion.',
    ];
    const transcript = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    res.json({
      success: true,
      data: {
        transcript,
        confidence: 0.94,
        language: 'en-US',
        duration: req.body.duration || 45,
        transcribedAt: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEmrSystems = async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'epic', name: 'Epic', status: 'available', version: '2024.1' },
      { id: 'cerner', name: 'Cerner PowerChart', status: 'available', version: '2023.4' },
      { id: 'meditech', name: 'MEDITECH', status: 'available', version: '8.1' },
      { id: 'allscripts', name: 'Allscripts', status: 'available', version: '2024.2' },
      { id: 'athena', name: 'athenahealth', status: 'available', version: '2024.1' },
    ],
  });
};
