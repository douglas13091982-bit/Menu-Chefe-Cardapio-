import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const PanelApp = lazy(() => import("../tratto/saas/PanelApp"));

export const Route = createFileRoute("/painel")({
  head: () => ({ meta: [{ title: "Painel da loja" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}><PanelApp /></Suspense>
    </ClientOnly>
  ),
});
