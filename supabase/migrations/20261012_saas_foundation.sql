-- Base inicial multi-loja do Tratto Digital Menu.
-- Não altera as tabelas legadas de produtos/pedidos; a migração dos dados operacionais
-- para isolamento por loja será feita em etapa separada e validada antes de ativar novos cadastros.

create table if not exists public.saas_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  monthly_price_cents integer,
  trial_days integer not null default 7 check (trial_days >= 0),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_plans_price_nonnegative check (monthly_price_cents is null or monthly_price_cents >= 0)
);

create table if not exists public.saas_stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  status text not null default 'trial'
    check (status in ('trial', 'active', 'past_due', 'suspended', 'cancelled')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_stores_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists public.saas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.saas_stores(id) on delete cascade,
  plan_id text references public.saas_plans(id) on delete set null,
  status text not null default 'trial'
    check (status in ('trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_payment_at timestamptz,
  last_payment_amount_cents integer check (last_payment_amount_cents is null or last_payment_amount_cents >= 0),
  payment_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saas_stores_owner_user_id_idx on public.saas_stores(owner_user_id);
create index if not exists saas_stores_status_idx on public.saas_stores(status);
create index if not exists saas_subscriptions_store_id_idx on public.saas_subscriptions(store_id);
create index if not exists saas_subscriptions_status_idx on public.saas_subscriptions(status);

alter table public.saas_plans enable row level security;
alter table public.saas_stores enable row level security;
alter table public.saas_subscriptions enable row level security;

drop policy if exists "publico le planos ativos" on public.saas_plans;
create policy "publico le planos ativos" on public.saas_plans
  for select to anon, authenticated using (active = true);

drop policy if exists "admin gerencia planos SaaS" on public.saas_plans;
create policy "admin gerencia planos SaaS" on public.saas_plans
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "publico le lojas ativas por slug" on public.saas_stores;
create policy "publico le lojas ativas por slug" on public.saas_stores
  for select to anon, authenticated using (status = 'active');

drop policy if exists "dono le sua loja SaaS" on public.saas_stores;
create policy "dono le sua loja SaaS" on public.saas_stores
  for select to authenticated using (owner_user_id = auth.uid());

drop policy if exists "admin gerencia lojas SaaS" on public.saas_stores;
create policy "admin gerencia lojas SaaS" on public.saas_stores
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "dono le assinatura da sua loja" on public.saas_subscriptions;
create policy "dono le assinatura da sua loja" on public.saas_subscriptions
  for select to authenticated using (
    exists (
      select 1 from public.saas_stores s
      where s.id = store_id and s.owner_user_id = auth.uid()
    )
  );

drop policy if exists "admin gerencia assinaturas SaaS" on public.saas_subscriptions;
create policy "admin gerencia assinaturas SaaS" on public.saas_subscriptions
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.saas_plans (id, name, description, monthly_price_cents, trial_days, features, sort_order)
values
  ('trial', 'Teste grátis', 'Período de avaliação da plataforma', 0, 7,
   '["Cardápio digital", "Cadastro de produtos", "Painel de pedidos"]'::jsonb, 1),
  ('professional', 'Profissional', 'Plano de assinatura gerenciado pelo super admin', null, 7,
   '["Cardápio digital", "Produtos e categorias", "Painel de pedidos", "Configurações da loja"]'::jsonb, 2)
on conflict (id) do nothing;

-- Registra a Tratto atual como a primeira loja, sem alterar os dados existentes do cardápio.
insert into public.saas_stores (name, slug, status)
values ('Tratto Hamburgueria', 'tratto', 'active')
on conflict (slug) do update set name = excluded.name, status = 'active', updated_at = now();

insert into public.saas_subscriptions (store_id, plan_id, status)
select id, 'professional', 'active'
from public.saas_stores
where slug = 'tratto'
and not exists (
  select 1 from public.saas_subscriptions sub where sub.store_id = saas_stores.id
);
