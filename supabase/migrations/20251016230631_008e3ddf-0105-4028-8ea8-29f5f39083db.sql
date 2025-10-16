-- Ensure buckets exist (idempotent)
insert into storage.buckets (id, name, public)
values ('transportation-data', 'transportation-data', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('supporting-documents', 'supporting-documents', false)
on conflict (id) do nothing;

-- Storage read policies to allow admins and entry owners to list/read files
-- Drop if existing to avoid duplicates
drop policy if exists "transport_read_admins" on storage.objects;
drop policy if exists "transport_read_owner" on storage.objects;
drop policy if exists "support_read_admins" on storage.objects;
drop policy if exists "support_read_owner" on storage.objects;

-- Transportation Data: admins and super_admins can read
create policy "transport_read_admins"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'transportation-data'
  and (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'super_admin'::app_role))
);

-- Transportation Data: entry owners can read their own files
create policy "transport_read_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'transportation-data'
  and exists (
    select 1 from public.tds_entries e
    where e.id::text = (storage.foldername(name))[2]
      and e.submitted_by = auth.uid()
  )
);

-- Supporting Documents: admins and super_admins can read
create policy "support_read_admins"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'supporting-documents'
  and (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'super_admin'::app_role))
);

-- Supporting Documents: entry owners can read their own files
create policy "support_read_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'supporting-documents'
  and exists (
    select 1 from public.tds_entries e
    where e.id::text = (storage.foldername(name))[2]
      and e.submitted_by = auth.uid()
  )
);
