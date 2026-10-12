-- Identidade visual global da plataforma Tratto
alter table public.platform_settings
  add column if not exists system_name text not null default 'TrattoMenu',
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('platform-branding', 'platform-branding', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public le logo da plataforma" on storage.objects;
create policy "public le logo da plataforma"
on storage.objects for select to anon, authenticated
using (bucket_id = 'platform-branding');

drop policy if exists "super admin envia logo da plataforma" on storage.objects;
create policy "super admin envia logo da plataforma"
on storage.objects for insert to authenticated
with check (bucket_id = 'platform-branding' and public.is_super_admin());

drop policy if exists "super admin atualiza logo da plataforma" on storage.objects;
create policy "super admin atualiza logo da plataforma"
on storage.objects for update to authenticated
using (bucket_id = 'platform-branding' and public.is_super_admin())
with check (bucket_id = 'platform-branding' and public.is_super_admin());

drop policy if exists "super admin remove logo da plataforma" on storage.objects;
create policy "super admin remove logo da plataforma"
on storage.objects for delete to authenticated
using (bucket_id = 'platform-branding' and public.is_super_admin());
