import { supabase } from '@/integrations/supabase/client'
import { getCurrentStoreId } from './tenant'

export const MAPBOX_TOKEN_KEY = 'store_mapbox_token'
export const MAPBOX_TOKEN_EVENT = 'store-mapbox-token-changed'

// Token PÚBLICO do Mapbox (pk.*) usado por padrão por todos os visitantes (frete, CEP e mapa).
// Tokens públicos são feitos para ficar no navegador; restrinja por URL no painel do Mapbox.
const DEFAULT_PUBLIC_TOKEN = 'pk.eyJ1IjoiZG91Z2xhczEzNTc5MCIsImEiOiJjbXRvbnljNjcwYmxzMndwcmwzenFsMDdkIn0.J3gQAqd-F0oYfV9FeyMm8Q'

// Token salvo no banco (store_settings.mapbox_public_token)
let dbToken = ''

export function setDbMapboxToken(token: string) {
  if (token === dbToken) return
  dbToken = token
  window.dispatchEvent(new Event(MAPBOX_TOKEN_EVENT))
}

// Prioridade: token salvo no painel > VITE_MAPBOX_TOKEN > token público padrão
export function getMapboxToken(): string {
  if (dbToken) return dbToken
  return (import.meta.env['VITE_MAPBOX_TOKEN'] as string) || DEFAULT_PUBLIC_TOKEN
}

export function getSavedMapboxToken(): string {
  return dbToken
}

export function setSavedMapboxToken(token: string) {
  dbToken = token
  window.dispatchEvent(new Event(MAPBOX_TOKEN_EVENT))
  supabase.from('store_settings').upsert({ store_id: getCurrentStoreId(), mapbox_public_token: token || null, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error('Erro ao salvar token do Mapbox:', error) })
}
