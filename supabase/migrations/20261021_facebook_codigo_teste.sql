-- Código de evento de teste da API de Conversões do Meta (opcional; só o admin da loja lê/escreve, como o token).
alter table public.store_secrets add column if not exists facebook_test_event_code text;
