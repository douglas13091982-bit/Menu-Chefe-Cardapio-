# Tratto Digital Menu

Quero migrar para o Lovable um projeto que já existe e funciona: o cardápio digital "Tratto Hamburgueria" (React 18 + TypeScript + Vite + Tailwind, dados em localStorage, sem backend). O código-fonte está num repositório PÚBLICO do GitHub. Por favor, busque cada arquivo pelos links "raw" abaixo e reproduza o projeto de forma FIEL (mesmo visual, mesmos textos em português, mesmas funcionalidades, mesmos dados de exemplo). Não redesenhe nada e não troque a lógica; só adapte o que for necessário para rodar no Lovable.

Repositório: https://github.com/douglas13091982-bit/modelocardapio
Base dos links raw: https://raw.githubusercontent.com/douglas13091982-bit/modelocardapio/94bfcc0110808ec31d6c20b88ed6fe56e9f6b79a/

Arquivos a trazer (caminho relativo à base acima):
- package.json (conferir dependências: recharts, mapbox-gl, etc. e instalar as que faltarem)
- index.html
- src/main.tsx, src/App.tsx, src/index.css, src/types.ts
- src/context/StoreContext.tsx
- src/components/LoginScreen.tsx
- src/components/MenuView.tsx
- src/components/admin/AdminPanel.tsx
- src/components/admin/CategoriesManager.tsx
- src/components/admin/Dashboard.tsx
- src/components/admin/DeliveryPanel.tsx
- src/components/admin/OrdersManager.tsx
- src/components/admin/ProductsManager.tsx
- src/components/admin/SettingsPanel.tsx
- README.md (como referência das funcionalidades)

Resumo do que o app faz:
1) Cardápio público: produtos por categoria (Hambúrgueres, Combos, Acompanhamentos, Sobremesas, Bebidas), modal de detalhes, carrinho com total automático, layout mobile-first, cores vermelho (#ef4444) e branco.
2) Barra superior fixa com logo "T Tratto Hamburgueria" e botões "Cardápio" e "Admin" (e "Sair" quando logado).
3) Painel admin (senha padrão admin123, sessão em sessionStorage): Dashboard com gráficos (Recharts), gestão de pedidos com fluxo de status, CRUD de produtos com upload de foto, categorias, zonas de entrega com mapa MapBox (token opcional via VITE_MAPBOX_TOKEN; sem token o app deve continuar funcionando) e configurações da loja (nome, horário, taxa de entrega, pedido mínimo, aberto/fechado, senha).
4) Persistência em localStorage (chaves store_config, store_products, store_categories, store_orders, store_delivery_zones).

Observações:
- Mantenha o app em um único projeto Vite/React com Tailwind, como no original. Não adicione backend nem autenticação nova por enquanto.
- Se algum arquivo não puder ser buscado, me avise qual foi em vez de inventar o conteúdo.
- Ao terminar, confirme que o cardápio e o painel admin abrem sem erros no preview.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/79f9d367-2503-4430-a5f5-7f47dfc0370e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
