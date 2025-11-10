-- Add allow_comments column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;

-- Update existing posts to allow comments by default
UPDATE posts SET allow_comments = true WHERE allow_comments IS NULL;
