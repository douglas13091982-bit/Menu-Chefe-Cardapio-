import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";

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
  }),
  component: Index,
});

function Index() {
  // Prefetch dos chunks de admin/login em idle: a troca de view fica instantânea
  // depois do primeiro paint do cardápio (caminho crítico do cliente final).
  useEffect(() => {
    const idle =
      (window as Window & { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback?.bind(window) ?? ((cb: () => void) => setTimeout(cb, 2000));
    const id = idle(() => {
      void import("../tratto/components/admin/AdminPanel");
      void import("../tratto/components/LoginScreen");
    });
    return () => {
      const cancel =
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback ??
        clearTimeout;
      cancel(id as number);
    };
  }, []);

  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}
