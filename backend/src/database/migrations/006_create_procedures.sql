CREATE TYPE procedure_status AS ENUM ('draft', 'in-progress', 'completed', 'signed');

CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  physician_id UUID NOT NULL REFERENCES users(id),
  template_id UUID REFERENCES templates(id),
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  status procedure_status DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  procedure_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  findings TEXT,
  impression TEXT,
  complications TEXT,
  medications JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  documentation_data JSONB DEFAULT '{}',
  quality_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_procedures_patient_id ON procedures(patient_id);
CREATE INDEX idx_procedures_physician_id ON procedures(physician_id);
CREATE INDEX idx_procedures_organization_status ON procedures(organization_id, status);
CREATE INDEX idx_procedures_date ON procedures(procedure_date DESC);
