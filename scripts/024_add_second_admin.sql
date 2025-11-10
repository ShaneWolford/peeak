-- Add shanew.2026@mtchs.org as an admin account
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'shanew.2026@mtchs.org'
);
