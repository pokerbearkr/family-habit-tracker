-- Add enable_reminders column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS enable_reminders BOOLEAN NOT NULL DEFAULT true;
