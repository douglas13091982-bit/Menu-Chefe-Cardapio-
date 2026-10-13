// Loja "pendente": dados digitados no cadastro, guardados até a conta ser confirmada e a loja criada.
const PENDING_KEY = "tratto_pending_store";

export type PendingStore = { name: string; slug: string; error?: string };

export const getPendingStore = (): PendingStore | null => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
  } catch {
    return null;
  }
};

export const setPendingStore = (value: PendingStore | null) => {
  try {
    value ? localStorage.setItem(PENDING_KEY, JSON.stringify(value)) : localStorage.removeItem(PENDING_KEY);
  } catch {}
};
