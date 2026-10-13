-- Esquema do cardápio Tratto (aplicado ao banco do projeto em 2026-10-11)
-- Leitura pública do cardápio; escrita e leitura de pedidos somente para admin.

create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "usuario le o proprio papel" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create table public.store_settings (
  id text primary key default 'main' check (id = 'main'),
  config jsonb not null default '{}'::jsonb,
  marketing_pixel_id text,
  mapbox_public_token text,
  updated_at timestamptz not null default now()
);
create table public.store_secrets (
  id text primary key default 'main' check (id = 'main'),
  facebook_access_token text,
  updated_at timestamptz not null default now()
);
create table public.categories (id text primary key, data jsonb not null, sort_order int not null default 0);
create table public.products (id text primary key, data jsonb not null, sort_order int not null default 0);
create table public.delivery_zones (id text primary key, data jsonb not null);
create table public.orders (
  id text primary key,
  data jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_data_size check (pg_column_size(data) < 50000)
);

alter table public.store_settings enable row level security;
alter table public.store_secrets enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;

create policy "publico le configuracoes" on public.store_settings for select to anon, authenticated using (true);
create policy "publico le categorias" on public.categories for select to anon, authenticated using (true);
create policy "publico le produtos" on public.products for select to anon, authenticated using (true);
create policy "publico le zonas" on public.delivery_zones for select to anon, authenticated using (true);

create policy "admin escreve configuracoes" on public.store_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin escreve categorias" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin escreve produtos" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin escreve zonas" on public.delivery_zones for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin gerencia segredos" on public.store_secrets for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "cliente cria pedido" on public.orders for insert to anon, authenticated
  with check (status = 'pending');
create policy "admin le pedidos" on public.orders for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "admin altera pedidos" on public.orders for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin apaga pedidos" on public.orders for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
