import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Check,
  ChefHat,
  ClipboardList,
  Clock3,
  Globe2,
  Menu,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  X,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    eyebrow: "Experiência",
    title: "Cardápio bonito no celular",
    description: "Seu cliente encontra o que quer, escolhe os extras e pede sem complicação.",
  },
  {
    icon: ClipboardList,
    eyebrow: "Operação",
    title: "Pedidos em tempo real",
    description: "Veja cada pedido por etapa e saiba o que precisa sair agora — sem perder tempo.",
  },
  {
    icon: Store,
    eyebrow: "Marca",
    title: "Seu link, seu negócio",
    description: "Uma vitrine própria para compartilhar no Instagram, WhatsApp e Google.",
  },
  {
    icon: ShoppingBag,
    eyebrow: "Vendas",
    title: "Balcão e delivery",
    description: "Centralize os pedidos da loja, da retirada e da entrega no mesmo painel.",
  },
  {
    icon: Clock3,
    eyebrow: "Controle",
    title: "Horários sob medida",
    description: "Configure abertura, retirada e pedidos agendados do seu jeito.",
  },
  {
    icon: Globe2,
    eyebrow: "Liberdade",
    title: "Acesse de onde estiver",
    description: "Gerencie sua operação no computador, tablet ou celular, sem instalar nada.",
  },
];

const steps = [
  ["01", "Crie sua conta", "Cadastre o nome da sua loja e comece o teste grátis."],
  ["02", "Monte seu cardápio", "Adicione categorias, produtos, fotos, preços e opções."],
  ["03", "Compartilhe e venda", "Publique seu link e acompanhe tudo no painel."],
];

const included = [
  "Cardápio digital personalizado",
  "Produtos, categorias e fotos",
  "Painel de pedidos em tempo real",
  "Entrega, retirada e agendamento",
  "Link exclusivo para sua loja",
];

const testimonials = [
  {
    quote:
      "Agora eu vejo o pedido assim que entra e não fico mais procurando mensagem no WhatsApp.",
    name: "Mariana Alves",
    role: "Hamburgueria em São Paulo",
  },
  {
    quote:
      "Ficou muito mais fácil mandar o link do cardápio para os clientes e atualizar os preços.",
    name: "Rafael Costa",
    role: "Lanchonete em Belo Horizonte",
  },
  {
    quote: "A equipe começou a usar no mesmo dia. É simples, rápido e tem a cara do meu negócio.",
    name: "Camila Souza",
    role: "Restaurante em Curitiba",
  },
];

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
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
        if (data) setPlan(data as NonNullable<typeof plan>);
      });
  }, []);

  const wa = String(plan?.contact_whatsapp || "").replace(/\D/g, "");
  const price = plan ? "R$ " + (plan.price_cents / 100).toFixed(2).replace(".", ",") : null;
  const name = plan?.system_name || "Tratto Digital Menu";
  const trialText = plan?.trial_days ? `${plan.trial_days} dias grátis` : "teste grátis";
  const cta =
    "home-cta inline-flex items-center justify-center gap-2 rounded-lg bg-[#ed252d] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#ff4548]";

  return (
    <main className="home-page min-h-screen overflow-hidden bg-[#08090b] text-[#f5f6f7]">
      <header className="home-header sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090b]/90 backdrop-blur-xl">
        <div className="home-container flex h-[76px] items-center justify-between gap-6">
          <Link
            to="/"
            className="home-brand flex min-w-0 items-center gap-3"
            aria-label={`${name} início`}
          >
            {plan?.logo_url ? (
              <img
                src={plan.logo_url}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-contain"
              />
            ) : (
              <span className="home-brand-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ed252d] text-white">
                <ChefHat size={24} strokeWidth={2.2} />
              </span>
            )}
            <span className="truncate text-[18px] font-bold tracking-[-0.03em] text-white">
              {name}
            </span>
          </Link>
          <nav
            className="hidden items-center gap-8 text-[14px] font-medium text-[#b9bec5] lg:flex"
            aria-label="Navegação principal"
          >
            <a href="#recursos" className="home-nav-link">
              Funcionalidades
            </a>
            <a href="#planos" className="home-nav-link">
              Planos
            </a>
            <a href="#como-funciona" className="home-nav-link">
              Como funciona
            </a>
            <a href="#depoimentos" className="home-nav-link">
              Depoimentos
            </a>
          </nav>
          <div className="hidden items-center gap-4 sm:flex">
            <a href="/painel" className="home-login-link">
              Entrar
            </a>
            <a href="/cadastro" className={`${cta} px-5 py-3`}>
              Começar teste grátis <ArrowRight size={16} strokeWidth={2.4} />
            </a>
          </div>
          <button
            type="button"
            className="home-menu-button flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-white sm:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/[0.07] bg-[#0c0e11] px-5 py-5 sm:hidden">
            <nav className="home-mobile-nav flex flex-col gap-1" aria-label="Navegação mobile">
              {[
                ["#recursos", "Funcionalidades"],
                ["#planos", "Planos"],
                ["#como-funciona", "Como funciona"],
                ["#depoimentos", "Depoimentos"],
              ].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4">
                <a href="/painel" className="home-mobile-secondary">
                  Entrar
                </a>
                <a href="/cadastro" className="home-mobile-primary">
                  Começar grátis
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      <section className="home-hero relative overflow-hidden">
        <div className="home-hero-glow home-hero-glow-one" />
        <div className="home-hero-glow home-hero-glow-two" />
        <div className="home-container home-hero-grid relative items-center">
          <div className="home-hero-copy">
            <div className="home-kicker">
              <span className="home-kicker-dot" />A plataforma de quem vende comida
            </div>
            <h1 className="mt-6 max-w-[610px] text-[clamp(2.75rem,5.3vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.055em] text-white">
              Seu cardápio digital.
              <br />
              Seu negócio no <span className="home-red-text">controle.</span>
            </h1>
            <div className="home-hero-underline" aria-hidden="true">
              <svg viewBox="0 0 420 16" fill="none" preserveAspectRatio="none">
                <path
                  d="M4 10C90 1 282 3 416 8"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="mt-7 max-w-[520px] text-[17px] leading-[1.7] text-[#aeb5bd] sm:text-[19px]">
              Cardápio digital completo para restaurantes, bares e lanchonetes. Atualize, gerencie e
              acompanhe tudo em tempo real. Feito para o Brasil.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/cadastro" className={`${cta} px-6 py-4`}>
                Começar teste grátis <ArrowRight size={18} strokeWidth={2.4} />
              </a>
              <a
                href="/tratto"
                className="home-outline-cta inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.06]"
              >
                Ver demonstração <PlayCircle size={19} />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-[#b7bdc4]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#ed252d]" /> Sem taxa de setup
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={18} className="text-[#ed252d]" /> Ative em minutos
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-base">🇧🇷</span> Feito para o Brasil
              </span>
            </div>
          </div>
          <div className="home-hero-visual relative">
            <div className="home-hero-orbit" />
            <div className="home-hero-image-frame">
              <img
                src="/home-hero.jpg"
                alt="Cardápio digital no celular e painel de pedidos no notebook"
                className="home-hero-image w-full select-none"
                loading="eager"
              />
            </div>
            <div className="home-live-badge hidden sm:flex">
              <span className="home-live-dot" />
              <span>
                <strong>Pedidos em tempo real</strong>
                <br />
                <small>tudo sob controle</small>
              </span>
            </div>
          </div>
        </div>
        <div className="home-container home-proof-row">
          <span>Feito para a rotina de quem vende todos os dias</span>
          <div className="home-proof-line" />
          <span className="home-proof-stat">
            <strong>+ simples</strong> para sua equipe
          </span>
          <span className="home-proof-stat">
            <strong>+ rápido</strong> para seus clientes
          </span>
        </div>
      </section>

      <section id="recursos" className="home-section home-features-section">
        <div className="home-container">
          <div className="home-section-heading home-section-heading-split">
            <div>
              <p className="home-eyebrow">Tudo que você precisa</p>
              <h2>
                Menos improviso.
                <br />
                <span>Mais operação.</span>
              </h2>
            </div>
            <p className="home-section-lede">
              Uma ferramenta direta para transformar o cardápio em uma parte forte do seu negócio —
              da primeira visita ao pedido entregue.
            </p>
          </div>
          <div className="home-feature-grid mt-14">
            {features.map(({ icon: Icon, eyebrow, title, description }) => (
              <article key={title} className="home-feature-card">
                <div className="home-feature-icon">
                  <Icon size={22} strokeWidth={1.9} />
                </div>
                <p className="home-card-eyebrow">{eyebrow}</p>
                <h3>{title}</h3>
                <p className="home-feature-description">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="home-section home-process-section">
        <div className="home-container">
          <div className="home-process-intro">
            <p className="home-eyebrow">Como funciona</p>
            <h2>
              Do cadastro ao
              <br />
              <span>primeiro pedido.</span>
            </h2>
            <p>Você não precisa aprender uma ferramenta complicada para começar a vender melhor.</p>
          </div>
          <div className="home-steps">
            {steps.map(([number, title, description], index) => (
              <article key={number} className="home-step">
                <div className="home-step-top">
                  <span>{number}</span>
                  {index < steps.length - 1 && <div className="home-step-rule" />}
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="home-section home-pricing-section">
        <div className="home-container">
          <div className="home-section-heading text-center">
            <p className="home-eyebrow">Planos transparentes</p>
            <h2>
              Comece sem <span>complicar.</span>
            </h2>
            <p className="home-section-lede mx-auto">
              Teste tudo com calma. Quando fizer sentido para o seu negócio, escolha continuar.
            </p>
          </div>
          <div className="home-pricing-grid mt-12">
            <article className="home-price-card">
              <div className="home-price-card-top">
                <span className="home-price-label">Começo</span>
                <span className="home-price-free">R$ 0</span>
              </div>
              <p className="home-price-note">{trialText}, sem cartão de crédito.</p>
              <ul>
                {[
                  "Configure sua loja",
                  "Cadastre produtos e categorias",
                  "Conheça o painel de pedidos",
                ].map((item) => (
                  <li key={item}>
                    <Check size={17} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/cadastro" className="home-price-secondary">
                Iniciar teste grátis <ArrowRight size={16} />
              </a>
            </article>
            <article className="home-price-card home-price-card-featured">
              <div className="home-price-ribbon">Mais escolhido</div>
              <div className="home-price-card-top">
                <span className="home-price-label">Plano completo</span>
                <span className="home-price-value">
                  {price ?? "—"}
                  <small>/mês</small>
                </span>
              </div>
              <p className="home-price-note">
                {plan?.plan_name || "Tudo para vender melhor"} · sem fidelidade
              </p>
              <ul>
                {included.map((item) => (
                  <li key={item}>
                    <Check size={17} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/cadastro" className={`${cta} mt-8 w-full py-3.5`}>
                Quero começar <ArrowRight size={17} />
              </a>
            </article>
          </div>
        </div>
      </section>

      <section id="depoimentos" className="home-section home-testimonials-section">
        <div className="home-container">
          <div className="home-section-heading home-section-heading-split">
            <div>
              <p className="home-eyebrow">Na prática</p>
              <h2>
                Feito para quem
                <br />
                <span>faz acontecer.</span>
              </h2>
            </div>
            <p className="home-section-lede">
              Menos tempo organizando pedido. Mais tempo cuidando do cliente e da comida.
            </p>
          </div>
          <div className="home-testimonial-grid mt-12">
            {testimonials.map(({ quote, name: person, role }) => (
              <article key={person} className="home-testimonial-card">
                <div className="home-stars" aria-label="5 estrelas">
                  ★★★★★
                </div>
                <blockquote>“{quote}”</blockquote>
                <div className="home-testimonial-author">
                  <span>{person.charAt(0)}</span>
                  <div>
                    <strong>{person}</strong>
                    <small>{role}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-final-cta relative overflow-hidden">
        <div className="home-final-glow" />
        <div className="home-container relative flex flex-col items-start justify-between gap-8 py-20 sm:flex-row sm:items-center sm:py-24">
          <div>
            <p className="home-eyebrow">Seu próximo pedido começa aqui</p>
            <h2>
              Coloque seu negócio
              <br />
              <span>no controle.</span>
            </h2>
            <p>O teste é grátis e você pode começar em poucos minutos.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto">
            <a href="/cadastro" className={`${cta} px-7 py-4`}>
              Criar minha loja <ArrowRight size={18} />
            </a>
            {wa && (
              <a
                href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}`}
                target="_blank"
                rel="noreferrer"
                className="home-whatsapp-link"
              >
                <Users size={16} /> Falar com a gente
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-container flex flex-col gap-4 py-7 text-sm text-[#7d858e] sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ed252d]">
              <ChefHat size={15} />
            </span>
            {name}
          </Link>
          <p>
            © {new Date().getFullYear()} {name}. Cardápios digitais para negócios locais.
          </p>
          <a href="/painel" className="transition hover:text-white">
            Acessar painel <Zap size={14} className="ml-1 inline" />
          </a>
        </div>
      </footer>
    </main>
  );
}
