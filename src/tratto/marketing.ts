// Configurações de marketing (localStorage, chave store_marketing)
export interface MarketingConfig {
  pixelId: string;
  accessToken: string;
}

export const MARKETING_KEY = "store_marketing";

/**
 * Lê as configurações de marketing.
 * O token da API de Conversões é um segredo de SERVIDOR e por isso nunca é
 * exposto na interface pública: apenas o Pixel ID pode ser lido aqui.
 */
export function loadMarketing(): Pick<MarketingConfig, "pixelId"> {
  try {
    const stored = localStorage.getItem(MARKETING_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        const pixelId = (parsed as Record<string, unknown>)["pixelId"];
        return { pixelId: typeof pixelId === "string" ? pixelId : String(pixelId ?? "") };
      }
    }
  } catch {
    /* JSON corrompido: segue sem configuração */
  }
  return { pixelId: "" };
}

export function saveMarketing(data: MarketingConfig) {
  try {
    localStorage.setItem(MARKETING_KEY, JSON.stringify(data));
  } catch {
    throw new Error("Não foi possível salvar (armazenamento indisponível).");
  }
}

let loadedPixelId: string | null = null;

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: unknown;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

// Carrega o Meta Pixel (fbq) e dispara PageView. Não faz nada se não houver Pixel ID.
export function trackMenuPageView() {
  const { pixelId } = loadMarketing();
  if (!/^\d+$/.test(pixelId)) return;
  const w = window;
  if (!w.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    } as FbqFn;
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  if (loadedPixelId !== pixelId) {
    w.fbq("init", pixelId);
    loadedPixelId = pixelId;
  }
  w.fbq("track", "PageView");
}
