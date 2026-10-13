// @ts-nocheck
import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "../../context/StoreContext";

const ROLE = { owner: "Dono", admin: "Administrador", staff: "Colaborador" };
const input = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9273f]/30";

async function call(body) {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("Faça login novamente.");
  const { teamAction } = await import("@/lib/team.functions");
  try {
    return await teamAction({ data: body, headers: { Authorization: `Bearer ${token}` } });
  } catch (e) {
    throw new Error(e?.message || "Não foi possível concluir agora.");
  }
}

export default function TeamManager() {
  const { storeId } = useStore();
  const [members, setMembers] = useState([]);
  const [me, setMe] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "staff" });

  const load = async () => {
    try {
      const r = await call({ action: "list", storeId });
      setMembers(r.members);
      setMe(r.me);
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (storeId) load();
  }, [storeId]);

  const run = async (body, ok) => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await call({ storeId, ...body });
      setMsg(ok);
      await load();
      return true;
    } catch (e) {
      setErr(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const ok = await run({ action: "add", ...f }, "Acesso criado. Passe o e-mail e a senha para a pessoa entrar em /painel.");
    if (ok) setF({ name: "", email: "", password: "", role: "staff" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Equipe</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cadastre administradores (acesso total) e colaboradores (somente pedidos e pedido manual) para entrar no painel da loja.
        </p>
      </div>

      <form onSubmit={add} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><UserPlus size={18} /> Novo acesso</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} type="email" required placeholder="E-mail" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input className={input} type="text" placeholder="Senha (mín. 6 — só para quem ainda não tem conta)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="staff">Colaborador — pedidos e pedido manual</option>
            <option value="admin">Administrador — acesso total</option>
          </select>
        </div>
        <button disabled={busy} className="bg-[#d9273f] text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
          {busy ? "Salvando..." : "Adicionar"}
        </button>
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>

      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        {loading && <p className="p-4 text-sm text-gray-500">Carregando...</p>}
        {members.map((m) => (
          <div key={m.userId} className="p-4 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{m.name || m.email}{m.userId === me && <span className="ml-2 text-xs text-gray-400">(você)</span>}</p>
              {m.name && <p className="text-xs text-gray-500 truncate">{m.email}</p>}
            </div>
            {m.role === "owner" || m.userId === me ? (
              <span className="text-xs font-semibold rounded-full bg-gray-100 px-3 py-1">{ROLE[m.role] || m.role}</span>
            ) : (
              <>
                <select
                  disabled={busy}
                  value={m.role}
                  onChange={(e) => run({ action: "role", userId: m.userId, role: e.target.value }, "Perfil atualizado.")}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="staff">Colaborador</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  disabled={busy}
                  onClick={() => confirm(`Remover o acesso de ${m.email}?`) && run({ action: "remove", userId: m.userId }, "Acesso removido.")}
                  className="text-red-600 hover:bg-red-50 rounded-lg p-2"
                  aria-label="Remover acesso"
                >
                  <Trash2 size={17} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
