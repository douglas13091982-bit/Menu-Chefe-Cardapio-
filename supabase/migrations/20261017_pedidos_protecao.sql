-- Proteção contra pedidos falsos/spam no cardápio público.
create or replace function public.orders_guard() returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_recent int;
begin
  -- só vale para quem não é da equipe da loja (cliente anônimo ou logado em outra loja)
  if auth.uid() is not null and public.is_store_member(new.store_id) then return new; end if;
  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    raise exception 'Pedido inválido.';
  end if;
  if coalesce(new.data->>'id', '') <> new.id then
    raise exception 'Pedido inválido.';
  end if;
  if jsonb_typeof(new.data->'items') <> 'array' or jsonb_array_length(new.data->'items') = 0 or jsonb_array_length(new.data->'items') > 100 then
    raise exception 'Pedido inválido.';
  end if;
  select count(*) into v_recent from public.orders
    where store_id = new.store_id and created_at > now() - interval '1 minute';
  if v_recent >= 30 then
    raise exception 'Muitos pedidos em pouco tempo. Tente novamente em instantes.';
  end if;
  return new;
end $$;
drop trigger if exists orders_guard_trg on public.orders;
create trigger orders_guard_trg before insert on public.orders for each row execute function public.orders_guard();
