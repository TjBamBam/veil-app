-- ============================================================
-- FIX: Recursive RLS on conversation_participants
-- The original policy referenced itself causing infinite recursion
-- ============================================================
drop policy if exists "cp_select" on public.conversation_participants;

create policy "cp_select" on public.conversation_participants
  for select to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- HELPER: Get the other user in a 1:1 conversation
-- Uses security definer to bypass RLS
-- ============================================================
create or replace function public.get_conversation_other_user(conv_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  other_id uuid;
begin
  select user_id into other_id
  from conversation_participants
  where conversation_id = conv_id
    and user_id != auth.uid()
  limit 1;
  return other_id;
end;
$$;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
create type public.notification_type as enum (
  'friend_request',
  'friend_accepted',
  'new_message'
);

create table public.notifications (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        public.notification_type not null,
  title       text not null,
  body        text,
  data        jsonb default '{}'::jsonb,
  read        boolean default false not null,
  created_at  timestamptz default now() not null
);

create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id, read) where read = false;

alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

create policy "notifications_update" on public.notifications
  for update to authenticated using (auth.uid() = user_id);

create policy "notifications_delete" on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

create policy "notifications_insert" on public.notifications
  for insert to authenticated with check (true);

-- ============================================================
-- TRIGGER: Create notification on new message
-- ============================================================
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  recipient_id uuid;
  sender_name  text;
begin
  -- Find the other participant (recipient)
  select user_id into recipient_id
  from conversation_participants
  where conversation_id = new.conversation_id
    and user_id != new.sender_id
  limit 1;

  if recipient_id is null then
    return new;
  end if;

  -- Get sender display name
  select coalesce(display_name, username) into sender_name
  from profiles where id = new.sender_id;

  -- Insert notification for recipient
  insert into notifications (user_id, type, title, body, data)
  values (
    recipient_id,
    'new_message',
    sender_name,
    case
      when new.type = 'text' then new.content
      when new.type = 'image' then '📷 Photo'
      when new.type = 'video' then '🎥 Video'
      else 'New message'
    end,
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'sender_id', new.sender_id,
      'message_id', new.id
    )
  );

  return new;
end;
$$;

create trigger on_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ============================================================
-- TRIGGER: Create notification on friend request / accept
-- ============================================================
create or replace function public.notify_friendship_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_name text;
begin
  -- Friend request sent
  if TG_OP = 'INSERT' and new.status = 'pending' then
    select coalesce(display_name, username) into actor_name
    from profiles where id = new.requester_id;

    insert into notifications (user_id, type, title, body, data)
    values (
      new.addressee_id,
      'friend_request',
      'Friend request',
      actor_name || ' wants to be your friend',
      jsonb_build_object('friendship_id', new.id, 'requester_id', new.requester_id)
    );

  -- Friend request accepted
  elsif TG_OP = 'UPDATE' and new.status = 'accepted' and old.status = 'pending' then
    select coalesce(display_name, username) into actor_name
    from profiles where id = new.addressee_id;

    insert into notifications (user_id, type, title, body, data)
    values (
      new.requester_id,
      'friend_accepted',
      'Friend request accepted',
      actor_name || ' accepted your friend request',
      jsonb_build_object('friendship_id', new.id, 'addressee_id', new.addressee_id)
    );
  end if;

  return new;
end;
$$;

create trigger on_friendship_change
  after insert or update on public.friendships
  for each row execute function public.notify_friendship_change();

-- Enable Realtime for notifications
alter publication supabase_realtime add table public.notifications;
