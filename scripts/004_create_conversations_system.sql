-- Create conversations table for both DMs and group chats
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  name TEXT, -- Only for group chats
  avatar_url TEXT, -- Only for group chats
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_members table to track who's in each conversation
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table (replaces direct_messages for new system)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they're part of"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update group conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for conversation_members
CREATE POLICY "Users can view members of their conversations"
  ON conversation_members FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members to group chats"
  ON conversation_members FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can remove members from group chats"
  ON conversation_members FOR DELETE
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when a message is sent
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON messages;
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get or create a DM conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing DM conversation between these two users
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.type = 'dm'
    AND EXISTS (
      SELECT 1 FROM conversation_members cm1 
      WHERE cm1.conversation_id = c.id AND cm1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM conversation_members cm2 
      WHERE cm2.conversation_id = c.id AND cm2.user_id = user2_id
    )
    AND (
      SELECT COUNT(*) FROM conversation_members cm 
      WHERE cm.conversation_id = c.id
    ) = 2
  LIMIT 1;

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (type, created_by)
    VALUES ('dm', user1_id)
    RETURNING id INTO conversation_id;

    -- Add both users as members
    INSERT INTO conversation_members (conversation_id, user_id, role)
    VALUES 
      (conversation_id, user1_id, 'member'),
      (conversation_id, user2_id, 'member');
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
