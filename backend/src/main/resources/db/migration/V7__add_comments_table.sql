-- Add comments table for habit log comments
CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    habit_log_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content VARCHAR(500) NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT fk_comments_habit_log FOREIGN KEY (habit_log_id) REFERENCES habit_logs(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comments_habit_log_id ON comments(habit_log_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
