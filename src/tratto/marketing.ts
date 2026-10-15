// Configurações de marketing no banco: Pixel ID em store_settings (público) e token em store_secrets (só admin)
import { supabase } from '@/integrations/supabase/client'
import { errorPt } from '@/lib/errors-pt'
import { getCurrentStoreId } from './tenant'

export interface MarketingConfig {
  pixelId: string
  accessToken: string
  testEventCode: string
}

export async function loadPixelId(storeId: string = getCurrentStoreId()): Promise<string> {
  if (!storeId) return ''
  try {
    const { data } = await supabase.from('store_settings').select('marketing_pixel_id').eq('store_id', storeId).maybeSingle()
    return String(data?.marketing_pixel_id || '')
  } catch {
    return ''
  }
}

export async function loadMarketing(): Promise<MarketingConfig> {
  const pixelId = await loadPixelId()
  let accessToken = ''
  let testEventCode = ''
  try {
    const { data } = await supabase.from('store_secrets').select('facebook_access_token, facebook_test_event_code').eq('store_id', getCurrentStoreId()).maybeSingle()
    accessToken = String(data?.facebook_access_token || '')
    testEventCode = String(data?.facebook_test_event_code || '')
  } catch {}
  return { pixelId, accessToken, testEventCode }
}

// Retorna uma mensagem de erro, ou null se salvou
export async function saveMarketing(data: MarketingConfig): Promise<string | null> {
  const now = new Date().toISOString()
  const a = await supabase.from('store_settings').upsert({ store_id: getCurrentStoreId(), marketing_pixel_id: data.pixelId || null, updated_at: now })
  if (a.error) return errorPt(a.error)
  const b = await supabase.from('store_secrets').upsert({ store_id: getCurrentStoreId(), facebook_access_token: data.accessToken || null, facebook_test_event_code: data.testEventCode || null, updated_at: now })
  if (b.error) return errorPt(b.error)
  return null
}

let loadedPixelId: string | null = null

// Carrega o Meta Pixel (fbq) e dispara PageView. Não faz nada se não houver Pixel ID.
export async function trackMenuPageView(storeId?: string) {
  const pixelId = await loadPixelId(storeId)
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

// ---------- Eventos do funil de compra (Pixel no navegador) ----------

function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : ''
  } catch { return '' }
}

/** fbc: cookie _fbc, ou montado a partir do ?fbclid= da URL (clique no anúncio). */
function getFbc(): string {
  const c = readCookie('_fbc')
  if (c) return c
  try {
    const id = new URLSearchParams(window.location.search).get('fbclid')
    return id ? `fb.1.${Date.now()}.${id}` : ''
  } catch { return '' }
}

function track(name: string, params: Record<string, any>, eventId?: string) {
  const w = window as any
  if (!loadedPixelId || typeof w.fbq !== 'function') return
  try {
    if (eventId) w.fbq('track', name, params, { eventID: eventId })
    else w.fbq('track', name, params)
  } catch { /* marketing nunca atrapalha a venda */ }
}

const lineValue = (item: any) =>
  (Number(item.product?.price ?? 0) + (item.selectedAddOns || []).reduce((s: number, a: any) => s + Number(a.price || 0), 0)) * (Number(item.quantity) || 1)

export function trackViewContent(product: { id: string; name: string; price: number }) {
  track('ViewContent', { content_type: 'product', content_ids: [String(product.id)], content_name: product.name, value: Number(product.price) || 0, currency: 'BRL' })
}

export function trackAddToCart(product: { id: string; name: string; price: number }, quantity = 1) {
  track('AddToCart', {
    content_type: 'product', content_ids: [String(product.id)], content_name: product.name,
    contents: [{ id: String(product.id), quantity, item_price: Number(product.price) || 0 }],
    value: (Number(product.price) || 0) * quantity, currency: 'BRL',
  })
}

export function trackInitiateCheckout(cart: any[], value: number) {
  track('InitiateCheckout', {
    content_type: 'product', content_ids: cart.map(i => String(i.product?.id)),
    contents: cart.map(i => ({ id: String(i.product?.id), quantity: Number(i.quantity) || 1, item_price: lineValue(i) / (Number(i.quantity) || 1) })),
    num_items: cart.reduce((s, i) => s + (Number(i.quantity) || 1), 0), value, currency: 'BRL',
  })
}

/**
 * Compra: Pixel no navegador + API de Conversões no servidor, com o MESMO event_id (id do pedido),
 * para o Meta contar uma compra só. Valor = total pago (produtos + entrega − desconto).
 */
export async function trackPurchase(order: any, value: number, storeId: string = getCurrentStoreId()) {
  const items = (order.items || []).filter((i: any) => i?.product?.id)
  track('Purchase', {
    currency: 'BRL', value,
    content_type: 'product',
    content_ids: items.map((i: any) => String(i.product.id)),
    contents: items.map((i: any) => ({ id: String(i.product.id), quantity: Number(i.quantity) || 1, item_price: lineValue(i) / (Number(i.quantity) || 1) })),
    num_items: items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0),
    order_id: order.id,
  }, order.id)
  try {
    const { sendPurchaseConversion } = await import('@/lib/facebook-capi.functions')
    await sendPurchaseConversion({ data: { storeId, orderId: order.id, sourceUrl: window.location.href, fbp: readCookie('_fbp') || undefined, fbc: getFbc() || undefined } })
  } catch { /* sem token/pixel ou sem rede: o Pixel do navegador já enviou */ }
}
