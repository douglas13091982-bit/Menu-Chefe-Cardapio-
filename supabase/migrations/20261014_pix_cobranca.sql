-- Chave Pix da plataforma para cobrança manual das assinaturas
alter table public.platform_settings add column if not exists pix_key text not null default '';
alter table public.platform_settings add column if not exists pix_holder text not null default '';
alter table public.platform_settings add column if not exists pix_city text not null default '';

-- Pagamento durante o teste: a mensalidade começa no fim do teste (não perde os dias restantes)
create or replace function public.admin_register_payment(_store uuid, _amount_cents int, _months int, _note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Acesso negado.'; end if;
  if _months < 1 then raise exception 'Informe ao menos 1 mês.'; end if;
  update public.stores
    set status = 'active',
        paid_until = greatest(coalesce(paid_until, case when status = 'trial' then trial_ends_at end, now()), now()) + make_interval(months => _months)
    where id = _store;
  insert into public.store_payments (store_id, amount_cents, months, note) values (_store, _amount_cents, _months, _note);
end $$;
