-- Ensure all users can post by default
-- Set accepted_guidelines to true for all existing users
UPDATE profiles
SET accepted_guidelines = true
WHERE accepted_guidelines IS NULL OR accepted_guidelines = false;

-- Set default value for new users
ALTER TABLE profiles
ALTER COLUMN accepted_guidelines SET DEFAULT true;

-- Ensure posting is enabled in site settings
INSERT INTO site_settings (key, value, updated_at)
VALUES ('posting_enabled', 'true'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = NOW();

-- Clear expired bans
UPDATE profiles
SET is_banned = false,
    ban_expires_at = NULL
WHERE is_banned = true
AND ban_expires_at IS NOT NULL
AND ban_expires_at < NOW();
