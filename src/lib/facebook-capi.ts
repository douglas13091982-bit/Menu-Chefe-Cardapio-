// Montagem do evento de Compra para a API de Conversões do Meta (puro, sem rede: testável).
// Dados pessoais vão sempre com hash SHA-256 (minúsculas, sem espaços), como o Meta exige.

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Telefone brasileiro só com dígitos e DDI 55 (formato E.164 sem "+"). Vazio se não parecer um telefone. */
export function normalizePhoneBR(raw: string): string {
  let d = String(raw || '').replace(/\D/g, '').replace(/^0+/, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d
  if (d.length === 10 || d.length === 11) return '55' + d
  return ''
}

export function splitName(full: string): { first: string; last: string } {
  const parts = String(full || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  return { first: parts[0] || '', last: parts.length > 1 ? parts[parts.length - 1] : '' }
}

export interface PurchaseOrder {
  id: string
  items: Array<{ product: { id: string }; quantity: number; selectedAddOns?: Array<{ price: number }>; }>
  total: number
  deliveryFee?: number
  discount?: number
  customerName?: string
  customerPhone?: string
}

/** Valor pago pelo cliente (produtos + entrega − desconto), igual ao que a loja vê no pedido. */
export function orderValue(o: Pick<PurchaseOrder, 'total' | 'deliveryFee' | 'discount'>): number {
  return Math.round((Number(o.total || 0) + Number(o.deliveryFee || 0) - Number(o.discount || 0)) * 100) / 100
}

export function purchaseCustomData(o: PurchaseOrder & { items: any[] }) {
  const items = (o.items || []).filter(i => i?.product?.id)
  return {
    currency: 'BRL',
    value: orderValue(o),
    content_type: 'product',
    content_ids: items.map(i => String(i.product.id)),
    contents: items.map(i => ({
      id: String(i.product.id),
      quantity: Number(i.quantity) || 1,
      item_price: Number(i.product.price ?? 0) + (i.selectedAddOns || []).reduce((s: number, a: any) => s + Number(a.price || 0), 0),
    })),
    num_items: items.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
    order_id: o.id,
  }
}

export async function buildPurchaseEvent(args: {
  order: PurchaseOrder & { items: any[] }
  eventTime: number
  sourceUrl?: string
  ip?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}) {
  const { order } = args
  const phone = normalizePhoneBR(order.customerPhone || '')
  const { first, last } = splitName(order.customerName || '')
  const user_data: Record<string, any> = { country: [await sha256Hex('br')] }
  if (phone) {
    const ph = await sha256Hex(phone)
    user_data.ph = [ph]
    user_data.external_id = [ph]
  }
  if (first) user_data.fn = [await sha256Hex(first)]
  if (last) user_data.ln = [await sha256Hex(last)]
  if (args.ip) user_data.client_ip_address = args.ip
  if (args.userAgent) user_data.client_user_agent = args.userAgent
  if (args.fbp) user_data.fbp = args.fbp
  if (args.fbc) user_data.fbc = args.fbc
  return {
    event_name: 'Purchase',
    event_time: args.eventTime,
    event_id: order.id, // mesmo id do Pixel no navegador: o Meta junta os dois e conta uma compra só
    action_source: 'website',
    ...(args.sourceUrl ? { event_source_url: args.sourceUrl } : {}),
    user_data,
    custom_data: purchaseCustomData(order),
  }
}
