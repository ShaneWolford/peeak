-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post"
ON posts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
