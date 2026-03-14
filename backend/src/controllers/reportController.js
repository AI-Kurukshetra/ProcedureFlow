const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Report, Procedure, Patient, User, Specialty } = require('../models');
const config = require('../config/app');

exports.generate = async (req, res) => {
  try {
    const { procedureId, type = 'pdf' } = req.body;

    const procedure = await Procedure.findOne({
      where: { id: procedureId, organizationId: req.user.organizationId },
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'physician', attributes: ['id', 'firstName', 'lastName'] },
        { model: Specialty, as: 'specialty' },
      ],
    });
    if (!procedure) return res.status(404).json({ success: false, error: 'Procedure not found' });

    let content = '';
    let filePath = null;

    if (type === 'pdf') {
      const reportsDir = path.join(config.upload.path, 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      filePath = path.join(reportsDir, `report_${procedureId}_${Date.now()}.pdf`);
      await generatePDF(procedure, filePath);
    } else if (type === 'hl7') {
      content = generateHL7(procedure);
    } else {
      content = JSON.stringify(procedure.toJSON(), null, 2);
    }

    const report = await Report.create({
      procedureId,
      type,
      content,
      filePath,
      generatedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getByProcedure = async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { procedureId: req.params.procedureId },
      include: [{ model: User, as: 'generatedByUser', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.download = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report || !report.filePath) {
      return res.status(404).json({ success: false, error: 'Report file not found' });
    }
    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on disk' });
    }
    res.download(report.filePath);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

function generatePDF(procedure, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).font('Helvetica-Bold').text('ProcedureFlow - Procedure Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Procedure Information');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Title: ${procedure.title}`);
    doc.text(`Date: ${procedure.procedureDate}`);
    doc.text(`Status: ${procedure.status}`);
    doc.text(`Specialty: ${procedure.specialty?.name || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
    doc.fontSize(11).font('Helvetica');
    if (procedure.patient) {
      doc.text(`Name: ${procedure.patient.firstName} ${procedure.patient.lastName}`);
      doc.text(`MRN: ${procedure.patient.mrn}`);
      doc.text(`DOB: ${procedure.patient.dateOfBirth}`);
    }
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Physician');
    doc.fontSize(11).font('Helvetica');
    if (procedure.physician) {
      doc.text(`Dr. ${procedure.physician.firstName} ${procedure.physician.lastName}`);
    }
    doc.moveDown();

    if (procedure.findings) {
      doc.fontSize(14).font('Helvetica-Bold').text('Findings');
      doc.fontSize(11).font('Helvetica').text(procedure.findings);
      doc.moveDown();
    }
    if (procedure.impression) {
      doc.fontSize(14).font('Helvetica-Bold').text('Impression');
      doc.fontSize(11).font('Helvetica').text(procedure.impression);
      doc.moveDown();
    }
    if (procedure.complications) {
      doc.fontSize(14).font('Helvetica-Bold').text('Complications');
      doc.fontSize(11).font('Helvetica').text(procedure.complications);
      doc.moveDown();
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function generateHL7(procedure) {
  const now = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  return [
    `MSH|^~\\&|PROCEDUREFLOW||EMR||${now}||ORU^R01|${procedure.id}|P|2.5`,
    `PID|1||${procedure.patient?.mrn || ''}|||${procedure.patient?.lastName || ''}^${procedure.patient?.firstName || ''}||${procedure.patient?.dateOfBirth || ''}|${procedure.patient?.gender || ''}`,
    `OBR|1||${procedure.id}|${procedure.title}|||${procedure.procedureDate}`,
    `OBX|1|TX|FINDINGS||${procedure.findings || ''}`,
    `OBX|2|TX|IMPRESSION||${procedure.impression || ''}`,
  ].join('\r\n');
}
