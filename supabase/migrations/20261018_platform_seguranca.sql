-- platform_settings deixa de ser legível por todos: dados públicos e de cobrança passam por funções.
drop policy if exists "publico le plataforma" on public.platform_settings;

create or replace function public.get_platform_public()
returns table (system_name text, logo_url text, hero_background_url text, plan_name text, price_cents int, trial_days int, contact_whatsapp text)
language sql stable security definer set search_path = public
as $$ select p.system_name, p.logo_url, p.hero_background_url, p.plan_name, p.price_cents, p.trial_days, p.contact_whatsapp
      from public.platform_settings p where p.id = 'main' $$;
grant execute on function public.get_platform_public() to anon, authenticated;

create or replace function public.get_platform_billing()
returns table (price_cents int, contact_whatsapp text, pix_key text, pix_holder text, pix_city text)
language sql stable security definer set search_path = public
as $$ select p.price_cents, p.contact_whatsapp, p.pix_key, p.pix_holder, p.pix_city
      from public.platform_settings p
      where p.id = 'main' and auth.uid() is not null
        and (public.is_super_admin() or exists (select 1 from public.store_members m where m.user_id = auth.uid())) $$;
grant execute on function public.get_platform_billing() to authenticated;
revoke execute on function public.get_platform_billing() from anon;

-- bucket público continua servindo as imagens por link; só o super admin lista/lê pela API
drop policy if exists "public le logo da plataforma" on storage.objects;
create policy "super admin le arquivos da plataforma" on storage.objects for select to authenticated
  using (bucket_id = 'platform-branding' and public.is_super_admin());
