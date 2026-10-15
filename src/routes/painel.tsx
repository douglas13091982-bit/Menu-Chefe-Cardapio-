import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const PanelApp = lazy(() => import("../tratto/saas/PanelApp"));

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel da loja | MenuChef" },
      { name: "description", content: "Painel de gestão da sua loja: pedidos, produtos e configurações." },
      { property: "og:title", content: "Painel da loja | MenuChef" },
      { property: "og:description", content: "Painel de gestão da sua loja: pedidos, produtos e configurações." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}><PanelApp /></Suspense>
    </ClientOnly>
  ),
});
