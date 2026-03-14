CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pdf', 'hl7', 'structured')),
  content TEXT,
  file_path VARCHAR(500),
  generated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_procedure_id ON reports(procedure_id);
