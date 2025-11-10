-- Delete all example posts and related data
-- This will remove all posts, likes, and comments to start fresh

-- Delete all likes
DELETE FROM likes;

-- Delete all comments
DELETE FROM comments;

-- Delete all posts
DELETE FROM posts;

-- Reset sequences if needed
-- (Postgres will handle this automatically for UUIDs)
