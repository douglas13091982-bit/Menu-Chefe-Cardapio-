-- Chave Pix da plataforma para cobrança manual das assinaturas
alter table public.platform_settings add column if not exists pix_key text not null default '';
alter table public.platform_settings add column if not exists pix_holder text not null default '';
alter table public.platform_settings add column if not exists pix_city text not null default '';
