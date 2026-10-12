import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MenuPage = lazy(() => import("../tratto/saas/MenuPage"));

export const Route = createFileRoute("/$slug")({
  head: () => ({
    meta: [
      { title: "Cardápio digital" },
      { name: "description", content: "Cardápio digital com pedidos pelo WhatsApp." },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-gray-50" />}>
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <MenuPage slug={slug.toLowerCase()} />
      </Suspense>
    </ClientOnly>
  );
}
