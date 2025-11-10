-- Add DELETE policy for bug_reports so users can delete their own reports
CREATE POLICY "Users can delete their own bug reports"
ON bug_reports
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also add admin delete policy
CREATE POLICY "Admins can delete any bug report"
ON bug_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email = 'shaneswolfords@gmail.com'
  )
);
