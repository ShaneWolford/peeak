-- Allow existing users to post by setting accepted_guidelines to true
-- This only affects users created before the guidelines system was implemented
UPDATE profiles 
SET accepted_guidelines = true, 
    guidelines_accepted_at = created_at
WHERE accepted_guidelines = false 
  AND created_at < NOW();

-- Add a comment for documentation
COMMENT ON COLUMN profiles.accepted_guidelines IS 'Whether the user has accepted community guidelines. Defaults to false for new users, automatically set to true for existing users during migration.';
