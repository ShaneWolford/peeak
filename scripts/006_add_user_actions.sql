-- Add tables for mute, block, and not interested features
CREATE TABLE IF NOT EXISTS public.muted_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muted_user_id),
  CHECK (user_id != muted_user_id)
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id),
  CHECK (user_id != blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.hidden_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for muted_users
CREATE POLICY "Users can view their own muted users"
ON public.muted_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mute other users"
ON public.muted_users FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmute users"
ON public.muted_users FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for blocked_users
CREATE POLICY "Users can view their own blocked users"
ON public.blocked_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can block other users"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock users"
ON public.blocked_users FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for hidden_posts
CREATE POLICY "Users can view their own hidden posts"
ON public.hidden_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can hide posts"
ON public.hidden_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide posts"
ON public.hidden_posts FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_muted_users_user_id ON public.muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_user_id ON public.hidden_posts(user_id);
