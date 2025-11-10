-- Ensure pro_features sync with profiles.is_pro
CREATE OR REPLACE FUNCTION sync_pro_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When pro_features is updated, sync to profiles
  IF TG_TABLE_NAME = 'pro_features' THEN
    UPDATE profiles
    SET is_pro = NEW.is_pro
    WHERE id = NEW.user_id;
  END IF;
  
  -- When profiles is updated, sync to pro_features
  IF TG_TABLE_NAME = 'profiles' THEN
    INSERT INTO pro_features (user_id, is_pro, pro_since)
    VALUES (NEW.id, NEW.is_pro, CASE WHEN NEW.is_pro THEN NOW() ELSE NULL END)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      is_pro = EXCLUDED.is_pro,
      pro_since = CASE 
        WHEN EXCLUDED.is_pro AND NOT pro_features.is_pro THEN NOW()
        WHEN NOT EXCLUDED.is_pro THEN NULL
        ELSE pro_features.pro_since
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for syncing
DROP TRIGGER IF EXISTS sync_pro_to_profiles ON pro_features;
CREATE TRIGGER sync_pro_to_profiles
  AFTER INSERT OR UPDATE ON pro_features
  FOR EACH ROW
  EXECUTE FUNCTION sync_pro_status();

-- Split triggers for INSERT and UPDATE to avoid referencing OLD in INSERT
DROP TRIGGER IF EXISTS sync_profiles_to_pro_insert ON profiles;
CREATE TRIGGER sync_profiles_to_pro_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.is_pro = true)
  EXECUTE FUNCTION sync_pro_status();

DROP TRIGGER IF EXISTS sync_profiles_to_pro_update ON profiles;
CREATE TRIGGER sync_profiles_to_pro_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.is_pro IS DISTINCT FROM OLD.is_pro)
  EXECUTE FUNCTION sync_pro_status();

-- Sync existing data
INSERT INTO pro_features (user_id, is_pro, pro_since)
SELECT id, is_pro, CASE WHEN is_pro THEN NOW() ELSE NULL END
FROM profiles
WHERE is_pro = true
ON CONFLICT (user_id) DO UPDATE
SET is_pro = EXCLUDED.is_pro,
    pro_since = CASE WHEN EXCLUDED.is_pro THEN COALESCE(pro_features.pro_since, NOW()) ELSE NULL END;

-- Update profiles from pro_features
UPDATE profiles p
SET is_pro = pf.is_pro
FROM pro_features pf
WHERE p.id = pf.user_id
AND p.is_pro IS DISTINCT FROM pf.is_pro;
