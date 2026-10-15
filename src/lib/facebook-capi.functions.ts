import { createServerFn } from '@tanstack/react-start'
import { buildPurchaseEvent } from './facebook-capi'

// API de Conversões (servidor → Meta) para a compra. O navegador só manda o id do pedido:
// valor, itens e telefone são lidos do pedido gravado no banco (não dá para forjar valores).
// O token do Meta nunca sai do servidor.
type Input = { storeId: string; orderId: string; sourceUrl?: string; fbp?: string; fbc?: string }

function validate(raw: any): Input {
  const d = raw || {}
  if (!/^[0-9a-f-]{36}$/i.test(String(d.storeId || ''))) throw new Error('Loja inválida.')
  const orderId = String(d.orderId || '')
  if (!orderId || orderId.length > 60) throw new Error('Pedido inválido.')
  const clean = (v: any, max: number) => (typeof v === 'string' && v.length <= max ? v : undefined)
  return { storeId: String(d.storeId), orderId, sourceUrl: clean(d.sourceUrl, 500), fbp: clean(d.fbp, 120), fbc: clean(d.fbc, 300) }
}

export const sendPurchaseConversion = createServerFn({ method: 'POST' })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    const admin: any = supabaseAdmin

    const { data: row } = await admin.from('orders').select('data, created_at').eq('store_id', data.storeId).eq('id', data.orderId).maybeSingle()
    if (!row) return { ok: false, reason: 'pedido não encontrado' }
    // só pedidos recém-criados (evita reenvio/abuso com pedidos antigos)
    if (Date.now() - Date.parse(row.created_at) > 60 * 60 * 1000) return { ok: false, reason: 'pedido antigo' }

    const [{ data: settings }, { data: secrets }] = await Promise.all([
      admin.from('store_settings').select('marketing_pixel_id').eq('store_id', data.storeId).maybeSingle(),
      admin.from('store_secrets').select('facebook_access_token, facebook_test_event_code').eq('store_id', data.storeId).maybeSingle(),
    ])
    const pixelId = String(settings?.marketing_pixel_id || '')
    const token = String(secrets?.facebook_access_token || '')
    if (!/^\d+$/.test(pixelId) || !token) return { ok: false, reason: 'pixel/token não configurados' }

    const ip = (getRequestHeader('cf-connecting-ip') || getRequestHeader('x-forwarded-for') || '').split(',')[0].trim() || undefined
    const event = await buildPurchaseEvent({
      order: { ...(row.data || {}), id: data.orderId },
      eventTime: Math.floor(Date.now() / 1000),
      sourceUrl: data.sourceUrl,
      ip,
      userAgent: getRequestHeader('user-agent') || undefined,
      fbp: data.fbp,
      fbc: data.fbc,
    })

    const body: Record<string, any> = { data: [event], access_token: token }
    if (secrets?.facebook_test_event_code) body.test_event_code = String(secrets.facebook_test_event_code)
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: any = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('API de Conversões (Meta) recusou o evento:', json?.error?.message || res.status)
        return { ok: false, reason: json?.error?.message || `HTTP ${res.status}` }
      }
      return { ok: true, received: json?.events_received ?? 0 }
    } catch (e: any) {
      console.error('Falha ao chamar a API de Conversões (Meta):', e?.message)
      return { ok: false, reason: 'falha de rede' }
    }
  })
