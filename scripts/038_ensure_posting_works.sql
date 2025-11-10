-- Ensure all users can post by setting accepted_guidelines to true for any null values
UPDATE profiles
SET accepted_guidelines = true
WHERE accepted_guidelines IS NULL;

-- Ensure posting is enabled in site settings
INSERT INTO site_settings (key, value)
VALUES ('posting_enabled', 'true')
ON CONFLICT (key) 
DO UPDATE SET value = 'true';

-- Add helpful comments to the posts table RLS policy
COMMENT ON POLICY "Users can insert their own posts" ON posts IS 
'Allows authenticated users to create posts as long as they are not banned';
