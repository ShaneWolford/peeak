-- Add completed_at column to bug_reports
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add completed_at column to feature_suggestions
ALTER TABLE feature_suggestions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email = 'shaneswolfords@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete old completed items
CREATE OR REPLACE FUNCTION delete_old_completed_items()
RETURNS void AS $$
BEGIN
  -- Delete bug reports completed more than 24 hours ago
  DELETE FROM bug_reports
  WHERE completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '24 hours';

  -- Delete feature suggestions completed more than 24 hours ago
  DELETE FROM feature_suggestions
  WHERE completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow admins to update status
DROP POLICY IF EXISTS "Admins can update bug reports" ON bug_reports;
CREATE POLICY "Admins can update bug reports"
  ON bug_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'shaneswolfords@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Admins can update feature suggestions" ON feature_suggestions;
CREATE POLICY "Admins can update feature suggestions"
  ON feature_suggestions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'shaneswolfords@gmail.com'
    )
  );

-- Create a scheduled job to run cleanup daily (requires pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- Alternatively, you can call this function via an API endpoint with a cron job
