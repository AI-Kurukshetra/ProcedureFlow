CREATE TABLE IF NOT EXISTS billing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  cpt_code VARCHAR(20),
  icd_code VARCHAR(20),
  description TEXT,
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'suggested' CHECK (status IN ('suggested', 'confirmed', 'billed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_codes_procedure_id ON billing_codes(procedure_id);
