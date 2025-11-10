-- Add acknowledged field to user_warnings table
ALTER TABLE user_warnings
ADD COLUMN IF NOT EXISTS acknowledged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS acknowledged_at timestamp with time zone;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_warnings_unacknowledged 
ON user_warnings(user_id, acknowledged) 
WHERE acknowledged = false;
