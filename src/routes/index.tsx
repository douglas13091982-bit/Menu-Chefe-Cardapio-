import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const App = lazy(() => import("../tratto/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tratto Hamburgueria - Cardápio" },
      { name: "description", content: "Cardápio digital da Tratto Hamburgueria: hambúrgueres, combos, acompanhamentos, sobremesas e bebidas." },
      { property: "og:title", content: "Tratto Hamburgueria - Cardápio" },
      { property: "og:description", content: "Cardápio digital da Tratto Hamburgueria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}
