-- Drop all existing RLS policies on conversations and conversation_members
-- This script completely removes the problematic policies causing infinite recursion

-- Drop all policies on conversation_members
DROP POLICY IF EXISTS "Users can view their own memberships" ON conversation_members;
DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can add members to conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_members;
DROP POLICY IF EXISTS "Admins can remove members" ON conversation_members;
DROP POLICY IF EXISTS "conversation_members_select_policy" ON conversation_members;
DROP POLICY IF EXISTS "conversation_members_insert_policy" ON conversation_members;
DROP POLICY IF EXISTS "conversation_members_delete_policy" ON conversation_members;

-- Drop all policies on conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;

-- Drop all policies on messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

-- Drop helper functions
DROP FUNCTION IF EXISTS is_conversation_member(uuid, uuid);
DROP FUNCTION IF EXISTS is_conversation_admin(uuid, uuid);
DROP FUNCTION IF EXISTS get_or_create_dm_conversation(uuid, uuid);

-- Temporarily disable RLS on these tables
-- This allows the app to work while we fix the schema
ALTER TABLE conversation_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Note: This is a temporary solution. In production, you should:
-- 1. Use service role key for server-side queries
-- 2. Implement proper RLS policies without circular dependencies
-- 3. Use API routes with proper authentication instead of direct client queries
