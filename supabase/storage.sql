-- Run after applying Prisma migrations. This script is idempotent.
-- Both buckets are private. Each authenticated parent can access only files
-- under a folder named with their own Supabase user ID.
insert into storage.buckets (id, name, public)
values ('district-calendars', 'district-calendars', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('curriculum-files', 'curriculum-files', false)
on conflict (id) do nothing;

drop policy if exists "Parents can upload their district calendars" on storage.objects;
drop policy if exists "Parents can view their district calendars" on storage.objects;
drop policy if exists "Parents can replace their district calendars" on storage.objects;
drop policy if exists "Parents can delete their district calendars" on storage.objects;

create policy "Parents can upload their district calendars"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('district-calendars', 'curriculum-files')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Parents can view their district calendars"
on storage.objects for select to authenticated
using (
  bucket_id in ('district-calendars', 'curriculum-files')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Parents can replace their district calendars"
on storage.objects for update to authenticated
using (
  bucket_id in ('district-calendars', 'curriculum-files')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id in ('district-calendars', 'curriculum-files')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Parents can delete their district calendars"
on storage.objects for delete to authenticated
using (
  bucket_id in ('district-calendars', 'curriculum-files')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
