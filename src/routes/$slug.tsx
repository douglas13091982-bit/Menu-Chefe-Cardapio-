import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { getStoreHead } from "../lib/store-head.functions";

const MenuPage = lazy(() => import("../tratto/saas/MenuPage"));

export const Route = createFileRoute("/$slug")({
  // Nome da loja no servidor: a prévia do link (WhatsApp etc.) mostra a loja, não a plataforma
  loader: async ({ params }) => {
    try {
      return await getStoreHead({ data: params.slug });
    } catch {
      return { name: "", origin: "" };
    }
  },
  head: ({ params, loaderData }) => {
    const name = (loaderData?.name || "").trim();
    const title = name || "Cardápio digital";
    const description = name
      ? `Cardápio digital de ${name}. Veja os produtos e faça seu pedido.`
      : "Cardápio digital com pedidos pelo WhatsApp.";
    const image = loaderData?.origin ? `${loaderData.origin}/${encodeURIComponent(params.slug)}/pwa-icon.png` : "";
    return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      ...(name ? [{ property: "og:site_name", content: name }] : []),
      ...(image ? [{ property: "og:image", content: image }, { property: "og:image:width", content: "512" }, { property: "og:image:height", content: "512" }] : []),
      { name: "twitter:card", content: "summary" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      // PWA: cada loja tem o próprio manifest e ícone, com endereço real
      { rel: "manifest", href: `/${encodeURIComponent(params.slug)}/manifest.webmanifest` },
      { rel: "apple-touch-icon", sizes: "180x180", href: `/${encodeURIComponent(params.slug)}/pwa-icon.png` },
    ],
    // O Chrome dispara o evento de instalação logo no carregamento, antes do cardápio montar: guardamos aqui
    scripts: [
      { children: "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e})" },
    ],
    };
  },
  component: StorePage,
});

function MenuLoading() {
  return (
    <main className="min-h-screen bg-[#f8f8fa] text-gray-900" aria-label="Carregando cardápio">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
        <div className="mt-5 h-36 animate-pulse rounded-2xl bg-gray-200 sm:h-44" />
        <div className="mt-6 h-7 w-2/5 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white p-3">
              <div className="aspect-[4/3] animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="mt-4 h-5 w-2/5 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-gray-500">Preparando o cardápio…</p>
      </div>
    </main>
  );
}

function StorePage() {
  const { slug } = Route.useParams();
  return (
    <ClientOnly fallback={<MenuLoading />}>
      <Suspense fallback={<MenuLoading />}>
        <MenuPage slug={slug.toLowerCase()} />
      </Suspense>
    </ClientOnly>
  );
}
