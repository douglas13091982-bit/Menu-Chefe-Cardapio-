import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ArrowLeft, Store } from "lucide-react";

const App = lazy(() => import("../tratto/App"));

export const Route = createFileRoute("/$slug")({
  head: () => ({
    meta: [
      { title: "Cardápio digital | Tratto" },
      { name: "description", content: "Acesse o cardápio digital da loja." },
    ],
  }),
  component: StoreSlugPage,
});

function StoreSlugPage() {
  const { slug } = Route.useParams();

  // Mantém a loja original acessível no novo padrão de URL.
  if (slug.toLowerCase() === "tratto") {
    return (
      <ClientOnly fallback={<div className="min-h-screen bg-slate-50" />}>
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
          <App />
        </Suspense>
      </ClientOnly>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Store size={25} /></div>
        <h1 className="mt-5 text-2xl font-bold">Loja não encontrada</h1>
        <p className="mt-3 leading-7 text-slate-600">Esse endereço ainda não está associado a uma loja ativa no Tratto Digital Menu.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"><ArrowLeft size={17} /> Voltar ao início</Link>
      </div>
    </main>
  );
}
