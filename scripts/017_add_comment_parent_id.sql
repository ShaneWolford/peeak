-- Add parent_comment_id to comments table for nested replies
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_comment_id);

-- Update RLS policies to allow replies
-- (existing policies already cover this, no changes needed)
