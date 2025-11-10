export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  location: string | null
  website: string | null
  birth_date: string | null
  created_at: string
  updated_at: string
  profile_completion_percentage?: number
  is_admin?: boolean
}

export interface Post {
  id: string
  author_id: string
  content: string
  media_urls: string[] | null
  media_types: string[] | null
  created_at: string
  updated_at: string
  is_deleted: boolean
  profiles?: Profile
  likes_count?: number
  comments_count?: number
  shares_count?: number
  is_liked?: boolean
}

export interface Comment {
  id: string
  author_id: string
  post_id: string
  parent_comment_id?: string | null
  content: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  profiles?: Profile
  likes_count?: number
  is_liked?: boolean
  replies?: Comment[]
}

export interface Notification {
  id: string
  user_id: string
  type: "like" | "comment" | "follow" | "share" | "message"
  actor_id: string | null
  post_id: string | null
  comment_id: string | null
  is_read: boolean
  created_at: string
  actor?: Profile
}

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  conversation_id: string | null
  content: string
  media_url: string | null
  is_read: boolean
  created_at: string
  sender?: Profile
  recipient?: Profile
}

export interface Conversation {
  id: string
  type: "dm" | "group"
  name: string | null
  avatar_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ConversationMember {
  id: string
  conversation_id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  profile?: Profile
}
