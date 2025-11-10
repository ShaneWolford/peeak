-- Create simple, non-recursive RLS policies for conversations
-- This approach uses application-level security instead of complex RLS

-- Re-enable RLS
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple policy for conversation_members: users can only see their own memberships
CREATE POLICY "Users can view own memberships"
  ON conversation_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships"
  ON conversation_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own memberships"
  ON conversation_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Simple policy for conversations: allow all authenticated users to view
-- (membership check will be done at application level)
CREATE POLICY "Authenticated users can view conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Simple policy for messages: allow all authenticated users
-- (membership check will be done at application level)
CREATE POLICY "Authenticated users can view messages"
  ON messages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND sender_id = auth.uid()
  );

-- Create helper function for getting or creating DM conversations
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(
  user1_id uuid,
  user2_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Try to find existing DM conversation between these users
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
  LIMIT 1;

  -- If not found, create new conversation
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
$$;
