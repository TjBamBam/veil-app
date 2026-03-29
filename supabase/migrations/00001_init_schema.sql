CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  created_at timestampzw DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
