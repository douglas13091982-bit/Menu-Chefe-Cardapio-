export const MAPBOX_TOKEN_KEY = 'store_mapbox_token'
export const MAPBOX_TOKEN_EVENT = 'store-mapbox-token-changed'

// Token PÚBLICO do Mapbox (pk.*) usado por padrão por todos os visitantes (frete, CEP e mapa).
// Tokens públicos são feitos para ficar no navegador; restrinja por URL no painel do Mapbox.
const DEFAULT_PUBLIC_TOKEN = 'pk.eyJ1IjoiZG91Z2xhczEzNTc5MCIsImEiOiJjbXRvbnljNjcwYmxzMndwcmwzenFsMDdkIn0.J3gQAqd-F0oYfV9FeyMm8Q'

// Prioridade: token salvo no painel > VITE_MAPBOX_TOKEN > token público padrão
export function getMapboxToken(): string {
  try {
    const saved = localStorage.getItem(MAPBOX_TOKEN_KEY)
    if (saved) return saved
  } catch {}
  return (import.meta.env['VITE_MAPBOX_TOKEN'] as string) || DEFAULT_PUBLIC_TOKEN
}

export function getSavedMapboxToken(): string {
  try { return localStorage.getItem(MAPBOX_TOKEN_KEY) || '' } catch { return '' }
}

export function setSavedMapboxToken(token: string) {
  if (token) localStorage.setItem(MAPBOX_TOKEN_KEY, token)
  else localStorage.removeItem(MAPBOX_TOKEN_KEY)
  window.dispatchEvent(new Event(MAPBOX_TOKEN_EVENT))
}
