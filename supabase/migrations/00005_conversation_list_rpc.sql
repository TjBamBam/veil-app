-- ============================================================
-- RPC: Get all conversations for the current user
-- Returns conversations with other user profile + last message
-- Bypasses nested RLS issues
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_data ORDER BY last_msg_time DESC NULLS LAST) INTO result
  FROM (
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
      ),
      'last_message', (
        SELECT json_build_object(
          'content', m.content,
          'type', m.type,
          'created_at', m.created_at,
          'sender_id', m.sender_id
        )
        FROM messages m
        WHERE m.conversation_id = c.id AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT 1
      )
    ) AS row_data,
    (
      SELECT m2.created_at
      FROM messages m2
      WHERE m2.conversation_id = c.id AND m2.is_deleted = false
      ORDER BY m2.created_at DESC
      LIMIT 1
    ) AS last_msg_time
    FROM conversations c
    JOIN conversation_participants cp_me ON cp_me.conversation_id = c.id AND cp_me.user_id = auth.uid()
    JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != auth.uid()
    JOIN profiles p ON p.id = cp_other.user_id
  ) sub;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ============================================================
-- RPC: Get saved messages grouped by conversation/user
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_saved_messages_by_user()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(group_data) INTO result
  FROM (
    SELECT json_build_object(
      'other_user', json_build_object(
        'id', p.id,
        'username', p.username,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url
      ),
      'conversation_id', c.id,
      'messages', (
        SELECT json_agg(
          json_build_object(
            'id', m.id,
            'content', m.content,
            'type', m.type,
            'created_at', m.created_at,
            'sender_id', m.sender_id,
            'is_saved', m.is_saved
          )
          ORDER BY m.created_at DESC
        )
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.is_saved = true
          AND m.is_deleted = false
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp3
            WHERE cp3.conversation_id = m.conversation_id AND cp3.user_id = auth.uid()
          )
      )
    ) AS group_data
    FROM conversations c
    JOIN conversation_participants cp_me ON cp_me.conversation_id = c.id AND cp_me.user_id = auth.uid()
    JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != auth.uid()
    JOIN profiles p ON p.id = cp_other.user_id
    WHERE EXISTS (
      SELECT 1 FROM messages m2
      WHERE m2.conversation_id = c.id AND m2.is_saved = true AND m2.is_deleted = false
    )
  ) sub;

  RETURN COALESCE(result, '[]'::json);
END;
$$;
