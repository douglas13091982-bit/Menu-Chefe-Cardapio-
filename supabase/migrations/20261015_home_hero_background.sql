-- Imagem de fundo da primeira seção da home, configurável pelo Super Admin.
alter table public.platform_settings
  add column if not exists hero_background_url text;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml']
where id = 'platform-branding';
