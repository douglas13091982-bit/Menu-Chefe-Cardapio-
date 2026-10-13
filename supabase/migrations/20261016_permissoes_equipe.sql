-- Colaborador (staff) só opera pedidos; dono/administrador gerenciam o resto.
create or replace function public.can_admin_store(_store uuid) returns boolean
language sql stable security definer set search_path = public
as $$ select public.is_super_admin() or (
  public.store_is_servable(_store) and exists (
    select 1 from public.store_members
    where store_id = _store and user_id = auth.uid() and role in ('owner', 'admin'))) $$;

drop policy if exists "gerencia configuracoes da loja" on public.store_settings;
drop policy if exists "gerencia categorias da loja" on public.categories;
drop policy if exists "gerencia produtos da loja" on public.products;
drop policy if exists "gerencia zonas da loja" on public.delivery_zones;
drop policy if exists "gerencia segredos da loja" on public.store_secrets;
create policy "gerencia configuracoes da loja" on public.store_settings for all to authenticated
  using (public.can_admin_store(store_id)) with check (public.can_admin_store(store_id));
create policy "gerencia categorias da loja" on public.categories for all to authenticated
  using (public.can_admin_store(store_id)) with check (public.can_admin_store(store_id));
create policy "gerencia produtos da loja" on public.products for all to authenticated
  using (public.can_admin_store(store_id)) with check (public.can_admin_store(store_id));
create policy "gerencia zonas da loja" on public.delivery_zones for all to authenticated
  using (public.can_admin_store(store_id)) with check (public.can_admin_store(store_id));
create policy "gerencia segredos da loja" on public.store_secrets for all to authenticated
  using (public.can_admin_store(store_id)) with check (public.can_admin_store(store_id));
-- apagar pedidos: só dono/administrador (colaborador continua lendo, criando e alterando status)
drop policy if exists "loja apaga pedidos" on public.orders;
create policy "loja apaga pedidos" on public.orders for delete to authenticated using (public.can_admin_store(store_id));
