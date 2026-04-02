-- ============================================================
-- FIX: Add missing 'body' and 'data' columns to notifications
-- The table was created with 'message' instead of 'body' and
-- was missing 'data' (jsonb). The trigger functions reference
-- 'body' and 'data', so friend requests were failing.
-- ============================================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;

-- Recreate friendship notification trigger with correct columns
CREATE OR REPLACE FUNCTION public.notify_friendship_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
BEGIN
  IF TG_OP = 'INSERT' AND new.status = 'pending' THEN
    SELECT coalesce(display_name, username) INTO actor_name
    FROM profiles WHERE id = new.requester_id;
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      new.addressee_id, 'friend_request', 'Friend request',
      actor_name || ' wants to be your friend',
      jsonb_build_object('friendship_id', new.id, 'requester_id', new.requester_id)
    );
  ELSIF TG_OP = 'UPDATE' AND new.status = 'accepted' AND old.status = 'pending' THEN
    SELECT coalesce(display_name, username) INTO actor_name
    FROM profiles WHERE id = new.addressee_id;
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      new.requester_id, 'friend_accepted', 'Friend request accepted',
      actor_name || ' accepted your friend request',
      jsonb_build_object('friendship_id', new.id, 'addressee_id', new.addressee_id)
    );
  END IF;
  RETURN new;
END;
$$;

-- Recreate new message notification trigger with correct columns
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recipient_id uuid;
  sender_name  text;
BEGIN
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = new.conversation_id
    AND user_id != new.sender_id
  LIMIT 1;

  IF recipient_id IS NULL THEN
    RETURN new;
  END IF;

  SELECT coalesce(display_name, username) INTO sender_name
  FROM profiles WHERE id = new.sender_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    recipient_id, 'new_message', sender_name,
    CASE
      WHEN new.type = 'text' THEN new.content
      WHEN new.type = 'image' THEN 'Photo'
      WHEN new.type = 'video' THEN 'Video'
      ELSE 'New message'
    END,
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'sender_id', new.sender_id,
      'message_id', new.id
    )
  );

  RETURN new;
END;
$$;
