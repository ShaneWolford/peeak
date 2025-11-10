-- Function to handle referrals after profile creation
CREATE OR REPLACE FUNCTION handle_new_user_referral()
RETURNS TRIGGER AS $$
DECLARE
  ref_code text;
  referrer_profile_id uuid;
BEGIN
  -- Get the referral code from auth.users metadata
  SELECT raw_user_meta_data->>'referral_code' INTO ref_code
  FROM auth.users
  WHERE id = NEW.id;

  -- If there's a referral code, process it
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    -- Find the referrer by their referral code
    SELECT id INTO referrer_profile_id
    FROM profiles
    WHERE referral_code = ref_code
    AND id != NEW.id; -- Don't allow self-referrals

    -- If referrer found, create the referral record
    IF referrer_profile_id IS NOT NULL THEN
      -- Update the new user's referred_by field
      UPDATE profiles
      SET referred_by = referrer_profile_id
      WHERE id = NEW.id;

      -- Create the referral record
      INSERT INTO referrals (referrer_id, referred_user_id)
      VALUES (referrer_profile_id, NEW.id)
      ON CONFLICT (referred_user_id) DO NOTHING;

      RAISE NOTICE 'Referral created: % referred by %', NEW.id, referrer_profile_id;
    ELSE
      RAISE NOTICE 'Referral code not found: %', ref_code;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_new_user_referral_trigger ON profiles;

-- Create trigger that runs AFTER profile insert
CREATE TRIGGER handle_new_user_referral_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_referral();

-- Update the referral badge trigger to be more robust
CREATE OR REPLACE FUNCTION check_referral_badge()
RETURNS TRIGGER AS $$
DECLARE
  referral_count integer;
  referral_badge_id uuid;
  badge_exists boolean;
BEGIN
  -- Count referrals for this user
  SELECT COUNT(*) INTO referral_count
  FROM referrals
  WHERE referrer_id = NEW.referrer_id;

  RAISE NOTICE 'User % now has % referrals', NEW.referrer_id, referral_count;

  -- If user has 5 or more referrals, award the badge
  IF referral_count >= 5 THEN
    -- Get the referral badge ID
    SELECT id INTO referral_badge_id
    FROM badges
    WHERE name = 'Referral Master'
    LIMIT 1;

    -- Check if user already has the badge
    SELECT EXISTS(
      SELECT 1 FROM user_badges
      WHERE user_id = NEW.referrer_id
      AND badge_id = referral_badge_id
    ) INTO badge_exists;

    -- Award the badge if not already awarded
    IF referral_badge_id IS NOT NULL AND NOT badge_exists THEN
      INSERT INTO user_badges (user_id, badge_id, assigned_by)
      VALUES (NEW.referrer_id, referral_badge_id, NEW.referrer_id);
      
      RAISE NOTICE 'Referral badge awarded to user %', NEW.referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS check_referral_badge_trigger ON referrals;
CREATE TRIGGER check_referral_badge_trigger
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_badge();
