-- Create pro_features table
CREATE TABLE IF NOT EXISTS pro_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_pro BOOLEAN DEFAULT false,
  pro_since TIMESTAMP WITH TIME ZONE,
  pro_expires_at TIMESTAMP WITH TIME ZONE,
  early_access_features JSONB DEFAULT '[]'::jsonb,
  profile_theme JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create verified badge with auto-generated UUID
INSERT INTO badges (name, description, icon_url, color)
VALUES (
  'Verified Pro',
  'Verified Peeak Pro member',
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '#3b82f6'
)
ON CONFLICT (name) DO NOTHING;

-- Function to award verified badge using badge name lookup
CREATE OR REPLACE FUNCTION award_verified_badge_to_pro()
RETURNS TRIGGER AS $$
DECLARE
  verified_badge_id UUID;
BEGIN
  -- Get the verified badge ID
  SELECT id INTO verified_badge_id FROM badges WHERE name = 'Verified Pro' LIMIT 1;
  
  -- If user becomes pro, award verified badge
  IF NEW.is_pro = true AND (OLD.is_pro IS NULL OR OLD.is_pro = false) THEN
    -- Check if user already has the badge
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = NEW.user_id 
      AND badge_id = verified_badge_id
    ) THEN
      -- Award the badge
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (NEW.user_id, verified_badge_id);
      
      -- Set as active badge if no active badge exists
      UPDATE profiles
      SET active_badge_id = verified_badge_id
      WHERE id = NEW.user_id
      AND active_badge_id IS NULL;
    END IF;
  END IF;
  
  -- If user loses pro status, remove verified badge
  IF NEW.is_pro = false AND OLD.is_pro = true THEN
    -- Remove the badge
    DELETE FROM user_badges 
    WHERE user_id = NEW.user_id 
    AND badge_id = verified_badge_id;
    
    -- If it was the active badge, clear it
    UPDATE profiles
    SET active_badge_id = NULL
    WHERE id = NEW.user_id
    AND active_badge_id = verified_badge_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verified badge
DROP TRIGGER IF EXISTS trigger_award_verified_badge ON pro_features;
CREATE TRIGGER trigger_award_verified_badge
AFTER INSERT OR UPDATE ON pro_features
FOR EACH ROW
EXECUTE FUNCTION award_verified_badge_to_pro();

-- Add is_pro column to profiles for easy access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pro_features_user_id ON pro_features(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON profiles(is_pro);

-- Enable RLS
ALTER TABLE pro_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pro features"
  ON pro_features FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all pro features"
  ON pro_features FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage pro features"
  ON pro_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
