# Arquitetura

SaaS multiloja de cardápio digital: TanStack Start + React + Supabase.

## Rotas (`src/routes`)
`/` home · `/cadastro` → `/painel` · `/painel` painel da loja · `/super` super admin · `/:slug` cardápio público.
Páginas só de navegador usam `ClientOnly` + `lazy`.

## Código (`src/tratto`)
| Pasta/arquivo | Responsabilidade |
|---|---|
| `format.ts` | **Única** fonte de formatação: `money`, `moneyCents`, `fmtDate`, `daysLeft`, `slugify`, `whatsappUrl` |
| `services/` | Acesso a dados que não é de uma loja (ex.: `platform.ts` → configurações da plataforma) |
| `context/StoreContext.tsx` | Dados da loja (público ou painel), realtime de pedidos, avisos de falha ao gravar |
| `cep.ts`, `hours.ts`, `coupons.ts`, `freight.ts`, `whatsapp.ts` | Regras de negócio puras, sem UI |
| `components/MenuView.tsx` | Cardápio público e checkout |
| `components/admin/*` | Abas do painel da loja (cada aba = um arquivo) |
| `saas/PanelApp.tsx` | Orquestra login → loja → bloqueio por assinatura |
| `saas/panel/*` | Telas do painel: `AuthScreens`, `Billing` (Pix/QR), `PanelShell`, `pendingStore` |
| `saas/SuperAdmin.tsx`, `saas/pix.ts` | Super admin; geração do Pix copia e cola |

## Servidor (`src/lib/*.functions.ts`)
Funções com `createServerFn` + `requireSupabaseAuth`: importação de catálogo (chave GeckoAPI só no servidor) e gestão de equipe (chave de serviço só no servidor).

## Banco (`supabase/migrations`)
Tudo por `store_id` com RLS. Funções: `can_manage_store` (qualquer membro — pedidos) e `can_admin_store` (dono/administrador — produtos, configurações, equipe).

## Convenções
- Não criar formatadores de moeda/data locais: usar `tratto/format.ts`.
- Não usar a tag `aside` em telas novas (há estilo global antigo para ela).
- Consultas ao Supabase de dados globais ficam em `services/`; dados da loja, no `StoreContext`.
