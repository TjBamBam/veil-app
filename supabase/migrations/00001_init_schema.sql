-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- HELPER TRIGGER FUNCTION
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  theme        text default 'navy' not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,

  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~ '^[a-z0-9_]+$')
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(coalesce(
      new.raw_user_meta_data->>'username',
      'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
    )),
    coalesce(new.raw_user_meta_data->>'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
create type public.friendship_status as enum ('pending', 'accepted', 'blocked');

create table public.friendships (
  id           uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status       public.friendship_status default 'pending' not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,

  constraint no_self_friend check (requester_id != addressee_id),
  constraint unique_friendship unique (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  )
);

create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);
create index idx_friendships_status on public.friendships(status);

create trigger friendships_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

-- RLS
alter table public.friendships enable row level security;

create policy "friendships_select" on public.friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_insert" on public.friendships
  for insert to authenticated
  with check (auth.uid() = requester_id);

create policy "friendships_update" on public.friendships
  for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_delete" on public.friendships
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id                   uuid default uuid_generate_v4() primary key,
  disappearing_enabled boolean default false not null,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- RLS
alter table public.conversations enable row level security;

create policy "conversations_select" on public.conversations
  for select to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

create policy "conversations_insert" on public.conversations
  for insert to authenticated with check (true);

create policy "conversations_update" on public.conversations
  for update to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================
create table public.conversation_participants (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  joined_at       timestamptz default now() not null,

  constraint unique_participant unique (conversation_id, user_id)
);

create index idx_cp_conversation on public.conversation_participants(conversation_id);
create index idx_cp_user on public.conversation_participants(user_id);

-- RLS
alter table public.conversation_participants enable row level security;

create policy "cp_select" on public.conversation_participants
  for select to authenticated
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.conversation_participants cp2
      where cp2.conversation_id = conversation_id and cp2.user_id = auth.uid()
    )
  );

create policy "cp_insert" on public.conversation_participants
  for insert to authenticated with check (true);

-- ============================================================
-- MESSAGES
-- ============================================================
create type public.message_type as enum ('text', 'image', 'video');

create table public.messages (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  content         text,
  type            public.message_type default 'text' not null,
  opened_at       timestamptz,
  is_saved        boolean default false not null,
  is_deleted      boolean default false not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,

  constraint text_has_content check (type != 'text' or content is not null)
);

create index idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_disappearing
  on public.messages(conversation_id, opened_at, is_saved, is_deleted)
  where opened_at is not null and is_saved = false and is_deleted = false;

create trigger messages_updated_at
  before update on public.messages
  for each row execute function public.set_updated_at();

-- RLS
alter table public.messages enable row level security;

create policy "messages_select" on public.messages
  for select to authenticated
  using (
    is_deleted = false and
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "messages_update" on public.messages
  for update to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "messages_delete" on public.messages
  for delete to authenticated
  using (sender_id = auth.uid());

-- ============================================================
-- MESSAGE MEDIA
-- ============================================================
create table public.message_media (
  id           uuid default uuid_generate_v4() primary key,
  message_id   uuid references public.messages(id) on delete cascade not null unique,
  storage_path text not null,
  mime_type    text not null,
  file_size    bigint,
  width        int,
  height       int,
  duration_s   float,
  created_at   timestamptz default now() not null
);

create index idx_message_media_message on public.message_media(message_id);

-- RLS
alter table public.message_media enable row level security;

create policy "media_select" on public.message_media
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_media.message_id and cp.user_id = auth.uid()
    )
  );

create policy "media_insert" on public.message_media
  for insert to authenticated
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_media.message_id and m.sender_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER RPC: get or create 1:1 conversation
-- ============================================================
create or replace function public.get_or_create_conversation(other_user_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  conv_id uuid;
begin
  select c.id into conv_id
  from conversations c
  join conversation_participants cp1 on cp1.conversation_id = c.id and cp1.user_id = auth.uid()
  join conversation_participants cp2 on cp2.conversation_id = c.id and cp2.user_id = other_user_id
  limit 1;

  if conv_id is null then
    insert into conversations default values returning id into conv_id;
    insert into conversation_participants (conversation_id, user_id) values (conv_id, auth.uid());
    insert into conversation_participants (conversation_id, user_id) values (conv_id, other_user_id);
  end if;

  return conv_id;
end;
$$;

-- ============================================================
-- STORAGE BUCKETS (run these statements in Supabase dashboard)
-- ============================================================
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif']);

-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values ('message-media', 'message-media', false, 52428800, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']);

-- Storage RLS for avatars (public read, owner write):
-- create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "avatars_insert" on storage.objects for insert to authenticated
--   with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "avatars_update" on storage.objects for update to authenticated
--   using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "avatars_delete" on storage.objects for delete to authenticated
--   using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Storage RLS for message-media (participants only):
-- create policy "media_select" on storage.objects for select to authenticated
--   using (bucket_id = 'message-media');
-- create policy "media_insert" on storage.objects for insert to authenticated
--   with check (bucket_id = 'message-media');
-- create policy "media_delete" on storage.objects for delete to authenticated
--   using (bucket_id = 'message-media');
