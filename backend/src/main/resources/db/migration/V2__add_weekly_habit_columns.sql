-- Add habit_type and selected_days columns to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type VARCHAR(20) NOT NULL DEFAULT 'DAILY';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS selected_days VARCHAR(50);

-- Update existing habits to have DAILY type
UPDATE habits SET habit_type = 'DAILY' WHERE habit_type IS NULL;
