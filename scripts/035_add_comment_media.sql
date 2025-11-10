-- Add media support to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN comments.media_url IS 'URL of attached media (image, GIF, or video)';
COMMENT ON COLUMN comments.media_type IS 'Type of media: image, gif, or video';
