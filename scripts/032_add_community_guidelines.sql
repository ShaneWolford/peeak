-- Add community guidelines acceptance tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accepted_guidelines BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guidelines_accepted_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_accepted_guidelines ON profiles(accepted_guidelines);

-- Update RLS policies (existing policies remain unchanged)
