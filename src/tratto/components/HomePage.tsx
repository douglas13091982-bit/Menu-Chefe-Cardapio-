import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChefHat, ClipboardList, CreditCard, Globe2, Smartphone, Store, Zap } from "lucide-react";

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
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Tratto início">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white"><ChefHat size={22} /></span>
            <span className="text-lg font-bold tracking-tight">tratto<span className="text-red-600">.</span><span className="ml-2 hidden text-xs font-medium text-slate-500 sm:inline">DIGITAL MENU</span></span>
          </Link>
          <nav className="flex items-center gap-3">
            <a href="#recursos" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">Recursos</a>
            <a href="#planos" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">Planos</a>
            <Link to="/tratto" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Ver demonstração</Link>
            <a href="#comecar" className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">Começar grátis</a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.10),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700"><Zap size={15} /> Seu restaurante pronto para receber pedidos online</div>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Seu cardápio digital. <span className="text-red-600">Seu negócio no controle.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Crie um cardápio profissional para sua lanchonete, hamburgueria ou restaurante. Organize produtos e pedidos em um só lugar, com um link exclusivo para sua loja.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#comecar" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700">Começar teste grátis <ArrowRight size={18} /></a>
              <a href="#recursos" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50">Conhecer recursos</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Fácil de configurar</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Feito para celular</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Sem comissão por pedido na plataforma</span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-red-600">Demonstração</p><h2 className="mt-1 text-lg font-bold">Painel do restaurante</h2></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Online</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Pedidos hoje</p><p className="mt-2 text-3xl font-bold">24</p><p className="mt-1 text-xs text-emerald-700">Acompanhe em tempo real</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Cardápio</p><p className="mt-2 text-3xl font-bold">Ativo</p><p className="mt-1 text-xs text-slate-500">Link pronto para compartilhar</p></div>
              </div>
              <div className="mt-4 space-y-3">
                {[["Novo pedido", "Combo da casa · 2 itens", "Aguardando"], ["Em preparo", "Smash clássico · 1 item", "Preparando"], ["Pronto para retirada", "Batata + bebida · 2 itens", "Pronto"]].map(([title, detail, status], i) => (
                  <div key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${i === 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}><ClipboardList size={19} /></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p></div>
                    <span className="text-xs font-medium text-slate-500">{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white"><Globe2 size={17} className="text-red-400" /><span className="text-slate-300">seusite.com/</span><span className="font-semibold">sua-loja</span></div>
              <p className="mt-3 text-center text-xs text-slate-400">Ilustração demonstrativa da plataforma</p>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-600">Tudo em um só lugar</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Mais praticidade para vender</h2><p className="mt-4 leading-7 text-slate-600">Uma ferramenta simples para organizar a operação e deixar o pedido mais fácil para o cliente.</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600"><Icon size={23} /></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-red-600">Planos simples</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Comece no seu ritmo</h2><p className="mt-4 text-slate-600">Experimente a plataforma antes de escolher a assinatura ideal para seu negócio.</p></div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 p-7"><p className="text-sm font-semibold text-slate-500">Teste grátis</p><p className="mt-3 text-4xl font-bold">R$ 0</p><p className="mt-2 text-sm text-slate-500">Para conhecer a plataforma</p><ul className="mt-6 space-y-3">{["Configure sua loja", "Cadastre produtos e categorias", "Conheça o painel de pedidos"].map(x => <li key={x} className="flex gap-2 text-sm text-slate-700"><Check size={17} className="shrink-0 text-emerald-600" />{x}</li>)}</ul><a href="#comecar" className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 font-semibold hover:bg-slate-50">Iniciar teste grátis</a></article>
          <article className="relative rounded-2xl border-2 border-red-600 p-7 shadow-lg shadow-red-600/10"><span className="absolute right-5 top-5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Plano principal</span><p className="text-sm font-semibold text-slate-500">Assinatura</p><p className="mt-3 text-4xl font-bold">Consulte <span className="text-base font-medium text-slate-500">os planos</span></p><p className="mt-2 text-sm text-slate-500">Conforme as condições da plataforma</p><ul className="mt-6 space-y-3">{included.map(x => <li key={x} className="flex gap-2 text-sm text-slate-700"><Check size={17} className="shrink-0 text-emerald-600" />{x}</li>)}</ul><a href="#comecar" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700">Quero começar <ArrowRight size={17} /></a></article>
        </div>
      </section>

      <section id="comecar" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-sm font-bold uppercase tracking-widest text-red-400">Próximo passo</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Seu cardápio digital começa aqui.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">O cadastro de novas lojas será liberado junto com a implantação da área de assinantes. Enquanto isso, conheça a experiência atual do cardápio Tratto.</p></div>
          <Link to="/tratto" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-100">Abrir demonstração <ArrowRight size={18} /></Link>
        </div>
      </section>
      <footer className="border-t border-slate-800 bg-slate-950 px-5 py-6 text-center text-sm text-slate-400">© {new Date().getFullYear()} Tratto Digital Menu. Cardápios digitais para negócios locais.</footer>
    </main>
  );
}
