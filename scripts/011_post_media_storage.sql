-- Create post-media storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;

-- Allow authenticated users to upload their own post media
CREATE POLICY "Users can upload their own post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view post media (public bucket)
CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Allow users to update their own post media
CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own post media
CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
