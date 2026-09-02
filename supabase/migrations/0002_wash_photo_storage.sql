-- Wash photo storage bucket + 90-day retention.
--
-- Supabase Storage has no native S3-style bucket lifecycle policy, so the
-- "lifecycle rule, not application logic" requirement is implemented as a
-- pg_cron job that deletes objects older than 90 days directly from
-- storage.objects. This runs independent of the app — the app never has to
-- know about or enforce retention.

insert into storage.buckets (id, name, public)
values ('wash-photos', 'wash-photos', false)
on conflict (id) do nothing;

-- PROVISIONAL: access policy allows any authenticated request to read/write.
-- Tighten once real worker auth (see src/lib/auth.ts) issues scoped JWTs.
create policy "provisional_wash_photos_all"
on storage.objects for all
using (bucket_id = 'wash-photos')
with check (bucket_id = 'wash-photos');

create extension if not exists pg_cron;

select cron.schedule(
  'wash-photos-90-day-retention',
  '0 3 * * *', -- daily at 03:00
  $$
    delete from storage.objects
    where bucket_id = 'wash-photos'
      and created_at < now() - interval '90 days';
  $$
);
