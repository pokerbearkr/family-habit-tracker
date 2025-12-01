-- Add reminder_time column for customizable notification time
ALTER TABLE users ADD COLUMN reminder_time VARCHAR(5) DEFAULT '21:00';
