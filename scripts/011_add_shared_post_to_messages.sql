-- Add shared_post_id column to direct_messages table
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_shared_post_id ON direct_messages(shared_post_id);

-- Add comment for documentation
COMMENT ON COLUMN direct_messages.shared_post_id IS 'Reference to a post that was shared in this message';
