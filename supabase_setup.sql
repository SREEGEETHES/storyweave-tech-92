-- Create styles table
create table if not exists public.styles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  reference_video_path text,
  config jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for styles
alter table public.styles enable row level security;

create policy "Users can view their own styles"
  on public.styles for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own styles"
  on public.styles for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own styles"
  on public.styles for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own styles"
  on public.styles for delete
  using ( auth.uid() = user_id );

-- Create characters table
create table if not exists public.characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  parameters jsonb,
  generated_images text[],
  reference_image_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for characters
alter table public.characters enable row level security;

create policy "Users can view their own characters"
  on public.characters for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own characters"
  on public.characters for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own characters"
  on public.characters for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own characters"
  on public.characters for delete
  using ( auth.uid() = user_id );

-- Create storage buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('character_references', 'character_references', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('style_references', 'style_references', true)
on conflict (id) do nothing;

-- Set up security policies for character_references
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'character_references' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'character_references' and auth.role() = 'authenticated' );

create policy "Users can update their own files"
  on storage.objects for update
  using ( bucket_id = 'character_references' and auth.uid() = owner );

create policy "Users can delete their own files"
  on storage.objects for delete
  using ( bucket_id = 'character_references' and auth.uid() = owner );

-- Set up security policies for style_references
create policy "Public Access Style"
  on storage.objects for select
  using ( bucket_id = 'style_references' );

create policy "Authenticated users can upload Style"
  on storage.objects for insert
  with check ( bucket_id = 'style_references' and auth.role() = 'authenticated' );

create policy "Users can update their own style files"
  on storage.objects for update
  using ( bucket_id = 'style_references' and auth.uid() = owner );

create policy "Users can delete their own style files"
  on storage.objects for delete
  using ( bucket_id = 'style_references' and auth.uid() = owner );
