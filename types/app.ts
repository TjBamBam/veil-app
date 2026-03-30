import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationParticipant =
  Database["public"]["Tables"]["conversation_participants"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageMedia = Database["public"]["Tables"]["message_media"]["Row"];

export type MessageWithMedia = Message & {
  media?: MessageMedia | null;
  sender?: Profile | null;
};

export type ConversationWithDetails = Conversation & {
  other_user: Profile;
  last_message?: MessageWithMedia | null;
  unread_count?: number;
};

export type FriendshipWithProfile = Friendship & {
  profile: Profile;
};

export type NotificationType = "friend_request" | "friend_accepted" | "new_message";

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
};

export type Theme = "navy" | "midnight" | "forest" | "crimson" | "slate" | "light";

export const THEMES: { value: Theme; label: string; preview: string }[] = [
  { value: "navy", label: "Navy", preview: "oklch(0.18 0.06 255)" },
  { value: "midnight", label: "Midnight", preview: "oklch(0.12 0.04 280)" },
  { value: "forest", label: "Forest", preview: "oklch(0.15 0.05 150)" },
  { value: "crimson", label: "Crimson", preview: "oklch(0.13 0.04 15)" },
  { value: "slate", label: "Slate", preview: "oklch(0.16 0.01 255)" },
  { value: "light", label: "Light", preview: "oklch(0.98 0 0)" },
];
