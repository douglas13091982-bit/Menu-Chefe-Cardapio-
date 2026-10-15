// @ts-nocheck -- rpc/colunas fora dos tipos gerados do Supabase (mesmo tratamento do StoreContext)
// Dados mínimos da loja para o PWA (manifest e ícone). Só roda no servidor.
import { supabase } from '@/integrations/supabase/client'

// mesmo apelido de endereço usado no StoreContext
const SLUG_ALIASES: Record<string, string> = { 'ferreira-sourdough': 'teste' }

export interface PwaStore {
  name: string
  themeColor?: string
  backgroundColor?: string
  /** PNG quadrado (data URL) gerado no painel quando o lojista salva as configurações. */
  icon?: string
}

export async function loadPwaStore(slug: string): Promise<PwaStore | null> {
  const clean = (slug || '').trim().toLowerCase()
  if (!clean || clean.length > 80) return null
  const { data, error } = await supabase.rpc('get_public_store', { _slug: SLUG_ALIASES[clean] || clean })
  const row: any = Array.isArray(data) ? data[0] : data
  if (error || !row?.id || row.available === false) return null
  const settings = await supabase.from('store_settings').select('config').eq('store_id', row.id).maybeSingle()
  const cfg: any = settings.data?.config || {}
  return {
    name: String(cfg.name || row.name || '').trim(),
    themeColor: cfg.menuButton,
    backgroundColor: cfg.menuBackground,
    icon: typeof cfg.pwaIcon === 'string' ? cfg.pwaIcon : undefined,
  }
}

/** Decodifica um PNG em data URL; retorna null se não for um PNG válido. */
export function decodePngDataUrl(value?: string): Uint8Array | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(value || '')
  if (!m) return null
  try {
    const bin = atob(m[1])
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    // assinatura PNG: 89 50 4E 47
    return out[0] === 0x89 && out[1] === 0x50 && out[2] === 0x4e && out[3] === 0x47 ? out : null
  } catch {
    return null
  }
}
