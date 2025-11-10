-- Create feature_suggestions table
CREATE TABLE IF NOT EXISTS feature_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feature_suggestion_votes table for tracking who voted
CREATE TABLE IF NOT EXISTS feature_suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_user_id ON feature_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_status ON feature_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_created_at ON feature_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_suggestion_votes_suggestion_id ON feature_suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_feature_suggestion_votes_user_id ON feature_suggestion_votes(user_id);

-- Enable RLS
ALTER TABLE feature_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestion_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_suggestions
CREATE POLICY "Users can view all feature suggestions"
  ON feature_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own feature suggestions"
  ON feature_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature suggestions"
  ON feature_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feature suggestions"
  ON feature_suggestions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for feature_suggestion_votes
CREATE POLICY "Users can view all votes"
  ON feature_suggestion_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON feature_suggestion_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feature_suggestion_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
