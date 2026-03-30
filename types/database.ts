export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Views: Record<string, never>;
    Enums: {
      friendship_status: "pending" | "accepted" | "blocked";
      message_type: "text" | "image" | "video";
      notification_type: "friend_request" | "friend_accepted" | "new_message";
    };
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "blocked";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "blocked";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: "pending" | "accepted" | "blocked";
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          disappearing_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          disappearing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          disappearing_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          type: "text" | "image" | "video";
          opened_at: string | null;
          is_saved: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          type?: "text" | "image" | "video";
          opened_at?: string | null;
          is_saved?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string | null;
          type?: "text" | "image" | "video";
          opened_at?: string | null;
          is_saved?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_media: {
        Row: {
          id: string;
          message_id: string;
          storage_path: string;
          mime_type: string;
          file_size: number | null;
          width: number | null;
          height: number | null;
          duration_s: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          storage_path: string;
          mime_type: string;
          file_size?: number | null;
          width?: number | null;
          height?: number | null;
          duration_s?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          storage_path?: string;
          mime_type?: string;
          file_size?: number | null;
          width?: number | null;
          height?: number | null;
          duration_s?: number | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "friend_request" | "friend_accepted" | "new_message";
          title: string;
          body: string | null;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "friend_request" | "friend_accepted" | "new_message";
          title: string;
          body?: string | null;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "friend_request" | "friend_accepted" | "new_message";
          title?: string;
          body?: string | null;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_or_create_conversation: {
        Args: { other_user_id: string };
        Returns: string;
      };
      get_conversation_other_user: {
        Args: { conv_id: string };
        Returns: string;
      };
    };
  };
};
