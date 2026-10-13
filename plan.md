# Plano — Redesign da Home Tratto Digital Menu

## Objetivo
Refazer a página inicial para reproduzir a linguagem da referência fornecida: fundo quase preto, vermelho proprietário, hero dividido entre mensagem comercial e mockup do produto, navegação enxuta e CTAs claros para teste grátis.

## Direção de design
- **Movimento:** SaaS gastronômico premium com energia editorial de dark mode e acento vermelho de cozinha/serviço.
- **Princípios:** contraste alto; hierarquia tipográfica forte; produto visível antes da explicação; densidade controlada.
- **Paleta:** `#08090b` (carvão), `#111418` (superfície), `#ed252d` (vermelho Tratto), `#ff4548` (hover/luz), `#f5f6f7` (texto principal), `#9aa3ad` (texto secundário).
- **Layout:** header flutuante e hero assimétrico em duas colunas; mockup maior e levemente deslocado à direita; seções posteriores em blocos de leitura curta.
- **Assinaturas:** sublinhado manual vermelho do headline; brilho radial atrás do mockup; badge de status com ponto verde no mini painel.
- **Interação:** CTAs de alto contraste, links ancorados, menu mobile expansível e hover com elevação mínima.
- **Animação:** apenas transições curtas de opacidade/transformação; respeitar `prefers-reduced-motion`.
- **Tipografia:** `Inter`/system para leitura e pesos 700–900 para headlines; labels em caixa alta com tracking amplo.
- **Essência:** o cardápio digital que dá ao restaurante uma operação mais clara, rápida e vendável. Personalidade: direto, confiável, brasileiro.
- **Voz:** frases ativas e específicas, como “Seu negócio no controle.” e “Ative em minutos”.
- **Marca:** círculo vermelho com chef como selo de produto; wordmark claro e compacto.
- **Cor proprietária:** vermelho Tratto `#ed252d`.

## Implementação
- Reutilizar `public/home-hero.jpg`, já alinhado ao mockup da referência.
- Preservar leitura dinâmica das configurações em `platform_settings`, links de cadastro/painel, preço, WhatsApp e demais rotas existentes.
- Substituir a composição de `src/tratto/components/HomePage.tsx` por uma Home responsiva com hero, funcionalidades, processo, planos, depoimentos e CTA final.
- Adicionar estilos específicos em `src/styles.css`, sem alterar o cardápio público ou o painel administrativo.
- Manter `public/manus-routes.json` sincronizado com as rotas declaradas.

## Estrutura
- `src/routes/index.tsx`: rota `/` e metadados.
- `src/tratto/components/HomePage.tsx`: navegação, hero e seções comerciais.
- `src/styles.css`: tokens globais e acabamento responsivo.
- `public/home-hero.jpg`: mockup visual principal.
- `public/manus-routes.json`: manifesto de páginas públicas.
