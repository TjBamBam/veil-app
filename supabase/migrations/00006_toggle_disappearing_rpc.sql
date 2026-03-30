-- RPC to toggle disappearing messages (bypasses conversations RLS)
CREATE OR REPLACE FUNCTION public.toggle_disappearing(conv_id uuid, enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Verify caller is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  UPDATE conversations
  SET disappearing_enabled = enabled
  WHERE id = conv_id;
END;
$$;
