import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Bell, Check, ChefHat, ClipboardList, Clock, Globe2, PlayCircle, Search, ShieldCheck, ShoppingBag, Smartphone, Store, Zap } from "lucide-react";

const features = [
  { icon: Smartphone, title: "Cardápio digital", description: "Uma vitrine bonita, rápida e fácil de usar em qualquer celular." },
  { icon: ClipboardList, title: "Pedidos em tempo real", description: "Acompanhe cada pedido por etapa, do recebimento até a entrega." },
  { icon: Store, title: "Sua marca em destaque", description: "Link exclusivo da sua loja para Instagram, WhatsApp e Google." },
  { icon: ShoppingBag, title: "Pedido de balcão", description: "Lance pedidos manuais no painel com cliente e forma de pagamento." },
  { icon: Clock, title: "Agendamento", description: "Com a loja fechada, o cliente agenda entrega ou retirada." },
  { icon: Globe2, title: "Acesse de qualquer lugar", description: "Gerencie sua operação online, pelo celular ou computador." },
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

const phoneItems = [["Clássico Smash", "R$ 29,90"], ["BBQ Bacon", "R$ 34,90"], ["Batata Crocante", "R$ 19,90"]];

export function HomePage() {
  const [plan, setPlan] = useState<{ system_name?: string; logo_url?: string | null; plan_name: string; price_cents: number; trial_days: number; contact_whatsapp: string } | null>(null);
  useEffect(() => {
    supabase.from("platform_settings").select("system_name, logo_url, plan_name, price_cents, trial_days, contact_whatsapp").eq("id", "main").maybeSingle()
      .then(({ data }) => { if (data) setPlan(data as any); });
  }, []);
  const wa = String(plan?.contact_whatsapp || "").replace(/\D/g, "");
  const price = plan ? "R$ " + (plan.price_cents / 100).toFixed(2).replace(".", ",") : null;
  const name = plan?.system_name || "Tratto Digital Menu";
  const cta = "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500";
  return (
    <main className="min-h-screen bg-[#08080a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#08080a]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={name + " início"}>
            {plan?.logo_url
              ? <img src={plan.logo_url} alt="" className="h-11 w-11 rounded-full object-contain" />
              : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"><ChefHat size={24} /></span>}
            <span className="truncate text-lg font-bold tracking-tight">{name}</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 lg:flex">
            <a href="#recursos" className="hover:text-white">Funcionalidades</a>
            <a href="#planos" className="hover:text-white">Planos</a>
            <a href="#como-funciona" className="hover:text-white">Como funciona</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/painel" className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white">Entrar</a>
            <a href="/cadastro" className={cta}>Começar teste grátis <ArrowRight size={16} /></a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_40%,rgba(220,38,38,0.35),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Seu cardápio digital.<br />Seu negócio no <span className="text-red-600">controle.</span></h1>
            <svg viewBox="0 0 300 12" className="mt-3 h-3 w-72 text-red-600" fill="none" preserveAspectRatio="none"><path d="M2 8 C 70 2, 180 2, 298 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            <p className="mt-7 max-w-md text-base leading-8 text-slate-300 sm:text-lg">Cardápio digital completo para restaurantes, bares e lanchonetes. Atualize, gerencie e acompanhe tudo em tempo real. Feito para o Brasil.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/cadastro" className={cta}>Começar teste grátis <ArrowRight size={16} /></a>
              <Link to="/tratto" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Ver demonstração <PlayCircle size={18} /></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-red-500" /> Sem taxa de setup</span>
              <span className="inline-flex items-center gap-2"><Clock size={18} className="text-red-500" /> Ative em minutos</span>
              <span className="inline-flex items-center gap-2"><span className="text-base">🇧🇷</span> Feito para o Brasil</span>
            </div>
          </div>

          <div className="relative mx-auto h-[430px] w-full max-w-[640px] sm:h-[480px]">
            <div className="absolute right-0 top-4 w-[88%] rounded-t-2xl border border-white/10 bg-[#101013] p-3 shadow-2xl shadow-black/60">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600"><ChefHat size={13} /></span>Búrguer & Cia<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">● Online</span></div>
                <div className="flex gap-3 text-slate-400"><Search size={14} /><Bell size={14} /></div>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 pt-3">
                <div className="hidden space-y-1 text-[11px] text-slate-400 sm:block">
                  {["Visão geral", "Pedidos", "Cardápio", "Mesas", "Avaliações", "Relatórios", "Configurações"].map((x, i) => <div key={x} className={`rounded-md px-2 py-1.5 ${i === 0 ? "bg-red-600 text-white" : ""}`}>{x}</div>)}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm font-bold">Pedidos em tempo real</p>
                  <div className="mt-2 space-y-2">
                    {orders.map(([id, items, st, total, c]) => (
                      <div key={id} className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5 text-[11px]">
                        <div className="flex justify-between"><b>Pedido {id}</b><span className={c}>● {st}</span></div>
                        <div className="mt-1 flex justify-between text-slate-400"><span>{items}</span><b className="text-white">{total}</b></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                    <div className="rounded-lg bg-white/[0.03] p-2">Pedidos hoje<b className="block text-sm text-white">28</b></div>
                    <div className="rounded-lg bg-white/[0.03] p-2">Faturamento<b className="block text-sm text-white">R$ 1.842,50</b></div>
                    <div className="rounded-lg bg-white/[0.03] p-2">Preparo<b className="block text-sm text-white">18 min</b></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 right-[-2%] h-3 w-[96%] rounded-b-2xl bg-gradient-to-b from-slate-600 to-slate-800" />
            <div className="absolute bottom-0 left-0 z-10 w-[40%] min-w-[190px] rounded-[2rem] border-[5px] border-slate-800 bg-[#0c0c0f] p-3 shadow-2xl shadow-black/70">
              <div className="mx-auto mb-2 h-4 w-16 rounded-full bg-black" />
              <div className="flex items-center justify-between text-sm font-bold">Cardápio <span className="relative"><ShoppingBag size={15} /><i className="absolute -right-2 -top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] not-italic">2</i></span></div>
              <div className="mt-2 flex items-center gap-1 rounded-md bg-white/5 px-2 py-1.5 text-[10px] text-slate-400"><Search size={11} />Buscar no cardápio...</div>
              <div className="mt-2 flex gap-1 text-[9px]">{["Destaques", "Hambúrgueres", "Porções"].map(x => <span key={x} className="rounded-full bg-white/10 px-2 py-1">{x}</span>)}</div>
              <div className="mt-2 space-y-2">
                {phoneItems.map(([n, p]) => (
                  <div key={n} className="flex items-center gap-2 rounded-lg bg-white/[0.04] p-2">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-amber-500 via-red-700 to-amber-900" />
                    <div className="text-[11px]"><b>{n}</b><p className="mt-0.5 text-[9px] text-slate-400">Feito na hora, com ingredientes selecionados.</p><b>{p}</b></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="border-t border-white/5 bg-[#0d0d10]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-500">Tudo em um só lugar</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Mais praticidade para vender</h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/15 text-red-500"><Icon size={23} /></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-400">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-500">Como funciona</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">No ar em 3 passos</h2></div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(([n, t, d]) => <article key={n} className="rounded-2xl border border-white/10 p-7"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold">{n}</span><h3 className="mt-4 text-lg font-bold">{t}</h3><p className="mt-2 leading-7 text-slate-400">{d}</p></article>)}
        </div>
      </section>

      <section id="planos" className="border-t border-white/5 bg-[#0d0d10]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-500">Planos simples</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Comece no seu ritmo</h2></div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 p-7"><p className="text-sm font-semibold text-slate-400">Teste grátis{plan ? ` por ${plan.trial_days} dias` : ""}</p><p className="mt-3 text-4xl font-bold">R$ 0</p><ul className="mt-6 space-y-3">{["Configure sua loja", "Cadastre produtos e categorias", "Conheça o painel de pedidos"].map(x => <li key={x} className="flex gap-2 text-sm text-slate-300"><Check size={17} className="shrink-0 text-emerald-400" />{x}</li>)}</ul><a href="/cadastro" className="mt-7 inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-4 py-3 font-semibold hover:bg-white/10">Iniciar teste grátis</a></article>
            <article className="relative rounded-2xl border-2 border-red-600 bg-red-600/5 p-7"><span className="absolute right-5 top-5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold">Plano principal</span><p className="text-sm font-semibold text-slate-400">Assinatura</p><p className="mt-3 text-4xl font-bold">{price ?? "—"}<span className="text-base font-medium text-slate-400">/mês</span></p><p className="mt-2 text-sm text-slate-400">{plan?.plan_name || "Assinatura"} · sem fidelidade</p><ul className="mt-6 space-y-3">{included.map(x => <li key={x} className="flex gap-2 text-sm text-slate-300"><Check size={17} className="shrink-0 text-emerald-400" />{x}</li>)}</ul><a href="/cadastro" className={cta + " mt-7 w-full"}>Quero começar <ArrowRight size={17} /></a></article>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Seu cardápio digital começa aqui.</h2>
          <p className="mt-4 leading-7 text-slate-300">Crie sua conta, monte seu cardápio e comece a receber pedidos. O teste é grátis e não pede cartão de crédito.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><a href="/cadastro" className={cta}>Criar minha loja <ArrowRight size={17} /></a>{wa && <a href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Falar no WhatsApp</a>}</div>
        </div>
      </section>
      <footer className="border-t border-white/5 px-5 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} {name}. Cardápios digitais para negócios locais.</footer>
    </main>
  );
}
