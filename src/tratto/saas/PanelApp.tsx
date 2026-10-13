// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreProvider } from "../context/StoreContext";
import AdminPanel from "../components/admin/AdminPanel";
import LoginForm from "./LoginForm";
import { BRAND } from "./brand";
import { slugify, effectiveStatus, daysLeft, fmtDate, isServable } from "./format";

const PENDING_KEY = "tratto_pending_store";
const lsGet = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k);
  } catch {}
};
const cls =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9273f]/30";

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7f5] to-[#f6e9e4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="/" className="block text-center text-2xl font-extrabold text-[#782d25] mb-6">
          {BRAND}
        </a>
        <div className="bg-white rounded-2xl shadow-xl p-6">{children}</div>
      </div>
    </div>
  );
}

async function createStore(name, slug) {
  const { error } = await supabase.rpc("create_store", { _name: name, _slug: slug });
  return error ? error.message : null;
}

function StoreFields({ name, setName, slug, setSlug, touched, setTouched }) {
  return (
    <>
      <label className="block text-sm font-medium text-gray-700">
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
      <label className="block text-sm font-medium text-gray-700">
        Endereço do cardápio
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden text-sm">
          <span className="px-2 text-gray-400 bg-gray-50 py-2.5 whitespace-nowrap">/</span>
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

function SignupForm({ onCreated, onSwitch }) {
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
        err.message.includes("registered")
          ? 'Este e-mail já tem conta. Use "Entrar".'
          : "Não foi possível criar a conta: " + err.message,
      );
    }
    if (data.session) {
      const msg = await createStore(name.trim(), slug);
      setLoading(false);
      if (msg) {
        lsSet(PENDING_KEY, { name: name.trim(), slug });
        return onCreated();
      }
      return onCreated();
    }
    lsSet(PENDING_KEY, { name: name.trim(), slug });
    setLoading(false);
    setInfo(
      "Enviamos um e-mail de confirmação. Depois de confirmar, volte aqui e entre para concluir a criação da sua loja.",
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h1 className="text-xl font-bold text-gray-900">Criar minha loja</h1>
      <p className="text-sm text-gray-500 -mt-1">Teste grátis, sem cartão de crédito.</p>
      <StoreFields {...{ name, setName, slug, setSlug, touched, setTouched }} />
      <label className="block text-sm font-medium text-gray-700">
        Seu e-mail
        <input
          type="email"
          required
          className={cls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Senha
        <input
          type="password"
          required
          minLength={6}
          className={cls}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}
      <button
        disabled={loading}
        className="w-full bg-[#d9273f] hover:bg-[#c01f35] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm"
      >
        {loading ? "Criando…" : "Criar loja e começar o teste"}
      </button>
      <button type="button" onClick={onSwitch} className="w-full text-sm text-gray-600 underline">
        Já tenho conta
      </button>
    </form>
  );
}

function NoStore({ onCreated, onLogout }) {
  const pending = lsGet(PENDING_KEY) || {};
  const [name, setName] = useState(pending.name || "");
  const [slug, setSlug] = useState(pending.slug || "");
  const [touched, setTouched] = useState(!!pending.slug);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const msg = await createStore(name.trim(), slug);
    setLoading(false);
    if (msg) return setError(msg);
    lsSet(PENDING_KEY, null);
    onCreated();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <h1 className="text-xl font-bold text-gray-900">Falta pouco!</h1>
      <p className="text-sm text-gray-500 -mt-1">Dê um nome e um endereço para o seu cardápio.</p>
      <StoreFields {...{ name, setName, slug, setSlug, touched, setTouched }} />
      {error && <p className="text-sm text-red-600">{error}</p>}
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

function Blocked({ store, status, contact, onLogout }) {
  const msg =
    {
      trial_expired: "Seu período de teste terminou.",
      overdue: "A assinatura da sua loja venceu.",
      suspended: "O acesso da sua loja está suspenso.",
      cancelled: "A assinatura desta loja foi cancelada.",
    }[status] || "O acesso da sua loja está indisponível.";
  const wa = String(contact || "").replace(/\D/g, "");
  return (
    <Shell>
      <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
      <p className="text-sm text-gray-600 mt-2">
        {msg} O cardápio está fora do ar para os clientes até a regularização. Seus produtos e
        pedidos continuam guardados.
      </p>
      {wa && (
        <a
          href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}?text=${encodeURIComponent("Olá! Quero regularizar a assinatura da loja " + store.name + " (" + store.slug + ").")}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center mt-5 bg-green-600 text-white font-semibold rounded-lg py-2.5 text-sm"
        >
          Falar no WhatsApp para regularizar
        </a>
      )}
      <button onClick={onLogout} className="w-full text-xs text-gray-500 underline mt-4">
        Sair
      </button>
    </Shell>
  );
}

function PanelShell({ store, status, isSuper, contact, onLogout }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/${store.slug}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const wa = String(contact || "").replace(/\D/g, "");
  return (
    <StoreProvider storeId={store.id} isAdmin>
      <header className="admin-topbar fixed top-0 inset-x-0 h-12 z-50 bg-white border-b border-[#f4d6db] flex items-center justify-between px-3 sm:px-5">
        <div className="admin-topbar-brand flex items-center gap-2 min-w-0">
          <span className="admin-topbar-store font-bold text-[#782d25] truncate">{store.name}</span>
          {status === "trial" && (
            <span className="text-[11px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 whitespace-nowrap">
              Teste: {Math.max(0, daysLeft(store.trial_ends_at))} dia(s)
            </span>
          )}
          {status === "active" && store.paid_until && (
            <span className="hidden sm:inline text-[11px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 whitespace-nowrap">
              Ativa até {fmtDate(store.paid_until)}
            </span>
          )}
        </div>
        <div className="admin-topbar-actions flex items-center gap-1.5 text-xs">
          <a
            href={`/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 whitespace-nowrap"
          >
            Ver cardápio
          </a>
          <button
            onClick={copy}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 whitespace-nowrap"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          {isSuper && (
            <a
              href="/super"
              className="hidden sm:inline px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Super admin
            </a>
          )}
          <button
            onClick={onLogout}
            className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600"
          >
            Sair
          </button>
        </div>
      </header>
      <div className="pt-16">
        {status === "trial" && daysLeft(store.trial_ends_at) <= 3 && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 text-center">
            Seu teste termina em {Math.max(0, daysLeft(store.trial_ends_at))} dia(s).{" "}
            {wa && (
              <a
                className="underline font-semibold"
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}?text=${encodeURIComponent("Olá! Quero assinar para a loja " + store.name + " (" + store.slug + ").")}`}
              >
                Assinar agora
              </a>
            )}
          </div>
        )}
        <AdminPanel />
      </div>
    </StoreProvider>
  );
}

export default function PanelApp() {
  const [phase, setPhase] = useState("loading");
  const [store, setStore] = useState(null);
  const [isSuper, setIsSuper] = useState(false);
  const [contact, setContact] = useState("");
  const [mode, setMode] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("cadastro")
      ? "signup"
      : "login",
  );

  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setStore(null);
      setIsSuper(false);
      setPhase("auth");
      return;
    }
    const [sup, mem, plat] = await Promise.all([
      supabase.rpc("is_super_admin"),
      supabase.from("store_members").select("store_id").eq("user_id", session.user.id).limit(1),
      supabase.from("platform_settings").select("contact_whatsapp").eq("id", "main").maybeSingle(),
    ]);
    setIsSuper(!!sup.data);
    setContact(plat.data?.contact_whatsapp || "");
    if (!mem.data?.length) {
      const pending = lsGet(PENDING_KEY);
      if (pending?.name && pending?.slug) {
        const msg = await createStore(pending.name, pending.slug);
        if (!msg) {
          lsSet(PENDING_KEY, null);
          return refresh();
        }
      }
      setStore(null);
      setPhase("nostore");
      return;
    }
    const { data: st } = await supabase
      .from("stores")
      .select("*")
      .eq("id", mem.data[0].store_id)
      .maybeSingle();
    setStore(st);
    setPhase(st ? "ready" : "nostore");
  }, []);

  useEffect(() => {
    refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setPhase("auth");
  };

  if (phase === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Carregando…
      </div>
    );
  if (phase === "auth") {
    return (
      <Shell>
        {mode === "signup" ? (
          <SignupForm onCreated={refresh} onSwitch={() => setMode("login")} />
        ) : (
          <>
            <LoginForm title="Entrar no painel" subtitle="Acesse a sua loja" onDone={refresh} />
            <button
              onClick={() => setMode("signup")}
              className="w-full text-sm text-[#d9273f] font-semibold mt-3"
            >
              Criar minha loja grátis
            </button>
          </>
        )}
      </Shell>
    );
  }
  if (phase === "nostore")
    return (
      <Shell>
        <NoStore onCreated={refresh} onLogout={logout} />
      </Shell>
    );

  const status = effectiveStatus(store);
  if (!isServable(status) && !isSuper)
    return <Blocked store={store} status={status} contact={contact} onLogout={logout} />;
  return (
    <PanelShell
      store={store}
      status={status}
      isSuper={isSuper}
      contact={contact}
      onLogout={logout}
    />
  );
}
