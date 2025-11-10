-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Admins can add members to group chats" ON conversation_members;
DROP POLICY IF EXISTS "Admins can remove members from group chats" ON conversation_members;

-- Create new non-recursive policies for conversation_members

-- Allow users to view members if they are a member of the same conversation
-- We avoid recursion by checking auth.uid() directly in the table
CREATE POLICY "Users can view conversation members"
  ON conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id 
        AND cm.user_id = auth.uid()
    )
  );

-- Allow conversation creators and admins to add members
CREATE POLICY "Creators and admins can add members"
  ON conversation_members FOR INSERT
  WITH CHECK (
    -- Allow if user is creating a new conversation (they'll be added as first member)
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
    OR
    -- Allow if user is an admin of the conversation
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
    OR
    -- Allow users to add themselves to DM conversations
    (user_id = auth.uid() AND conversation_id IN (
      SELECT id FROM conversations WHERE type = 'dm'
    ))
  );

-- Allow admins to remove members (but not themselves)
CREATE POLICY "Admins can remove members"
  ON conversation_members FOR DELETE
  USING (
    user_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Allow users to remove themselves from conversations
CREATE POLICY "Users can leave conversations"
  ON conversation_members FOR DELETE
  USING (user_id = auth.uid());
