// @ts-nocheck
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlatformSettings } from "../services/platform";
import LoginForm from "./LoginForm";
import { effectiveStatus, isServable } from "./format";
import { Shell, SignupForm, NewPassword, NoStore, createStore } from "./panel/AuthScreens";
import { Blocked } from "./panel/Billing";
import PanelShell from "./panel/PanelShell";
import { getPendingStore, setPendingStore } from "./panel/pendingStore";

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
      fetchPlatformSettings(),
    ]);
    setIsSuper(!!sup.data);
    setContact(plat?.contact_whatsapp || "");
    setPlan(plat);
    if (!mem.data?.length) {
      const pending = getPendingStore();
      if (pending?.name && pending?.slug) {
        const msg = await createStore(pending.name, pending.slug);
        if (!msg) {
          setPendingStore( null);
          return refresh();
        }
        setPendingStore( { ...pending, error: msg });
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
