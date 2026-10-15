-- Carregamento rápido do cardápio público: textos/preços primeiro, fotos depois, e sem o MP3/ícone do app.
-- Funções "security invoker": as políticas de leitura (RLS) das tabelas continuam valendo.

create or replace function public.get_menu_products(_store_id uuid)
returns table (data jsonb, sort_order integer, has_image boolean)
language sql stable security invoker set search_path = public as $fn$
  select p.data - 'image', p.sort_order, coalesce(p.data->>'image', '') <> ''
  from public.products p where p.store_id = _store_id order by p.sort_order
$fn$;

create or replace function public.get_product_images(_store_id uuid, _ids text[])
returns table (id text, image text)
language sql stable security invoker set search_path = public as $fn$
  select p.id, p.data->>'image' from public.products p
  where p.store_id = _store_id and p.id = any(_ids) and coalesce(p.data->>'image', '') <> ''
$fn$;

create or replace function public.get_menu_settings(_store_id uuid)
returns table (config jsonb, mapbox_public_token text)
language sql stable security invoker set search_path = public as $fn$
  select s.config - 'orderNotificationSoundUrl' - 'pwaIcon', s.mapbox_public_token
  from public.store_settings s where s.store_id = _store_id
$fn$;

grant execute on function public.get_menu_products(uuid) to anon, authenticated;
grant execute on function public.get_product_images(uuid, text[]) to anon, authenticated;
grant execute on function public.get_menu_settings(uuid) to anon, authenticated;
