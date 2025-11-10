-- Add a ton of example posts and peaks for testing

-- First, let's get some user IDs to use as authors
-- We'll create posts for existing users in the system

-- Example Posts (regular posts with images)
INSERT INTO posts (id, author_id, content, media_urls, media_types, created_at, updated_at, is_deleted)
SELECT 
  gen_random_uuid(),
  profiles.id,
  sample_posts.content,
  sample_posts.media_urls,
  sample_posts.media_types,
  sample_posts.created_at, -- Explicitly reference the sample_posts.created_at to avoid ambiguity
  sample_posts.created_at,
  false
FROM profiles
CROSS JOIN LATERAL (
  VALUES
    -- Travel & Adventure Posts
    ('Just landed in Tokyo! 🗼 The city lights are absolutely breathtaking. Can''t wait to explore everything this amazing city has to offer!', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '2 hours'),
    
    ('Hiking through the Swiss Alps today. The views are unreal! 🏔️ Nature really is the best therapy.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '5 hours'),
    
    ('Beach sunset in Bali 🌅 Living my best life right now. Who else loves tropical sunsets?', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '8 hours'),
    
    -- Food Posts
    ('Made homemade ramen from scratch! 🍜 Took 6 hours but totally worth it. Recipe in comments!', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '12 hours'),
    
    ('Sunday brunch done right 🥞🥓 Nothing beats a lazy morning with good food and better company.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '1 day'),
    
    ('Trying out this new coffee shop downtown ☕ Their latte art is incredible!', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '1 day 3 hours'),
    
    -- Fitness & Wellness
    ('Morning workout complete! 💪 Started my day with a 5K run. How are you staying active today?', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '1 day 6 hours'),
    
    ('Yoga at sunrise 🧘‍♀️ Finding peace before the chaos of the day begins. Namaste!', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '2 days'),
    
    -- Tech & Work
    ('Finally shipped the new feature! 🚀 Months of hard work paying off. Team effort at its finest.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '2 days 5 hours'),
    
    ('New setup complete! 💻 Upgraded to dual monitors and I''m never going back. Productivity level: 100', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '3 days'),
    
    -- Art & Creativity
    ('Finished this painting today! 🎨 Took me 3 weeks but I''m really proud of how it turned out.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '3 days 8 hours'),
    
    ('New photography project in the works 📸 Capturing the beauty of urban architecture.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '4 days'),
    
    -- Pets & Animals
    ('Meet my new puppy! 🐕 Say hello to Max, the goodest boy in the world.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '4 days 12 hours'),
    
    ('Cat life = best life 😺 Just watching my cat judge me from across the room.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '5 days'),
    
    -- Fashion & Style
    ('New outfit for the weekend! 👗 Feeling confident and ready to take on the world.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '5 days 6 hours'),
    
    ('Sneaker collection update 👟 Just added these limited editions to the rotation.', 
     ARRAY['/placeholder.svg?height=800&width=800'], 
     ARRAY['image'], 
     NOW() - INTERVAL '6 days')
) AS sample_posts(content, media_urls, media_types, created_at)
LIMIT 5; -- Each user gets 5 random posts

-- Example Peaks (video posts)
INSERT INTO posts (id, author_id, content, media_urls, media_types, created_at, updated_at, is_deleted)
SELECT 
  gen_random_uuid(),
  profiles.id,
  sample_peaks.content,
  sample_peaks.media_urls,
  sample_peaks.media_types,
  sample_peaks.created_at, -- Explicitly reference the sample_peaks.created_at to avoid ambiguity
  sample_peaks.created_at,
  false
FROM profiles
CROSS JOIN LATERAL (
  VALUES
    -- Dance & Performance
    ('Learning this new dance routine! 💃 Day 3 of practice. What do you think?', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '3 hours'),
    
    ('Nailed the choreography! 🎵 Took me a week but finally got it down. Full video coming soon!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '7 hours'),
    
    -- Cooking & Recipes
    ('Quick 60-second pasta recipe! 🍝 Perfect for busy weeknights. Save this for later!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '10 hours'),
    
    ('Making the perfect espresso ☕ Watch till the end for the secret technique!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '15 hours'),
    
    -- Fitness & Sports
    ('30-second HIIT workout you can do anywhere! 🔥 No equipment needed. Let''s go!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '1 day 2 hours'),
    
    ('Skateboard trick tutorial 🛹 Been working on this kickflip for months. Finally landed it!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '1 day 8 hours'),
    
    -- Comedy & Entertainment
    ('When you realize it''s Monday tomorrow 😂 Tag someone who needs to see this!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '2 days 4 hours'),
    
    ('POV: You''re trying to explain your job to your parents 🤣 Too relatable!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '2 days 10 hours'),
    
    -- DIY & Crafts
    ('Transforming this old furniture! ✨ Before and after in 60 seconds. DIY magic!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '3 days 6 hours'),
    
    ('Easy room decor hack! 🎨 You won''t believe what I used to make this. Watch!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '4 days 2 hours'),
    
    -- Travel & Adventure
    ('Jumping off a cliff in New Zealand! 🪂 Scariest thing I''ve ever done but SO worth it!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '4 days 12 hours'),
    
    ('Exploring hidden waterfalls 💦 This place is absolutely magical. Adding to bucket list!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '5 days 8 hours'),
    
    -- Music & Performance
    ('Covering my favorite song 🎸 Been practicing for weeks. Hope you like it!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '6 days 4 hours'),
    
    ('Piano practice session 🎹 Working on this classical piece. Almost there!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '6 days 18 hours'),
    
    -- Tech & Gaming
    ('Insane gaming moment! 🎮 Watch till the end for the clutch play. GG!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '7 days'),
    
    ('Building my first PC! 💻 Time-lapse of the entire process. So satisfying!', 
     ARRAY['/placeholder.svg?height=1920&width=1080'], 
     ARRAY['video'], 
     NOW() - INTERVAL '7 days 12 hours')
) AS sample_peaks(content, media_urls, media_types, created_at)
LIMIT 5; -- Each user gets 5 random peaks

-- Add some posts with multiple images
INSERT INTO posts (id, author_id, content, media_urls, media_types, created_at, updated_at, is_deleted)
SELECT 
  gen_random_uuid(),
  id,
  'Photo dump from this weekend! 📸 Swipe to see all the memories we made.',
  ARRAY[
    '/placeholder.svg?height=800&width=800',
    '/placeholder.svg?height=800&width=800',
    '/placeholder.svg?height=800&width=800'
  ],
  ARRAY['image', 'image', 'image'],
  NOW() - INTERVAL '1 day 15 hours',
  NOW() - INTERVAL '1 day 15 hours',
  false
FROM profiles
LIMIT 3;

-- Add some text-only posts
INSERT INTO posts (id, author_id, content, media_urls, media_types, created_at, updated_at, is_deleted)
SELECT 
  gen_random_uuid(),
  profiles.id,
  text_posts.content,
  NULL,
  NULL,
  text_posts.created_at, -- Explicitly reference the text_posts.created_at to avoid ambiguity
  text_posts.created_at,
  false
FROM profiles
CROSS JOIN LATERAL (
  VALUES
    ('Just finished reading an amazing book! 📚 Highly recommend "Atomic Habits" if you''re into self-improvement.', NOW() - INTERVAL '6 hours'),
    ('Reminder: You''re doing better than you think. Keep going! 💪', NOW() - INTERVAL '18 hours'),
    ('Coffee thoughts: Why do we park in driveways and drive on parkways? 🤔', NOW() - INTERVAL '2 days'),
    ('Grateful for all the amazing people in my life. Thank you for being you! ❤️', NOW() - INTERVAL '3 days'),
    ('Hot take: Pineapple on pizza is actually good. Fight me. 🍕🍍', NOW() - INTERVAL '4 days')
) AS text_posts(content, created_at)
LIMIT 2;
