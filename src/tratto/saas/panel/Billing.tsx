// @ts-nocheck
import { moneyCents, fmtDate } from "../format";
import { whatsappUrl } from "../../format";
import { pixPayload } from "../../pix";
import PixQrCode from "../../components/PixQrCode";
import { Shell } from "./AuthScreens";

export function PayBox({ store, plan }) {
  if (!plan) return null;
  const cents = store.price_cents ?? plan.price_cents ?? 0;
  const payload = plan.pix_key ? pixPayload(plan.pix_key, plan.pix_holder, plan.pix_city, cents) : "";
  const waLink = whatsappUrl(plan.contact_whatsapp, "Olá! Já fiz o Pix da mensalidade da loja " + store.name + " (" + store.slug + ") no valor de " + moneyCents(cents) + ". Segue o comprovante.");
  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      <p className="font-semibold text-gray-900">Pagar mensalidade: {moneyCents(cents)}</p>
      {plan.pix_key ? (
        <div className="mt-3">
          <PixQrCode payload={payload} pixKey={plan.pix_key} holder={plan.pix_holder} />
        </div>
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
