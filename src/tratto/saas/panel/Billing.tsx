// @ts-nocheck
import { useEffect, useState } from "react";
import { moneyCents, fmtDate } from "../format";
import { whatsappUrl } from "../../format";
import { pixPayload } from "../pix";
import { Shell } from "./AuthScreens";

export function PayBox({ store, plan }) {
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
  const copy = async (txt, k) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(k);
      setTimeout(() => setCopied(""), 1800);
    } catch {}
  };
  const waLink = whatsappUrl(plan.contact_whatsapp, "Olá! Já fiz o Pix da mensalidade da loja " + store.name + " (" + store.slug + ") no valor de " + moneyCents(cents) + ". Segue o comprovante.");
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

export function Blocked({ store, status, contact, plan, onLogout }) {
  const msg =
    {
      trial_expired: "Seu período de teste terminou.",
      overdue: "A assinatura da sua loja venceu.",
      suspended: "O acesso da sua loja está suspenso.",
      cancelled: "A assinatura desta loja foi cancelada.",
    }[status] || "O acesso da sua loja está indisponível.";
  const waLink = whatsappUrl(contact, "Olá! Quero regularizar a assinatura da loja " + store.name + " (" + store.slug + ").");
  return (
    <Shell>
      <h1 className="auth-title text-xl font-bold">{store.name}</h1>
      <p className="text-sm text-gray-600 mt-2">
        {msg} O cardápio está fora do ar para os clientes até a regularização. Seus produtos e
        pedidos continuam guardados.
      </p>
      <PayBox store={store} plan={plan} />
      {waLink && (
        <a
          href={waLink}
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
