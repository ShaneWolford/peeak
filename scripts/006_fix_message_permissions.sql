-- Add RLS policy to allow users to update their own sent messages
-- This is needed for editing and deleting messages

-- Drop the restrictive policy that only allows updating received messages
DROP POLICY IF EXISTS "Users can update messages they received" ON direct_messages;

-- Create new policies for updating messages
CREATE POLICY "Users can update their own sent messages"
ON direct_messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received"
ON direct_messages
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid());

-- Same for group messages
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;

CREATE POLICY "Users can update their own sent group messages"
ON messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Users can update group messages in their conversations"
ON messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_members.conversation_id = messages.conversation_id
    AND conversation_members.user_id = auth.uid()
  )
);
