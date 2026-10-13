export const MAPBOX_TOKEN_KEY = "store_mapbox_token";
export const MAPBOX_TOKEN_EVENT = "store-mapbox-token-changed";

// Prioridade: token salvo no painel > VITE_MAPBOX_TOKEN > vazio
export function getMapboxToken(): string {
  try {
    const saved = localStorage.getItem(MAPBOX_TOKEN_KEY);
    if (saved) return saved;
  } catch {
    /* storage indisponível: segue para o fallback de env */
  }
  return (import.meta.env["VITE_MAPBOX_TOKEN"] as string) || "";
}

export function getSavedMapboxToken(): string {
  try {
    return localStorage.getItem(MAPBOX_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setSavedMapboxToken(token: string) {
  if (token) localStorage.setItem(MAPBOX_TOKEN_KEY, token);
  else localStorage.removeItem(MAPBOX_TOKEN_KEY);
  window.dispatchEvent(new Event(MAPBOX_TOKEN_EVENT));
}
