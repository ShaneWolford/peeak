-- Create patch_notes table
CREATE TABLE IF NOT EXISTS patch_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'bugfix', 'improvement', 'announcement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE patch_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published patch notes"
  ON patch_notes
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage patch notes"
  ON patch_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_patch_notes_created_at ON patch_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patch_notes_published ON patch_notes(is_published);
