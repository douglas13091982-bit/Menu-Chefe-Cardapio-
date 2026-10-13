// @ts-nocheck
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoreProvider } from "../context/StoreContext";
import AdminPanel from "../components/admin/AdminPanel";
import LoginForm from "./LoginForm";
import { BRAND } from "./brand";
import { pixPayload } from "./pix";
import { moneyCents, slugify, effectiveStatus, daysLeft, fmtDate, isServable } from "./format";

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
const cls = "auth-input";

function Shell({ children }) {
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

async function createStore(name, slug) {
  const { error } = await supabase.rpc("create_store", { _name: name, _slug: slug });
  return error ? error.message : null;
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
      if (msg) lsSet(PENDING_KEY, { name: name.trim(), slug, error: msg });
      return onCreated();
    }
    lsSet(PENDING_KEY, { name: name.trim(), slug });
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
        <input
          type="password"
          required
          minLength={6}
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

function NewPassword({ onDone }) {
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
    if (err) return setError("Não foi possível salvar a nova senha: " + err.message);
    onDone();
  };
  return (
    <form onSubmit={submit} className="auth-form space-y-3">
      <h1 className="auth-title text-xl font-bold">Definir nova senha</h1>
      <label className="auth-label block text-sm font-medium">
        Nova senha
        <input type="password" required minLength={6} autoComplete="new-password" className={cls} value={pw} onChange={(e) => setPw(e.target.value)} />
      </label>
      {error && <p className="auth-error text-sm">{error}</p>}
      <button disabled={loading} className="auth-primary w-full disabled:opacity-60 font-semibold rounded-lg py-2.5 text-sm">
        {loading ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}

function NoStore({ onCreated, onLogout }) {
  const pending = lsGet(PENDING_KEY) || {};
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
    lsSet(PENDING_KEY, null);
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

function PayBox({ store, plan }) {
  const [copied, setCopied] = useState("");
  const [qr, setQr] = useState("");
  const cents = store.price_cents ?? plan?.price_cents ?? 0;
  const code = plan?.pix_key ? pixPayload(plan.pix_key, plan.pix_holder, plan.pix_city, cents) : "";
  useEffect(() => {
    if (!code) { setQr(""); return; }
    let alive = true;
    import("qrcode")
      .then((m) => (m.default || m).toDataURL(code, { margin: 1, width: 320, errorCorrectionLevel: "M" }))
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(""));
    return () => { alive = false; };
  }, [code]);
  if (!plan) return null;
  const wa = String(plan.contact_whatsapp || "").replace(/\D/g, "");
  const copy = async (txt, k) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(k);
      setTimeout(() => setCopied(""), 1800);
    } catch {}
  };
  const waLink = wa
    ? `https://wa.me/${wa.startsWith("55") ? wa : "55" + wa}?text=${encodeURIComponent("Olá! Já fiz o Pix da mensalidade da loja " + store.name + " (" + store.slug + ") no valor de " + moneyCents(cents) + ". Segue o comprovante.")}`
    : "";
  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      <p className="font-semibold text-gray-900">Pagar mensalidade: {moneyCents(cents)}</p>
      {plan.pix_key ? (
        <>
          {qr && (
            <div className="flex flex-col items-center mt-3">
              <img src={qr} alt="QR Code Pix" className="w-48 h-48 rounded-lg border bg-white p-1" />
              <p className="text-xs text-gray-500 mt-1">Aponte a câmera do app do seu banco</p>
            </div>
          )}
          <p className="text-gray-600 mt-3">Chave Pix{plan.pix_holder ? ` (${plan.pix_holder})` : ""}:</p>
          <p className="font-mono break-all bg-white border rounded-lg px-3 py-2 mt-1">{plan.pix_key}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={() => copy(plan.pix_key, "key")} className="rounded-lg border border-gray-300 py-2 font-semibold">
              {copied === "key" ? "Copiado!" : "Copiar chave"}
            </button>
            <button type="button" onClick={() => copy(code, "code")} className="rounded-lg bg-[#d9273f] text-white py-2 font-semibold">
              {copied === "code" ? "Copiado!" : "Pix copia e cola"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">O "copia e cola" já leva o valor. Cole na opção Pix do app do seu banco.</p>
        </>
      ) : (
        <p className="text-gray-600 mt-1">Fale com a gente para receber os dados de pagamento.</p>
      )}
      {waLink && (
        <a href={waLink} target="_blank" rel="noreferrer" className="block text-center mt-3 bg-green-600 text-white font-semibold rounded-lg py-2.5">
          Já paguei, avisar no WhatsApp
        </a>
      )}
    </div>
  );
}

function Blocked({ store, status, contact, plan, onLogout }) {
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
      <h1 className="auth-title text-xl font-bold">{store.name}</h1>
      <p className="text-sm text-gray-600 mt-2">
        {msg} O cardápio está fora do ar para os clientes até a regularização. Seus produtos e
        pedidos continuam guardados.
      </p>
      <PayBox store={store} plan={plan} />
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

function PanelShell({ store, status, isSuper, contact, plan, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
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
          {(status === "trial" || status === "active") && (
            <button
              onClick={() => setPayOpen(!payOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-[#d9273f] text-white font-semibold whitespace-nowrap"
            >
              {status === "trial" ? "Assinar" : "Renovar"}
            </button>
          )}
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
        {(() => {
          const end = status === "trial" ? store.trial_ends_at : status === "active" ? store.paid_until : null;
          if (!end || daysLeft(end) > 3) return null;
          const d = Math.max(0, daysLeft(end));
          return (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 text-center">
              {status === "trial" ? "Seu teste termina" : "Sua assinatura vence"} em {d} dia(s).{" "}
              <button type="button" className="underline font-semibold" onClick={() => setPayOpen(true)}>
                {status === "trial" ? "Assinar agora" : "Renovar agora"}
              </button>
            </div>
          );
        })()}
        {payOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setPayOpen(false)}>
            <div role="dialog" aria-modal="true" className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="Fechar" className="absolute right-3 top-3 text-2xl leading-none text-gray-400 hover:text-gray-700" onClick={() => setPayOpen(false)}>×</button>
              <h2 className="text-lg font-bold text-gray-900 pr-6">{status === "trial" ? "Assinar" : "Renovar assinatura"} — {store.name}</h2>
              {status === "trial" ? (
                <p className="text-xs text-gray-500 mt-1">A mensalidade começa quando o teste terminar, você não perde os dias restantes.</p>
              ) : store.paid_until ? (
                <p className="text-xs text-gray-500 mt-1">Vence em {fmtDate(store.paid_until)}. Cada mês pago é somado ao vencimento atual.</p>
              ) : null}
              <PayBox store={store} plan={plan} />
              <p className="text-xs text-gray-500 mt-3">Após o pagamento, envie o comprovante pelo WhatsApp. Assim que for conferido, sua assinatura é atualizada.</p>
            </div>
          </div>
        )}
        <AdminPanel />
      </div>
    </StoreProvider>
  );
}

export default function PanelApp() {
  const [phase, setPhase] = useState("loading");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [store, setStore] = useState(null);
  const [isSuper, setIsSuper] = useState(false);
  const [contact, setContact] = useState("");
  const [plan, setPlan] = useState(null);
  const [mode, setMode] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("cadastro")
      ? "signup"
      : "login",
  );

  const refresh = useCallback(async () => {
    if (phaseRef.current === "recovery") return;
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
      supabase.from("platform_settings").select("contact_whatsapp, price_cents, pix_key, pix_holder, pix_city").eq("id", "main").maybeSingle(),
    ]);
    setIsSuper(!!sup.data);
    setContact(plat.data?.contact_whatsapp || "");
    setPlan(plat.data || null);
    if (!mem.data?.length) {
      const pending = lsGet(PENDING_KEY);
      if (pending?.name && pending?.slug) {
        const msg = await createStore(pending.name, pending.slug);
        if (!msg) {
          lsSet(PENDING_KEY, null);
          return refresh();
        }
        lsSet(PENDING_KEY, { ...pending, error: msg });
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
      if (ev === "PASSWORD_RECOVERY") setPhase("recovery");
      else if ((ev === "SIGNED_IN" || ev === "SIGNED_OUT") && phaseRef.current !== "recovery") refresh();
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
  if (phase === "recovery")
    return (
      <Shell>
        <NewPassword onDone={() => { phaseRef.current = "loading"; setPhase("loading"); refresh(); }} />
      </Shell>
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
              className="auth-link w-full text-sm font-semibold mt-3"
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
    return <Blocked store={store} status={status} contact={contact} plan={plan} onLogout={logout} />;
  return (
    <PanelShell
      store={store}
      status={status}
      isSuper={isSuper}
      contact={contact}
      plan={plan}
      onLogout={logout}
    />
  );
}
