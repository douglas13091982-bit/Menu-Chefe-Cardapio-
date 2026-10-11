// Configurações de marketing no banco: Pixel ID em store_settings (público) e token em store_secrets (só admin)
import { supabase } from '@/integrations/supabase/client'

export interface MarketingConfig {
  pixelId: string
  accessToken: string
}

export async function loadPixelId(): Promise<string> {
  try {
    const { data } = await supabase.from('store_settings').select('marketing_pixel_id').eq('id', 'main').maybeSingle()
    return String(data?.marketing_pixel_id || '')
  } catch {
    return ''
  }
}

export async function loadMarketing(): Promise<MarketingConfig> {
  const pixelId = await loadPixelId()
  let accessToken = ''
  try {
    const { data } = await supabase.from('store_secrets').select('facebook_access_token').eq('id', 'main').maybeSingle()
    accessToken = String(data?.facebook_access_token || '')
  } catch {}
  return { pixelId, accessToken }
}

// Retorna uma mensagem de erro, ou null se salvou
export async function saveMarketing(data: MarketingConfig): Promise<string | null> {
  const now = new Date().toISOString()
  const a = await supabase.from('store_settings').upsert({ id: 'main', marketing_pixel_id: data.pixelId || null, updated_at: now })
  if (a.error) return a.error.message
  const b = await supabase.from('store_secrets').upsert({ id: 'main', facebook_access_token: data.accessToken || null, updated_at: now })
  if (b.error) return b.error.message
  return null
}

let loadedPixelId: string | null = null

// Carrega o Meta Pixel (fbq) e dispara PageView. Não faz nada se não houver Pixel ID.
export async function trackMenuPageView() {
  const pixelId = await loadPixelId()
  if (!/^\d+$/.test(pixelId)) return
  const w = window as any
  if (!w.fbq) {
    const n: any = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
    }
    w.fbq = n
    if (!w._fbq) w._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
  }
  if (loadedPixelId !== pixelId) {
    w.fbq('init', pixelId)
    loadedPixelId = pixelId
  }
  w.fbq('track', 'PageView')
}
