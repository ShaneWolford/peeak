-- Add background_url column to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Update RLS policies to allow background updates (already covered by existing UPDATE policies)
