-- Set shaneswolfords@gmail.com as admin
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'shaneswolfords@gmail.com'
);
