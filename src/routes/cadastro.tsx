import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChefHat, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar loja | Tratto Digital Menu" },
      { name: "description", content: "Crie sua conta e inicie o teste grátis do Tratto Digital Menu." },
    ],
  }),
  component: SignupPage,
});

function makeSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function SignupPage() {
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const suggestedSlug = useMemo(() => makeSlug(storeName), [storeName]);
  const finalSlug = slugTouched ? makeSlug(slug) : suggestedSlug;
  const validSlug = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(finalSlug) && finalSlug.length >= 3;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (storeName.trim().length < 2) return setError("Informe o nome da sua loja.");
    if (!validSlug) return setError("Escolha um endereço com pelo menos 3 caracteres, usando letras, números e hífen.");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");

    setLoading(true);
    try {
      // Evita criar uma conta órfã caso a migração SaaS ainda não esteja no Supabase.
      const { data: trialPlan, error: planError } = await supabase
        .from("saas_plans")
        .select("id")
        .eq("id", "trial")
        .eq("active", true)
        .maybeSingle();

      if (planError || !trialPlan) {
        setError("O cadastro de novas lojas ainda não foi ativado no sistema. Tente novamente mais tarde.");
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { store_name: storeName.trim(), store_slug: finalSlug },
        },
      });
      if (signupError) {
        const message = signupError.message.toLowerCase();
        if (message.includes("duplicate key") || message.includes("already registered")) {
          setError("Este e-mail já possui cadastro. Tente entrar ou use outro e-mail.");
        } else if (message.includes("invalid") && message.includes("slug")) {
          setError("Esse endereço não está disponível. Escolha outro.");
        } else {
          setError(signupError.message || "Não foi possível criar sua conta.");
        }
        return;
      }
      setSuccess(true);
    } catch {
      setError("Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> Voltar ao site</Link>
        <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white"><ChefHat size={23} /></span>
            <span className="text-xl font-bold tracking-tight">tratto<span className="text-red-600">.</span></span>
          </Link>

          {success ? (
            <div className="py-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
              <h1 className="mt-5 text-2xl font-bold">Cadastro recebido!</h1>
              <p className="mt-3 leading-7 text-slate-600">Se a confirmação de e-mail estiver ativada, confira sua caixa de entrada. Seu cadastro e período de teste foram solicitados; a publicação do cardápio de novas lojas será concluída após a ativação do painel multi-loja.</p>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p><strong className="text-slate-900">Loja:</strong> {storeName}</p>
                <p className="mt-1"><strong className="text-slate-900">Endereço reservado:</strong> /{finalSlug}</p>
                <p className="mt-3 text-xs">Guarde seu e-mail e senha. Não compartilhe sua senha com ninguém.</p>
              </div>
              <Link to="/" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">Voltar ao início</Link>
            </div>
          ) : (
            <>
              <div className="mt-7">
                <p className="text-sm font-semibold text-red-600">TESTE GRÁTIS POR 7 DIAS</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">Crie sua loja digital</h1>
                <p className="mt-3 leading-7 text-slate-600">Preencha os dados para criar sua conta e iniciar o cadastro da loja.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="storeName" className="mb-2 block text-sm font-semibold">Nome do restaurante ou lanchonete</label>
                  <input id="storeName" value={storeName} onChange={e => { setStoreName(e.target.value); if (!slugTouched) setSlug(makeSlug(e.target.value)); }} required maxLength={120} autoComplete="organization" placeholder="Ex.: Hamburgueria do Centro" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10" />
                </div>
                <div>
                  <label htmlFor="slug" className="mb-2 block text-sm font-semibold">Endereço da sua loja</label>
                  <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10">
                    <span className="shrink-0 pl-3 text-sm text-slate-400">/</span>
                    <input id="slug" value={slugTouched ? slug : suggestedSlug} onChange={e => { setSlugTouched(true); setSlug(e.target.value); }} required maxLength={60} autoComplete="off" placeholder="sua-loja" className="min-w-0 flex-1 rounded-xl px-2 py-3 outline-none" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Use letras minúsculas, números e hífens. Exemplo: /hamburgueria-do-centro</p>
                  {!validSlug && finalSlug.length > 0 && <p className="mt-1 text-xs text-amber-700">O endereço precisa ter pelo menos 3 caracteres válidos.</p>}
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="voce@exemplo.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10" />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold">Crie uma senha</label>
                  <div className="flex rounded-xl border border-slate-200 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10">
                    <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Pelo menos 8 caracteres" className="min-w-0 flex-1 rounded-xl px-4 py-3 outline-none" />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="px-4 text-slate-500 hover:text-slate-900">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={loading || !validSlug} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <LoaderCircle size={18} className="animate-spin" />} {loading ? "Criando cadastro..." : "Criar conta e iniciar teste"}
                </button>
                <p className="text-center text-xs leading-5 text-slate-500">Ao continuar, você concorda em usar a plataforma de acordo com seus termos de serviço.</p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
