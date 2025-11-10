-- Add new columns to messages table for status tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT FALSE;

-- Add new columns to direct_messages table for status tracking
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT FALSE;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create direct message reactions table
CREATE TABLE IF NOT EXISTS direct_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create typing indicators table (ephemeral data, can be cleaned up periodically)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create direct message typing indicators table
CREATE TABLE IF NOT EXISTS dm_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, recipient_id)
);

-- Create muted conversations table
CREATE TABLE IF NOT EXISTS muted_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  muted_until TIMESTAMP WITH TIME ZONE, -- NULL means muted indefinitely
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

-- Create muted direct messages table
CREATE TABLE IF NOT EXISTS muted_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  other_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  muted_until TIMESTAMP WITH TIME ZONE, -- NULL means muted indefinitely
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, other_user_id)
);

-- Add online status tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_reactions_message_id ON direct_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);
CREATE INDEX IF NOT EXISTS idx_dm_typing_indicators_recipient ON dm_typing_indicators(recipient_id);
CREATE INDEX IF NOT EXISTS idx_muted_conversations_user_id ON muted_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_muted_direct_messages_user_id ON muted_direct_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_direct_messages_status ON direct_messages(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions in their conversations"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm
      JOIN messages m ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions to messages in their conversations"
  ON message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_members cm
      JOIN messages m ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_reactions.message_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for direct_message_reactions
CREATE POLICY "Users can view reactions in their DMs"
  ON direct_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE dm.id = direct_message_reactions.message_id
      AND (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to DMs"
  ON direct_message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE dm.id = direct_message_reactions.message_id
      AND (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON direct_message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for typing_indicators
CREATE POLICY "Users can view typing indicators in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = typing_indicators.conversation_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing indicators"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for dm_typing_indicators
CREATE POLICY "Users can view typing indicators in their DMs"
  ON dm_typing_indicators FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can update their own typing indicators"
  ON dm_typing_indicators FOR ALL
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- RLS Policies for muted_conversations
CREATE POLICY "Users can view their own muted conversations"
  ON muted_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mute conversations"
  ON muted_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unmute conversations"
  ON muted_conversations FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for muted_direct_messages
CREATE POLICY "Users can view their own muted DMs"
  ON muted_direct_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mute DMs"
  ON muted_direct_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unmute DMs"
  ON muted_direct_messages FOR DELETE
  USING (user_id = auth.uid());

-- Function to clean up old typing indicators (run periodically)
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators WHERE updated_at < NOW() - INTERVAL '10 seconds';
  DELETE FROM dm_typing_indicators WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
