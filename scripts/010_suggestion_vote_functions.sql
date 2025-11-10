-- Create functions to increment/decrement vote counts
CREATE OR REPLACE FUNCTION increment_suggestion_votes(suggestion_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE feature_suggestions
  SET votes = votes + 1
  WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_suggestion_votes(suggestion_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE feature_suggestions
  SET votes = GREATEST(votes - 1, 0)
  WHERE id = suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
