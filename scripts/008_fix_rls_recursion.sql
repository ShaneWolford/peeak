-- Drop all existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can update group conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Admins can add members to group chats" ON conversation_members;
DROP POLICY IF EXISTS "Admins can remove members from group chats" ON conversation_members;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

-- Create helper function to check if user is in a conversation (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION is_conversation_member(conversation_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_members.conversation_id = $1 
    AND conversation_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is admin of a conversation
CREATE OR REPLACE FUNCTION is_conversation_admin(conversation_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_members.conversation_id = $1 
    AND conversation_members.user_id = $2 
    AND conversation_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NEW RLS Policies for conversation_members (no circular dependencies)
CREATE POLICY "Users can view their own membership"
  ON conversation_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view other members in their conversations"
  ON conversation_members FOR SELECT
  USING (is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Conversation creators can add initial members"
  ON conversation_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can add members"
  ON conversation_members FOR INSERT
  WITH CHECK (is_conversation_admin(conversation_id, auth.uid()));

CREATE POLICY "Users can leave conversations"
  ON conversation_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON conversation_members FOR DELETE
  USING (is_conversation_admin(conversation_id, auth.uid()));

-- NEW RLS Policies for conversations (using helper functions)
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (is_conversation_member(id, auth.uid()));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update conversations"
  ON conversations FOR UPDATE
  USING (is_conversation_admin(id, auth.uid()));

-- NEW RLS Policies for messages (using helper functions)
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    is_conversation_member(conversation_id, auth.uid())
  );

CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (is_conversation_member(conversation_id, auth.uid()));
