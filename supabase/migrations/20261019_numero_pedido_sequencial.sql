-- Número sequencial de pedido por loja (#0001, #0002, ...).
-- O banco é quem numera (atômico, sem repetir mesmo com vários pedidos ao mesmo tempo).
-- O número fica em orders.data->>'number'; o id continua sendo a chave única do pedido.

create table if not exists public.store_order_counters (
  store_id uuid primary key references public.stores(id) on delete cascade,
  last_number integer not null default 0
);
-- RLS ligada e sem políticas: só as funções abaixo (security definer) mexem no contador.
alter table public.store_order_counters enable row level security;

create or replace function public.next_order_number(_store_id uuid) returns integer
language plpgsql security definer set search_path = public as $fn$
declare n integer;
begin
  insert into public.store_order_counters (store_id, last_number) values (_store_id, 1)
  on conflict (store_id) do update set last_number = public.store_order_counters.last_number + 1
  returning last_number into n;
  return n;
end $fn$;
revoke all on function public.next_order_number(uuid) from public, anon, authenticated;

-- Dá o número ao pedido na hora de gravar (ignora qualquer número vindo do navegador).
-- Roda depois de orders_guard_trg (ordem alfabética dos gatilhos) e não mexe em data->>'id'.
create or replace function public.orders_assign_number() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  new.data := jsonb_set(coalesce(new.data, '{}'::jsonb), '{number}', to_jsonb(public.next_order_number(new.store_id)), true);
  return new;
end $fn$;

-- O cliente (anônimo) não pode ler pedidos; para mostrar "Seu pedido #0012" ele pergunta só o número do próprio pedido.
create or replace function public.get_order_number(_store_id uuid, _order_id text) returns integer
language sql stable security definer set search_path = public as $fn$
  select nullif(data->>'number', '')::integer from public.orders where store_id = _store_id and id = _order_id
$fn$;
grant execute on function public.get_order_number(uuid, text) to anon, authenticated;

-- Pedidos que já existiam: numera pela ordem de criação, loja por loja.
lock table public.orders in share row exclusive mode;
with n as (
  select store_id, id, row_number() over (partition by store_id order by created_at, id) as rn from public.orders
)
update public.orders o set data = jsonb_set(o.data, '{number}', to_jsonb(n.rn))
from n where o.store_id = n.store_id and o.id = n.id and not (o.data ? 'number');

insert into public.store_order_counters (store_id, last_number)
  select store_id, max((data->>'number')::integer) from public.orders group by store_id
  on conflict (store_id) do update set last_number = greatest(public.store_order_counters.last_number, excluded.last_number);

drop trigger if exists orders_number_trg on public.orders;
create trigger orders_number_trg before insert on public.orders for each row execute function public.orders_assign_number();
