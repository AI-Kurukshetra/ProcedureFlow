CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id),
  consent_type VARCHAR(100) NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  witness_id UUID REFERENCES users(id),
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consents_patient_id ON consents(patient_id);
CREATE INDEX idx_consents_procedure_id ON consents(procedure_id);
