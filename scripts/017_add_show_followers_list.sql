-- Add show_followers_list column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_followers_list BOOLEAN DEFAULT true;

-- Update existing profiles to show followers list by default
UPDATE profiles SET show_followers_list = true WHERE show_followers_list IS NULL;
