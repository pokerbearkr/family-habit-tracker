-- Add completed_at column to habit_logs table to track when a habit was completed
ALTER TABLE habit_logs ADD COLUMN completed_at TIMESTAMP;

-- Update existing completed logs to use created_at as completed_at
UPDATE habit_logs SET completed_at = created_at WHERE completed = true;
