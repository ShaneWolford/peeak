-- Make realjohncs@gmail.com an admin
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'realjohncs@gmail.com'
);
