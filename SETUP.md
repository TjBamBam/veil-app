# Veil Messaging App — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** (Settings → API)
3. Also note the **service role key** (keep this secret — only for the Edge Function)

## 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Run the Database Migration

Open the **Supabase SQL Editor** and paste + run the contents of:
```
supabase/migrations/00001_init_schema.sql
```

## 4. Create Storage Buckets

In the Supabase dashboard → **Storage**, create two buckets:

| Bucket | Public | Max file size | MIME types |
|---|---|---|---|
| `avatars` | ✅ Yes | 2 MB | image/* |
| `message-media` | ❌ No | 50 MB | image/*, video/* |

Then for **avatars**, add these Storage policies (SQL editor):
```sql
create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');
create policy "avatars_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars');
create policy "avatars_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');
```

For **message-media**:
```sql
create policy "media_select" on storage.objects for select to authenticated
  using (bucket_id = 'message-media');
create policy "media_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'message-media');
create policy "media_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'message-media');
```

## 5. Configure Supabase Auth

In **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (dev) or your Vercel URL (prod)
- Redirect URLs: add `http://localhost:3000/api/auth/callback`

## 6. Enable Realtime

In **Database → Replication**, enable Realtime for these tables:
- `messages`
- `friendships`

## 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 8. Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local`
4. Update Supabase Auth redirect URLs to include your `.vercel.app` domain

## 9. Deploy the Edge Function (for disappearing messages)

Install the Supabase CLI: `brew install supabase/tap/supabase`

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy delete-expired-messages
```

Then schedule it every 5 minutes in the Supabase SQL editor:
```sql
select cron.schedule(
  'delete-expired-messages',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/delete-expired-messages',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```
(Requires the `pg_net` extension to be enabled in your Supabase project)

## Features Summary

- ✅ Login / Signup with email + password
- ✅ Profile with avatar upload, bio, username
- ✅ 6 customizable themes (navy default)
- ✅ Friends system: add, accept, reject, remove
- ✅ Real-time messaging with timestamps
- ✅ Photo & video sharing in chats
- ✅ Disappearing messages (auto-delete after seen, per-conversation toggle)
- ✅ Save messages (immune to disappearing deletion)
- ✅ Saved messages gallery
- ✅ Panic / eject button (instantly opens Google, replaces history)
- ✅ Mobile-responsive (bottom nav on mobile, sidebar on desktop)
- ✅ Row Level Security on all database tables
- ✅ Input sanitization (DOMPurify) + Zod validation
