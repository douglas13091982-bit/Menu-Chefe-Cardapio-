// Utilitários compartilhados do domínio Tratto.

/** Formata um valor monetário em Real brasileiro: `R$ 12,50`. */
export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/** Gera um número de pedido humano e legível no cardápio: `#1000`–`#9999`. */
export function generateOrderNumber(): string {
  return "#" + Math.floor(1000 + Math.random() * 9000);
}

/**
 * Gera um id único e monotônico para entidades criadas no painel.
 * Combina timestamp + contador + aleatoriedade para evitar colisões
 * quando duas entidades são criadas no mesmo milissegundo
 * (falha conhecida do padrão `Date.now().toString()`).
 */
let idCounter = 0;
export function generateId(prefix = ""): string {
  idCounter = (idCounter + 1) % 1e6;
  const random = Math.floor(Math.random() * 1e6)
    .toString(36)
    .padStart(4, "0");
  return `${prefix}${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`;
}

// ── Autenticação do painel administrativo ────────────────────────────────────
export const ADMIN_PASSWORD_KEY = "admin_password";
export const ADMIN_AUTH_KEY = "admin_auth";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

/** Lê a senha configurada diretamente do storage (nunca fica em memória). */
export function readStoredAdminPassword(): string {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

/**
 * Valida a senha informada com bloqueio progressivo contra força bruta.
 * Após 5 tentativas erradas seguidas, exige espera crescente entre as tentativas.
 * Retorna `true` em caso de sucesso; lança Error com a mensagem de bloqueio.
 */
export function verifyAdminPassword(input: string): boolean {
  const LOCK_KEY = "admin_lock";
  const MAX_ATTEMPTS = 5;
  let lock: { fails: number; until: number } = { fails: 0, until: 0 };
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        const p = parsed as Record<string, unknown>;
        lock = {
          fails: typeof p["fails"] === "number" ? p["fails"] : 0,
          until: typeof p["until"] === "number" ? p["until"] : 0,
        };
      }
    }
  } catch {
    /* estado corrompido: recomeça sem bloqueio */
  }

  const now = Date.now();
  if (lock.fails >= MAX_ATTEMPTS) {
    if (now < lock.until) {
      const secs = Math.ceil((lock.until - now) / 1000);
      throw new Error(`Muitas tentativas incorretas. Aguarde ${secs}s antes de tentar novamente.`);
    }
    lock = { fails: 0, until: 0 };
  }

  if (input && input === readStoredAdminPassword()) {
    try {
      sessionStorage.removeItem(LOCK_KEY);
    } catch {
      /* ignore */
    }
    return true;
  }

  lock.fails += 1;
  if (lock.fails >= MAX_ATTEMPTS) {
    // Bloqueio progressivo: 15s, 30s, 60s... limitado a 5 minutos.
    const extra = lock.fails - MAX_ATTEMPTS;
    const waitMs = Math.min(15000 * Math.pow(2, extra), 300000);
    lock.until = now + waitMs;
    throw new Error(
      `Senha incorreta. Muitas tentativas — aguardue ${Math.ceil(waitMs / 1000)}s antes da próxima.`,
    );
  }
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  } catch {
    /* ignore */
  }
  throw new Error("Senha incorreta. Tente novamente.");
}

/** Sessão pode estar em sessionStorage (aba atual) ou localStorage ("manter conectado"). */
export function readAuthSession(): boolean {
  try {
    return (
      sessionStorage.getItem(ADMIN_AUTH_KEY) === "true" ||
      localStorage.getItem(ADMIN_AUTH_KEY) === "true"
    );
  } catch {
    return false;
  }
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB — limite exibido na UI de uploads

/**
 * Lê uma imagem selecionada pelo usuário como data URL, validando tipo e
 * tamanho antes de aceitar. Retorna `{ ok: true, dataUrl }` ou
 * `{ ok: false, error }` com mensagem amigável em pt-BR.
 *
 * Centraliza a validação usada nos uploads de logo (Configurações) e de foto
 * de produto, evitando duplicação e uploads silenciosamente inválidos que
 * estourariam a cota do localStorage.
 */
export async function readImageFileAsDataUrl(
  file: File | undefined | null,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: "Nenhum arquivo selecionado." };
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Por favor, selecione um arquivo de imagem (PNG, JPG...)." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Imagem muito grande. O limite é 5MB." };
  }
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo."));
      reader.readAsDataURL(file);
    });
    // Data URLs ocupam ~4/3 do tamanho original; revalida após a conversão.
    if (dataUrl.length > MAX_UPLOAD_BYTES * 1.4) {
      return { ok: false, error: "Imagem muito grande após conversão. Escolha uma imagem menor." };
    }
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: "Não foi possível ler a imagem. Tente novamente." };
  }
}
