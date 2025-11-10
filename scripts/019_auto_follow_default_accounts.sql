-- Function to automatically follow default accounts (@peeak and @shane) for new users
CREATE OR REPLACE FUNCTION auto_follow_default_accounts()
RETURNS TRIGGER AS $$
DECLARE
  peeak_user_id UUID;
  shane_user_id UUID;
BEGIN
  -- Get the user IDs for @peeak and @shane
  SELECT id INTO peeak_user_id FROM profiles WHERE username = 'peeak' LIMIT 1;
  SELECT id INTO shane_user_id FROM profiles WHERE username = 'shane' LIMIT 1;
  
  -- Follow @peeak if the account exists and it's not the new user
  IF peeak_user_id IS NOT NULL AND NEW.id != peeak_user_id THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.id, peeak_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Follow @shane if the account exists and it's not the new user
  IF shane_user_id IS NOT NULL AND NEW.id != shane_user_id THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.id, shane_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after a new profile is inserted
DROP TRIGGER IF EXISTS trigger_auto_follow_default_accounts ON profiles;
CREATE TRIGGER trigger_auto_follow_default_accounts
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_follow_default_accounts();
