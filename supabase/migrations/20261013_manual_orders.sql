-- Loja (gerente) pode criar pedido manual com qualquer status
create policy "loja cria pedido manual" on public.orders for insert to authenticated with check (public.can_manage_store(store_id));
