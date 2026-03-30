-- ============================================================
-- DEFINITIVE FIX: Run this in Supabase SQL Editor
-- Fixes the conversation 404 by removing recursive RLS policies
-- ============================================================

-- 1. Fix conversation_participants: remove recursive policy
DROP POLICY IF EXISTS "cp_select" ON public.conversation_participants;
CREATE POLICY "cp_select" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. Fix conversations: the existing policy references cp which is now fixed,
--    but let's recreate it cleanly
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- 3. Ensure get_or_create_conversation RPC exists
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  conv_id uuid;
BEGIN
  -- Look for existing conversation between these two users
  SELECT c.id INTO conv_id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = auth.uid()
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conv_id, auth.uid());
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conv_id, other_user_id);
  END IF;

  RETURN conv_id;
END;
$$;

-- 4. Ensure get_conversation_other_user RPC exists
CREATE OR REPLACE FUNCTION public.get_conversation_other_user(conv_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  other_id uuid;
BEGIN
  SELECT user_id INTO other_id
  FROM conversation_participants
  WHERE conversation_id = conv_id
    AND user_id != auth.uid()
  LIMIT 1;
  RETURN other_id;
END;
$$;

-- 5. Verify it works (run this to check — should return your user id)
-- SELECT auth.uid();
-- SELECT * FROM conversation_participants WHERE user_id = auth.uid();
