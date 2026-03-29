export interface User { id: string; email: string; username: string; created_at: string; }

export interface Conversation { id: string; user_id: string; other_user_id: string; last_message: string; updated_at: string; }

export interface Message { id: string; content: string; MEDIA_url: string | null; user_id: string; conversation_id: string; created_at: string; }