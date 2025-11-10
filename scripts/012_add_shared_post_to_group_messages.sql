-- Add shared_post_id column to messages table for group chat post sharing
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES posts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_shared_post_id ON messages(shared_post_id);

-- Add comment for documentation
COMMENT ON COLUMN messages.shared_post_id IS 'Reference to a post that was shared in this group chat message';
