-- Create projects table to store VideoState DNA
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  status text default 'draft' check (status in ('draft', 'processing', 'completed', 'failed')),
  video_state jsonb default '{}'::jsonb, -- This stores the core DNA (VideoState schema)
  thumbnail_url text,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for projects
alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on public.projects for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own projects"
  on public.projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own projects"
  on public.projects for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own projects"
  on public.projects for delete
  using ( auth.uid() = user_id );

-- Create trigger to automatically update the 'updated_at' column
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on projects
  for each row execute procedure moddatetime (updated_at);
