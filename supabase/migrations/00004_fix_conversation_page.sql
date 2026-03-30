-- ============================================================
-- FIX: Single RPC that returns all conversation page data
-- Bypasses the nested RLS problem entirely
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_conversation_page_data(conv_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
  is_participant boolean;
BEGIN
  -- Check if caller is a participant
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  ) INTO is_participant;

  IF NOT is_participant THEN
    RETURN NULL;
  END IF;

  -- Return conversation + other user's profile in one shot
  SELECT json_build_object(
    'id', c.id,
    'disappearing_enabled', c.disappearing_enabled,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'other_user', json_build_object(
      'id', p.id,
      'username', p.username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'theme', p.theme,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    )
  ) INTO result
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id != auth.uid()
  JOIN profiles p ON p.id = cp.user_id
  WHERE c.id = conv_id;

  RETURN result;
END;
$$;
