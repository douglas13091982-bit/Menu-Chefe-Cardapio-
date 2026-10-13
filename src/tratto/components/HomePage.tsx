import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Check, ChefHat, ClipboardList, Globe2, Smartphone, Store, Zap } from "lucide-react";

const features = [
  { icon: Smartphone, title: "Cardápio que funciona no celular", description: "Uma experiência rápida e intuitiva para seus clientes pedirem de qualquer lugar." },
  { icon: ClipboardList, title: "Pedidos organizados", description: "Receba e acompanhe os pedidos em um painel simples, sem confusão." },
  { icon: Store, title: "Sua marca, seu endereço", description: "Tenha um link exclusivo para compartilhar no Instagram, WhatsApp e Google." },
];

const included = [
  "Cardápio digital personalizado",
  "Produtos, categorias e fotos",
  "Painel para acompanhar pedidos",
  "Configurações de entrega e retirada",
  "Link exclusivo para sua loja",
];

export function HomePage() {
  const [plan, setPlan] = useState<{ system_name?: string; logo_url?: string | null; plan_name: string; price_cents: number; trial_days: number; contact_whatsapp: string } | null>(null);
  useEffect(() => {
    supabase.from("platform_settings").select("system_name, logo_url, plan_name, price_cents, trial_days, contact_whatsapp").eq("id", "main").maybeSingle()
      .then(({ data }) => { if (data) setPlan(data as any); });
  }, []);
  const wa = String(plan?.contact_whatsapp || "").replace(/\D/g, "");
  const price = plan ? "R$ " + (plan.price_cents / 100).toFixed(2).replace(".", ",") : null;
  return (
    <main className="min-h-screen bg-[#f4f7fc] text-[#14284b]">
      <header className="sticky top-0 z-20 border-b border-[#dce4ef] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 min-w-0" aria-label={(plan?.system_name || "Tratto Digital Menu") + " início"}>
            {plan?.logo_url
              ? <img src={plan.logo_url} alt="" className="h-10 w-10 rounded-xl object-contain" />
              : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9233a] text-white"><ChefHat size={22} /></span>}
            <span className="truncate text-lg font-bold tracking-tight">{plan?.system_name || "Tratto Digital Menu"}</span>
          </Link>
          <nav className="flex items-center gap-3">
            <a href="#recursos" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">Recursos</a>
            <a href="#planos" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">Planos</a>
            <Link to="/tratto" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Ver demonstração</Link>
            <a href="/painel" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline">Entrar</a>
            <a href="/cadastro" className="rounded-lg bg-[#c9233a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a7192d]">Começar grátis</a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#14284b] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,35,58,0.35),transparent_48%)]" /><div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 border-l border-white/5 bg-white/[0.02]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-medium text-white"><Zap size={15} /> Seu restaurante pronto para receber pedidos online</div>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Seu cardápio digital. <span className="text-[#ff5368]">Seu negócio no controle.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100/80">Crie um cardápio profissional para sua lanchonete, hamburgueria ou restaurante. Organize produtos e pedidos em um só lugar, com um link exclusivo para sua loja.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/cadastro" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9233a] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#c9233a]/20 transition hover:bg-[#a7192d]">Começar teste grátis <ArrowRight size={18} /></a>
              <a href="#recursos" className="inline-flex items-center justify-center rounded-xl border border-[#dce4ef] px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50">Conhecer recursos</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#ff5368]" /> Fácil de configurar</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#ff5368]" /> Feito para celular</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#ff5368]" /> Sem comissão por pedido na plataforma</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-white/70 bg-white p-4 text-[#14284b] shadow-2xl shadow-black/30 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-[#c9233a]">Demonstração</p><h2 className="mt-1 text-lg font-bold">Painel do restaurante</h2></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Online</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Pedidos hoje</p><p className="mt-2 text-3xl font-bold">24</p><p className="mt-1 text-xs text-emerald-700">Acompanhe em tempo real</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Cardápio</p><p className="mt-2 text-3xl font-bold">Ativo</p><p className="mt-1 text-xs text-slate-500">Link pronto para compartilhar</p></div>
              </div>
              <div className="mt-4 space-y-3">
                {[["Novo pedido", "Combo da casa · 2 itens", "Aguardando"], ["Em preparo", "Smash clássico · 1 item", "Preparando"], ["Pronto para retirada", "Batata + bebida · 2 itens", "Pronto"]].map(([title, detail, status], i) => (
                  <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${i === 0 ? "bg-[#fff0f2] text-[#c9233a]" : "bg-slate-100 text-slate-600"}`}><ClipboardList size={19} /></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p></div>
                    <span className="text-xs font-medium text-slate-500">{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white"><Globe2 size={17} className="text-[#ff5368]" /><span className="text-slate-300">seusite.com/</span><span className="font-semibold">sua-loja</span></div>
              <p className="mt-3 text-center text-xs text-slate-400">Ilustração demonstrativa da plataforma</p>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="border-y border-[#dce4ef] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#c9233a]">Tudo em um só lugar</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Mais praticidade para vender</h2><p className="mt-4 leading-7 text-slate-600">Uma ferramenta simples para organizar a operação e deixar o pedido mais fácil para o cliente.</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-[#dce4ef] bg-white p-7 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0f2] text-[#c9233a]"><Icon size={23} /></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-[#c9233a]">Planos simples</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Comece no seu ritmo</h2><p className="mt-4 text-slate-600">Experimente a plataforma antes de escolher a assinatura ideal para seu negócio.</p></div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-[#dce4ef] p-7"><p className="text-sm font-semibold text-slate-500">Teste grátis{plan ? ` por ${plan.trial_days} dias` : ""}</p><p className="mt-3 text-4xl font-bold">R$ 0</p><p className="mt-2 text-sm text-slate-500">Para conhecer a plataforma</p><ul className="mt-6 space-y-3">{["Configure sua loja", "Cadastre produtos e categorias", "Conheça o painel de pedidos"].map(x => <li key={x} className="flex gap-2 text-sm text-slate-700"><Check size={17} className="shrink-0 text-emerald-600" />{x}</li>)}</ul><a href="/cadastro" className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-[#dce4ef] px-4 py-3 font-semibold hover:bg-slate-50">Iniciar teste grátis</a></article>
          <article className="relative rounded-2xl border-2 border-[#c9233a] p-7 shadow-lg shadow-[#c9233a]/10"><span className="absolute right-5 top-5 rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-bold text-[#a7192d]">Plano principal</span><p className="text-sm font-semibold text-slate-500">Assinatura</p><p className="mt-3 text-4xl font-bold">{price ?? "—"}<span className="text-base font-medium text-slate-500">/mês</span></p><p className="mt-2 text-sm text-slate-500">{plan?.plan_name || "Assinatura"} · sem fidelidade</p><ul className="mt-6 space-y-3">{included.map(x => <li key={x} className="flex gap-2 text-sm text-slate-700"><Check size={17} className="shrink-0 text-emerald-600" />{x}</li>)}</ul><a href="/cadastro" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9233a] px-4 py-3 font-semibold text-white hover:bg-[#a7192d]">Quero começar <ArrowRight size={17} /></a></article>
        </div>
      </section>

      <section id="comecar" className="bg-[#14284b] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-sm font-bold uppercase tracking-widest text-[#ff5368]">Próximo passo</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Seu cardápio digital começa aqui.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">Crie sua conta, monte seu cardápio e comece a receber pedidos pelo WhatsApp. O teste é grátis e não pede cartão de crédito.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><a href="/cadastro" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9233a] px-5 py-3.5 font-semibold text-white transition hover:bg-[#a7192d]">Criar minha loja <ArrowRight size={18} /></a><Link to="/tratto" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-100">Ver demonstração</Link>{wa && <a href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800">Falar no WhatsApp</a>}</div>
        </div>
      </section>
      <footer className="border-t border-slate-800 bg-slate-950 px-5 py-6 text-center text-sm text-slate-400">© {new Date().getFullYear()} Tratto Digital Menu. Cardápios digitais para negócios locais.</footer>
    </main>
  );
}
