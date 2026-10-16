// @ts-nocheck
import { useState } from "react";
import PasswordInput from "../../components/PasswordInput";
import { errorPt } from "@/lib/errors-pt";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "../brand";
import { slugify } from "../format";
import { getPendingStore, setPendingStore } from "./pendingStore";

const cls = "auth-input";

export function Shell({ children }) {
  return (
    <div className="auth-shell min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="/" className="auth-brand block text-center text-2xl font-extrabold mb-6">
          {BRAND}
        </a>
        <div className="auth-card rounded-2xl p-6">{children}</div>
      </div>
    </div>
  );
}


export async function createStore(name, slug) {
  const { error } = await supabase.rpc("create_store", { _name: name, _slug: slug });
  return error ? errorPt(error) : null;
}

function StoreFields({ name, setName, slug, setSlug, touched, setTouched }) {
  return (
    <>
      <label className="auth-label block text-sm font-medium">
        Nome da loja
        <input
          className={cls}
          required
          value={name}
          placeholder="Ex.: Burger do João"
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
        />
      </label>
      <label className="auth-label block text-sm font-medium">
        Endereço do cardápio
        <div className="auth-slug-wrap flex items-center rounded-lg overflow-hidden text-sm">
          <span className="auth-slug-prefix px-2 py-2.5 whitespace-nowrap">/</span>
          <input
            className="flex-1 px-2 py-2.5 outline-none min-w-0"
            required
            value={slug}
            onChange={(e) => {
              setTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="burger-do-joao"
          />
        </div>
      </label>
    </>
  );
}

export function SignupForm({ onCreated, onSwitch }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) return setError("A senha precisa ter ao menos 6 caracteres.");
    if (slug.length < 3) return setError("O endereço precisa ter ao menos 3 caracteres.");
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin + "/painel" },
    });
    if (err) {
      setLoading(false);
      return setError(
        errorPt(err) === "Este e-mail já tem cadastro."
          ? 'Este e-mail já tem conta. Use "Entrar".'
          : "Não foi possível criar a conta: " + errorPt(err),
      );
    }
    if (data.session) {
      const msg = await createStore(name.trim(), slug);
      setLoading(false);
      if (msg) setPendingStore( { name: name.trim(), slug, error: msg });
      return onCreated();
    }
    setPendingStore( { name: name.trim(), slug });
    setLoading(false);
    setInfo(
      "Enviamos um e-mail de confirmação. Depois de confirmar, volte aqui e entre para concluir a criação da sua loja.",
    );
  };

  return (
    <form onSubmit={submit} className="auth-form space-y-3">
      <h1 className="auth-title text-xl font-bold">Criar minha loja</h1>
      <p className="auth-subtitle text-sm -mt-1">Teste grátis, sem cartão de crédito.</p>
      <StoreFields {...{ name, setName, slug, setSlug, touched, setTouched }} />
      <label className="auth-label block text-sm font-medium">
        Seu e-mail
        <input
          type="email"
          required
          className={cls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="auth-label block text-sm font-medium">
        Senha
        <PasswordInput
          required
          minLength={6}
          autoComplete="new-password"
          className={cls}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="auth-error text-sm">{error}</p>}
      {info && <p className="auth-success text-sm">{info}</p>}
      <button
        disabled={loading}
        className="auth-primary w-full disabled:opacity-60 font-semibold rounded-lg py-2.5 text-sm"
      >
        {loading ? "Criando…" : "Criar loja e começar o teste"}
      </button>
      <button type="button" onClick={onSwitch} className="auth-link w-full text-sm underline">
        Já tenho conta
      </button>
    </form>
  );
}

export function NewPassword({ onDone }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (err) return setError("Não foi possível salvar a nova senha: " + errorPt(err));
    onDone();
  };
  return (
    <form onSubmit={submit} className="auth-form space-y-3">
      <h1 className="auth-title text-xl font-bold">Definir nova senha</h1>
      <label className="auth-label block text-sm font-medium">
        Nova senha
        <PasswordInput required minLength={6} autoComplete="new-password" className={cls} value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      {error && <p className="auth-error text-sm">{error}</p>}
      <button disabled={loading} className="auth-primary w-full disabled:opacity-60 font-semibold rounded-lg py-2.5 text-sm">
        {loading ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}

export function NoStore({ onCreated, onLogout }) {
  const pending = getPendingStore() || {};
  const [name, setName] = useState(pending.name || "");
  const [slug, setSlug] = useState(pending.slug || "");
  const [touched, setTouched] = useState(!!pending.slug);
  const [error, setError] = useState(pending.error || "");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const msg = await createStore(name.trim(), slug);
    setLoading(false);
    if (msg) return setError(msg);
    setPendingStore( null);
    onCreated();
  };
  return (
    <form onSubmit={submit} className="auth-form space-y-3">
      <h1 className="auth-title text-xl font-bold">Falta pouco!</h1>
      <p className="auth-subtitle text-sm -mt-1">Dê um nome e um endereço para o seu cardápio.</p>
      <StoreFields {...{ name, setName, slug, setSlug, touched, setTouched }} />
      {error && <p className="auth-error text-sm">{error}</p>}
      <button
        disabled={loading}
        className="w-full bg-[#d9273f] text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60"
      >
        {loading ? "Criando…" : "Criar loja"}
      </button>
      <button type="button" onClick={onLogout} className="w-full text-xs text-gray-500 underline">
        Sair
      </button>
    </form>
  );
}

