// @ts-nocheck
import { useState } from "react";
import { StoreProvider } from "../../context/StoreContext";
import AdminPanel from "../../components/admin/AdminPanel";
import { daysLeft, fmtDate } from "../format";
import { PayBox } from "./Billing";

export function PanelShell({ store, status, isSuper, contact, plan, onLogout }) {
  const [copied, setCopied] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const publicSlug = store.slug === 'teste' ? 'ferreira-sourdough' : store.slug;
  const link = `${window.location.origin}/${publicSlug}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
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
            href={`/${publicSlug}`}
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
          // Aviso no topo do painel a partir de 1 dia antes do vencimento (teste ou assinatura)
          const end = status === "trial" ? store.trial_ends_at : status === "active" ? store.paid_until : null;
          if (!end) return null;
          // diferença em dias de calendário (Brasília): véspera do vencimento já mostra o aviso
          const dia = (d) => Date.parse(new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
          const diff = Math.round((dia(end) - dia(new Date())) / 86400000);
          if (diff > 1) return null;
          const hoje = diff <= 0;
          return (
            <div role="alert" className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <span className="font-medium">
                ⚠️ {status === "trial" ? "Seu teste termina" : "Sua assinatura vence"} {hoje ? "hoje" : "amanhã"} ({fmtDate(end)}).
                {" "}Pague para o cardápio não sair do ar.
              </span>
              <button
                type="button"
                onClick={() => setPayOpen(true)}
                className="rounded-lg bg-[#d9273f] px-4 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-[#b81f33] whitespace-nowrap"
              >
                Pagar agora
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
