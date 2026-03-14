CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE users ADD CONSTRAINT fk_users_specialty FOREIGN KEY (specialty_id) REFERENCES specialties(id);

INSERT INTO specialties (name, code, description) VALUES
  ('Gastroenterology', 'GI', 'Gastrointestinal procedures'),
  ('Pulmonology', 'PULM', 'Pulmonary procedures'),
  ('Cardiology', 'CARD', 'Cardiac procedures')
ON CONFLICT (code) DO NOTHING;
