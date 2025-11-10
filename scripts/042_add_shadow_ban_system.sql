-- Add shadow ban feature to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_shadow_banned ON profiles(is_shadow_banned) WHERE is_shadow_banned = TRUE;

-- Remove IF NOT EXISTS which is not supported in CREATE POLICY
-- Drop policy if it exists before creating
DROP POLICY IF EXISTS "Admins can manage shadow bans" ON profiles;

-- Update RLS policy to allow admins to update shadow ban status
CREATE POLICY "Admins can manage shadow bans"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.is_admin = TRUE
  )
);

-- Function to hide shadow banned users' content from feeds
CREATE OR REPLACE FUNCTION is_user_shadow_banned(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND is_shadow_banned = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
