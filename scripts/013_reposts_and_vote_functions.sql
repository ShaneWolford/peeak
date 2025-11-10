-- Create reposts table
CREATE TABLE IF NOT EXISTS reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Add RLS policies for reposts
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reposts"
  ON reposts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own reposts"
  ON reposts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts"
  ON reposts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RPC functions for vote counting
CREATE OR REPLACE FUNCTION increment_suggestion_votes(suggestion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feature_suggestions
  SET votes = COALESCE(votes, 0) + 1
  WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_suggestion_votes(suggestion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feature_suggestions
  SET votes = GREATEST(COALESCE(votes, 0) - 1, 0)
  WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_created_at ON reposts(created_at DESC);
