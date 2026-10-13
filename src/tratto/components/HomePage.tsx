import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Bell,
  Check,
  ChefHat,
  ClipboardList,
  Clock,
  Globe2,
  PlayCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Cardápio digital",
    description: "Uma vitrine bonita, rápida e fácil de usar em qualquer celular.",
  },
  {
    icon: ClipboardList,
    title: "Pedidos em tempo real",
    description: "Acompanhe cada pedido por etapa, do recebimento até a entrega.",
  },
  {
    icon: Store,
    title: "Sua marca em destaque",
    description: "Link exclusivo da sua loja para Instagram, WhatsApp e Google.",
  },
  {
    icon: ShoppingBag,
    title: "Pedido de balcão",
    description: "Lance pedidos manuais no painel com cliente e forma de pagamento.",
  },
  {
    icon: Clock,
    title: "Agendamento",
    description: "Com a loja fechada, o cliente agenda entrega ou retirada.",
  },
  {
    icon: Globe2,
    title: "Acesse de qualquer lugar",
    description: "Gerencie sua operação online, pelo celular ou computador.",
  },
];

const steps = [
  ["1", "Crie sua conta", "Cadastre sua loja em poucos minutos, sem cartão de crédito."],
  ["2", "Monte seu cardápio", "Adicione categorias, produtos e fotos, ou importe de outro lugar."],
  ["3", "Compartilhe o link", "Receba pedidos pelo seu link exclusivo e acompanhe no painel."],
];

const included = [
  "Cardápio digital personalizado",
  "Produtos, categorias e fotos",
  "Painel para acompanhar pedidos",
  "Configurações de entrega e retirada",
  "Link exclusivo para sua loja",
];

const orders = [
  ["#1058", "Clássico Smash + Batata", "Aguardando", "R$ 49,90", "text-emerald-400"],
  ["#1057", "BBQ Bacon + Refrigerante", "Preparando", "R$ 44,90", "text-red-400"],
  ["#1056", "Cheese Salada + Suco", "Pronto", "R$ 36,90", "text-sky-400"],
];

const phoneItems = [
  {
    name: "Clássico Smash",
    price: "R$ 29,90",
    desc: "Blend 150g, cheddar, cebola crispy e molho especial.",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "BBQ Bacon",
    price: "R$ 34,90",
    desc: "Blend 150g, bacon crocante, cheddar e molho BBQ.",
    img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&h=200&fit=crop&q=80",
  },
  {
    name: "Batata Crocante",
    price: "R$ 19,90",
    desc: "Porção generosa, crocante por fora e macia por dentro.",
    img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop&q=80",
  },
];

export function HomePage() {
  const [plan, setPlan] = useState<{
    system_name?: string;
    logo_url?: string | null;
    plan_name: string;
    price_cents: number;
    trial_days: number;
    contact_whatsapp: string;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("system_name, logo_url, plan_name, price_cents, trial_days, contact_whatsapp")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPlan(data as any);
      });
  }, []);

  const wa = String(plan?.contact_whatsapp || "").replace(/\D/g, "");
  const price = plan ? "R$ " + (plan.price_cents / 100).toFixed(2).replace(".", ",") : null;
  const name = plan?.system_name || "Tratto Digital Menu";
  const cta =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500";

  return (
    <main className="min-h-screen bg-[#08080a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#08080a]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={name + " início"}>
            {plan?.logo_url ? (
              <img src={plan.logo_url} alt="" className="h-11 w-11 rounded-full object-contain" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                <ChefHat size={24} />
              </span>
            )}
            <span className="truncate text-lg font-bold tracking-tight">{name}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 lg:flex">
            <a href="#recursos" className="hover:text-white transition">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-white transition">
              Planos
            </a>
            <a href="#como-funciona" className="hover:text-white transition">
              Como funciona
            </a>
            <a href="#depoimentos" className="hover:text-white transition">
              Depoimentos
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a href="/painel" className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white transition">
              Entrar
            </a>
            <a href="/cadastro" className={cta}>
              Começar teste grátis <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_40%,rgba(220,38,38,0.35),transparent_55%)]" />
        {/* Background food accents */}
        <div className="pointer-events-none absolute right-0 top-20 hidden h-64 w-64 opacity-20 blur-2xl lg:block">
          <div className="h-full w-full rounded-full bg-gradient-to-br from-amber-600 to-red-700" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Seu cardápio digital.
              <br />
              Seu negócio no <span className="text-red-500">controle.</span>
            </h1>
            <svg
              viewBox="0 0 300 12"
              className="mt-3 h-3 w-72 text-red-600"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 8 C 70 2, 180 2, 298 6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <p className="mt-7 max-w-md text-base leading-8 text-slate-300 sm:text-lg">
              Cardápio digital completo para restaurantes, bares e lanchonetes. Atualize, gerencie e
              acompanhe tudo em tempo real. Feito para o Brasil.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/cadastro" className={cta}>
                Começar teste grátis <ArrowRight size={16} />
              </a>
              <Link
                to="/tratto"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver demonstração <PlayCircle size={18} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={18} className="text-red-500" /> Sem taxa de setup
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={18} className="text-red-500" /> Ative em minutos
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-base">🇧🇷</span> Feito para o Brasil
              </span>
            </div>
          </div>

          {/* Mockups (imagem de referência) */}
          <div className="relative mx-auto w-full max-w-[700px] lg:-mr-10">
            <img src="/home-hero.jpg" alt="Cardápio digital no celular e painel de pedidos no notebook" className="w-full select-none [mask-image:radial-gradient(ellipse_at_center,#000_65%,transparent_100%)]" loading="eager" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="border-t border-white/5 bg-[#0d0d10]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-red-500">Tudo em um só lugar</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Mais praticidade para vender</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-red-500/30 hover:bg-white/[0.05]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/15 text-red-500">
                  <Icon size={23} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-red-500">Como funciona</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">No ar em 3 passos</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <article key={n} className="rounded-2xl border border-white/10 p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold">
                {n}
              </span>
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 leading-7 text-slate-400">{d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="border-t border-white/5 bg-[#0d0d10]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-red-500">Planos simples</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Comece no seu ritmo</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 p-7">
              <p className="text-sm font-semibold text-slate-400">
                Teste grátis{plan ? ` por ${plan.trial_days} dias` : ""}
              </p>
              <p className="mt-3 text-4xl font-bold">R$ 0</p>
              <ul className="mt-6 space-y-3">
                {["Configure sua loja", "Cadastre produtos e categorias", "Conheça o painel de pedidos"].map(
                  (x) => (
                    <li key={x} className="flex gap-2 text-sm text-slate-300">
                      <Check size={17} className="shrink-0 text-emerald-400" />
                      {x}
                    </li>
                  ),
                )}
              </ul>
              <a
                href="/cadastro"
                className="mt-7 inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-4 py-3 font-semibold hover:bg-white/10 transition"
              >
                Iniciar teste grátis
              </a>
            </article>
            <article className="relative rounded-2xl border-2 border-red-600 bg-red-600/5 p-7">
              <span className="absolute right-5 top-5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold">
                Plano principal
              </span>
              <p className="text-sm font-semibold text-slate-400">Assinatura</p>
              <p className="mt-3 text-4xl font-bold">
                {price ?? "—"}
                <span className="text-base font-medium text-slate-400">/mês</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {plan?.plan_name || "Assinatura"} · sem fidelidade
              </p>
              <ul className="mt-6 space-y-3">
                {included.map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-slate-300">
                    <Check size={17} className="shrink-0 text-emerald-400" />
                    {x}
                  </li>
                ))}
              </ul>
              <a href="/cadastro" className={cta + " mt-7 w-full"}>
                Quero começar <ArrowRight size={17} />
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section id="depoimentos" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-red-500">Depoimentos</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Quem já usa, recomenda</h2>
          <p className="mt-4 text-slate-400">Em breve você verá histórias reais de donos de lanchonetes e restaurantes.</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Seu cardápio digital começa aqui.</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Crie sua conta, monte seu cardápio e comece a receber pedidos. O teste é grátis e não pede cartão de crédito.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/cadastro" className={cta}>
              Criar minha loja <ArrowRight size={17} />
            </a>
            {wa && (
              <a
                href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Falar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-5 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {name}. Cardápios digitais para negócios locais.
      </footer>
    </main>
  );
}
