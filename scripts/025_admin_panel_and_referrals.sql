-- Create site_settings table for global settings
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Create user_warnings table
CREATE TABLE IF NOT EXISTS user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by uuid REFERENCES profiles(id) NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Add columns to profiles table for bans and referrals
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

-- Generate referral codes for existing users
UPDATE profiles 
SET referral_code = LOWER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Insert default site settings
INSERT INTO site_settings (key, value) 
VALUES ('posting_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Create the referral badge
INSERT INTO badges (name, description, icon_url, color)
VALUES (
  'Referral Master',
  'Earned by referring 5 friends to the platform',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.17 10.0599H7.82994C6.64995 10.0599 6.23995 9.26994 6.92995 8.30994L11.1 2.46995C11.59 1.76995 12.41 1.76995 12.89 2.46995L17.06 8.30994C17.76 9.26994 17.35 10.0599 16.17 10.0599Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.59 17.9999H6.41998C4.83998 17.9999 4.29998 16.9499 5.22998 15.6699L9.21997 10.0599H14.79L18.78 15.6699C19.71 16.9499 19.17 17.9999 17.59 17.9999Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22V18" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '#10b981'
)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
CREATE POLICY "Anyone can view site settings" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
CREATE POLICY "Admins can update site settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for user_warnings
DROP POLICY IF EXISTS "Users can view their own warnings" ON user_warnings;
CREATE POLICY "Users can view their own warnings" ON user_warnings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all warnings" ON user_warnings;
CREATE POLICY "Admins can view all warnings" ON user_warnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can issue warnings" ON user_warnings;
CREATE POLICY "Admins can issue warnings" ON user_warnings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies for referrals
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (referred_user_id = auth.uid());

-- Function to auto-ban users with 3 warnings
CREATE OR REPLACE FUNCTION check_user_warnings()
RETURNS TRIGGER AS $$
DECLARE
  warning_count integer;
BEGIN
  -- Count warnings for this user
  SELECT COUNT(*) INTO warning_count
  FROM user_warnings
  WHERE user_id = NEW.user_id;

  -- If user has 3 or more warnings, ban them for 24 hours
  IF warning_count >= 3 THEN
    UPDATE profiles
    SET is_banned = true,
        ban_expires_at = now() + interval '24 hours'
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check warnings after insert
DROP TRIGGER IF EXISTS check_warnings_trigger ON user_warnings;
CREATE TRIGGER check_warnings_trigger
  AFTER INSERT ON user_warnings
  FOR EACH ROW
  EXECUTE FUNCTION check_user_warnings();

-- Function to auto-award referral badge
CREATE OR REPLACE FUNCTION check_referral_badge()
RETURNS TRIGGER AS $$
DECLARE
  referral_count integer;
  referral_badge_id uuid;
BEGIN
  -- Count referrals for this user
  SELECT COUNT(*) INTO referral_count
  FROM referrals
  WHERE referrer_id = NEW.referrer_id;

  -- If user has 5 or more referrals, award the badge
  IF referral_count >= 5 THEN
    -- Get the referral badge ID
    SELECT id INTO referral_badge_id
    FROM badges
    WHERE name = 'Referral Master'
    LIMIT 1;

    -- Award the badge if not already awarded
    IF referral_badge_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, assigned_by)
      VALUES (NEW.referrer_id, referral_badge_id, NEW.referrer_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check referrals after insert
DROP TRIGGER IF EXISTS check_referral_badge_trigger ON referrals;
CREATE TRIGGER check_referral_badge_trigger
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_badge();

-- Function to unban users when ban expires
CREATE OR REPLACE FUNCTION unban_expired_users()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET is_banned = false,
      ban_expires_at = NULL
  WHERE is_banned = true
    AND ban_expires_at IS NOT NULL
    AND ban_expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
