-- SaaS multi-loja: lojas, membros, assinaturas manuais e RLS por loja.
-- A loja Tratto existente vira a primeira loja (slug "tratto"), sem perder dados.

create table public.super_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.super_admins enable row level security;
create policy "super le o proprio registro" on public.super_admins for select to authenticated using (user_id = auth.uid());

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.super_admins where user_id = auth.uid()) $$;

create table public.platform_settings (
  id text primary key default 'main' check (id = 'main'),
  plan_name text not null default 'Plano Completo',
  price_cents int not null default 9900,
  trial_days int not null default 7,
  contact_whatsapp text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.platform_settings default values;
alter table public.platform_settings enable row level security;
create policy "publico le plataforma" on public.platform_settings for select to anon, authenticated using (true);
create policy "super altera plataforma" on public.platform_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$'),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'trial' check (status in ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at timestamptz,
  paid_until timestamptz,
  price_cents int,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.stores enable row level security;

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  primary key (store_id, user_id)
);
alter table public.store_members enable row level security;
create policy "membro le o proprio vinculo" on public.store_members for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
create policy "super gerencia vinculos" on public.store_members for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create table public.store_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  amount_cents int not null,
  months int not null default 1,
  note text,
  paid_at timestamptz not null default now()
);
alter table public.store_payments enable row level security;
create policy "super le pagamentos" on public.store_payments for select to authenticated using (public.is_super_admin());

-- loja ativa para o público (teste vigente ou assinatura em dia)
create or replace function public.store_is_servable(_store uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.stores s where s.id = _store and (
    (s.status = 'trial' and (s.trial_ends_at is null or s.trial_ends_at > now())) or
    (s.status = 'active' and (s.paid_until is null or s.paid_until > now()))
  )) $$;

create or replace function public.is_store_member(_store uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select public.is_super_admin() or exists (
  select 1 from public.store_members where store_id = _store and user_id = auth.uid()) $$;

-- pode editar: super admin, ou membro de loja ativa/em teste
create or replace function public.can_manage_store(_store uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select public.is_super_admin() or (
  public.is_store_member(_store) and public.store_is_servable(_store)) $$;

create policy "membro le a propria loja" on public.stores for select to authenticated using (public.is_store_member(id));
create policy "super gerencia lojas" on public.stores for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ===== migra os dados atuais para a loja "tratto" =====
do $$
declare v_store uuid; v_owner uuid;
begin
  select user_id into v_owner from public.user_roles where role = 'admin' order by id limit 1;
  insert into public.stores (slug, name, owner_id, status, paid_until)
    values ('tratto', 'Tratto Hamburgueria', v_owner, 'active', now() + interval '10 years')
    returning id into v_store;
  if v_owner is not null then
    insert into public.store_members (store_id, user_id, role) values (v_store, v_owner, 'owner');
    insert into public.super_admins (user_id) values (v_owner);
  end if;

  alter table public.store_settings add column store_id uuid;
  alter table public.store_secrets add column store_id uuid;
  alter table public.categories add column store_id uuid;
  alter table public.products add column store_id uuid;
  alter table public.delivery_zones add column store_id uuid;
  alter table public.orders add column store_id uuid;
  update public.store_settings set store_id = v_store;
  update public.store_secrets set store_id = v_store;
  update public.categories set store_id = v_store;
  update public.products set store_id = v_store;
  update public.delivery_zones set store_id = v_store;
  update public.orders set store_id = v_store;
end $$;

-- remove as políticas antigas (de loja única)
drop policy if exists "publico le configuracoes" on public.store_settings;
drop policy if exists "publico le categorias" on public.categories;
drop policy if exists "publico le produtos" on public.products;
drop policy if exists "publico le zonas" on public.delivery_zones;
drop policy if exists "admin escreve configuracoes" on public.store_settings;
drop policy if exists "admin escreve categorias" on public.categories;
drop policy if exists "admin escreve produtos" on public.products;
drop policy if exists "admin escreve zonas" on public.delivery_zones;
drop policy if exists "admin gerencia segredos" on public.store_secrets;
drop policy if exists "cliente cria pedido" on public.orders;
drop policy if exists "admin le pedidos" on public.orders;
drop policy if exists "admin altera pedidos" on public.orders;
drop policy if exists "admin apaga pedidos" on public.orders;

-- chaves por loja
alter table public.store_settings drop column id;
alter table public.store_secrets drop column id;
alter table public.store_settings alter column store_id set not null;
alter table public.store_secrets alter column store_id set not null;
alter table public.store_settings add primary key (store_id);
alter table public.store_secrets add primary key (store_id);
alter table public.store_settings add foreign key (store_id) references public.stores(id) on delete cascade;
alter table public.store_secrets add foreign key (store_id) references public.stores(id) on delete cascade;

alter table public.categories drop constraint categories_pkey;
alter table public.products drop constraint products_pkey;
alter table public.delivery_zones drop constraint delivery_zones_pkey;
alter table public.orders drop constraint orders_pkey;
alter table public.categories alter column store_id set not null;
alter table public.products alter column store_id set not null;
alter table public.delivery_zones alter column store_id set not null;
alter table public.orders alter column store_id set not null;
alter table public.categories add primary key (store_id, id);
alter table public.products add primary key (store_id, id);
alter table public.delivery_zones add primary key (store_id, id);
alter table public.orders add primary key (store_id, id);
alter table public.categories add foreign key (store_id) references public.stores(id) on delete cascade;
alter table public.products add foreign key (store_id) references public.stores(id) on delete cascade;
alter table public.delivery_zones add foreign key (store_id) references public.stores(id) on delete cascade;
alter table public.orders add foreign key (store_id) references public.stores(id) on delete cascade;
create index orders_store_created_idx on public.orders (store_id, created_at desc);

-- novas políticas por loja
create policy "le configuracoes da loja" on public.store_settings for select to anon, authenticated
  using (public.store_is_servable(store_id) or public.is_store_member(store_id));
create policy "le categorias da loja" on public.categories for select to anon, authenticated
  using (public.store_is_servable(store_id) or public.is_store_member(store_id));
create policy "le produtos da loja" on public.products for select to anon, authenticated
  using (public.store_is_servable(store_id) or public.is_store_member(store_id));
create policy "le zonas da loja" on public.delivery_zones for select to anon, authenticated
  using (public.store_is_servable(store_id) or public.is_store_member(store_id));

create policy "gerencia configuracoes da loja" on public.store_settings for all to authenticated
  using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "gerencia categorias da loja" on public.categories for all to authenticated
  using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "gerencia produtos da loja" on public.products for all to authenticated
  using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "gerencia zonas da loja" on public.delivery_zones for all to authenticated
  using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "gerencia segredos da loja" on public.store_secrets for all to authenticated
  using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));

create policy "cliente cria pedido na loja" on public.orders for insert to anon, authenticated
  with check (status = 'pending' and public.store_is_servable(store_id));
create policy "loja le pedidos" on public.orders for select to authenticated using (public.can_manage_store(store_id));
create policy "loja altera pedidos" on public.orders for update to authenticated
  using (public.can_manage_store(store_id)) with check (public.can_manage_store(store_id));
create policy "loja apaga pedidos" on public.orders for delete to authenticated using (public.can_manage_store(store_id));

-- ===== funções (RPC) =====
create or replace function public.get_public_store(_slug text)
returns table (id uuid, name text, slug text, available boolean)
language sql stable security definer set search_path = public
as $$ select s.id, s.name, s.slug, public.store_is_servable(s.id) from public.stores s where s.slug = lower(_slug) $$;
grant execute on function public.get_public_store(text) to anon, authenticated;

create or replace function public.create_store(_name text, _slug text) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_slug text := lower(trim(_slug)); v_id uuid; v_trial int;
begin
  if v_uid is null then raise exception 'Faça login para criar a loja.'; end if;
  if length(trim(coalesce(_name, ''))) < 2 then raise exception 'Informe o nome da loja.'; end if;
  if exists (select 1 from public.store_members where user_id = v_uid) then raise exception 'Você já tem uma loja.'; end if;
  if v_slug !~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$' then
    raise exception 'Endereço inválido. Use de 3 a 40 letras minúsculas, números ou hífen.';
  end if;
  if v_slug = any (array['admin','painel','super','api','l','app','www','login','cadastro','planos','suporte']) then
    raise exception 'Esse endereço é reservado.';
  end if;
  if exists (select 1 from public.stores where slug = v_slug) then raise exception 'Esse endereço já está em uso.'; end if;
  select trial_days into v_trial from public.platform_settings where id = 'main';
  insert into public.stores (slug, name, owner_id, status, trial_ends_at)
    values (v_slug, trim(_name), v_uid, 'trial', now() + make_interval(days => coalesce(v_trial, 7)))
    returning id into v_id;
  insert into public.store_members (store_id, user_id, role) values (v_id, v_uid, 'owner');
  insert into public.store_settings (store_id, config) values (v_id, jsonb_build_object('name', trim(_name)));
  return v_id;
end $$;
grant execute on function public.create_store(text, text) to authenticated;

create or replace function public.admin_list_stores()
returns table (id uuid, slug text, name text, status text, trial_ends_at timestamptz, paid_until timestamptz,
  price_cents int, notes text, created_at timestamptz, owner_email text, orders_count bigint, last_order_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then raise exception 'Acesso negado.'; end if;
  return query
    select s.id, s.slug, s.name, s.status, s.trial_ends_at, s.paid_until, s.price_cents, s.notes, s.created_at,
           u.email::text, coalesce(o.c, 0), o.last
    from public.stores s
    left join auth.users u on u.id = s.owner_id
    left join (select store_id, count(*) c, max(created_at) last from public.orders group by store_id) o on o.store_id = s.id
    order by s.created_at desc;
end $$;
grant execute on function public.admin_list_stores() to authenticated;

create or replace function public.admin_register_payment(_store uuid, _amount_cents int, _months int, _note text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then raise exception 'Acesso negado.'; end if;
  if _months < 1 then raise exception 'Informe ao menos 1 mês.'; end if;
  update public.stores
    set status = 'active',
        paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(months => _months)
    where id = _store;
  insert into public.store_payments (store_id, amount_cents, months, note) values (_store, _amount_cents, _months, _note);
end $$;
grant execute on function public.admin_register_payment(uuid, int, int, text) to authenticated;
