-- Create 'assets' storage bucket for generated content
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- 1. Public Access (Read)
drop policy if exists "Public Access Assets" on storage.objects;
create policy "Public Access Assets"
  on storage.objects for select
  using ( bucket_id = 'assets' );

-- 2. Authenticated Uploads (Insert)
drop policy if exists "Authenticated users can upload Assets" on storage.objects;
create policy "Authenticated users can upload Assets"
  on storage.objects for insert
  with check ( bucket_id = 'assets' and auth.role() = 'authenticated' );

-- 3. Owner Updates (Update)
drop policy if exists "Users can update their own assets" on storage.objects;
create policy "Users can update their own assets"
  on storage.objects for update
  using ( bucket_id = 'assets' and auth.uid() = owner );

-- 4. Owner Deletes (Delete)
drop policy if exists "Users can delete their own assets" on storage.objects;
create policy "Users can delete their own assets"
  on storage.objects for delete
  using ( bucket_id = 'assets' and auth.uid() = owner );
