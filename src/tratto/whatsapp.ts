// Envio do pedido para o WhatsApp da loja (link wa.me com a mensagem pronta)
import type { Order, StoreConfig, CartItem, PaymentMethod } from './types'

const money = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: 'Cartão (na entrega/retirada)',
  pix: 'PIX',
  cash: 'Dinheiro',
}

const unitPrice = (item: CartItem) =>
  item.product.price + (item.selectedAddOns || []).reduce((sum, a) => sum + a.price, 0)

// Número da loja no formato internacional (55 + DDD + número). Retorna '' se o telefone não for válido.
export function storeWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return digits
  if (digits.length === 10 || digits.length === 11) return '55' + digits
  return ''
}

export function buildOrderMessage(order: Order, config: StoreConfig): string {
  const lines: string[] = []
  lines.push(`*Novo pedido ${order.id}* - ${config.name}`)
  lines.push('')
  lines.push(`*Cliente:* ${order.customerName}`)
  lines.push(`*Telefone:* ${order.customerPhone}`)
  lines.push('')
  lines.push('*Itens:*')
  for (const item of order.items) {
    lines.push(`• ${item.quantity}x ${item.product.name} - ${money(unitPrice(item) * item.quantity)}`)
    const extras = item.selectedAddOns || []
    if (extras.length > 0) {
      lines.push(`   + ${extras.map(a => `${a.name} (${money(a.price)})`).join(', ')}`)
    }
  }
  lines.push('')
  lines.push(`*Subtotal:* ${money(order.total)}`)
  if (order.deliveryType === 'delivery') {
    lines.push(`*Taxa de entrega:* ${money(order.deliveryFee)}`)
  }
  if (order.discount && order.discount > 0) {
    lines.push(`*Desconto${order.couponCode ? ' (' + order.couponCode + ')' : ''}:* -${money(order.discount)}`)
  }
  lines.push(`*Total:* ${money(order.total + order.deliveryFee - (order.discount || 0))}`)
  lines.push('')
  if (order.scheduledDate && order.scheduledTime) {
    const [y, m, d] = order.scheduledDate.split('-')
    lines.push(`*PEDIDO AGENDADO para ${d}/${m}/${y} às ${order.scheduledTime}*`)
  }
  if (order.deliveryType === 'delivery') {
    lines.push(`*Entrega em:* ${order.customerAddress}`)
  } else {
    lines.push('*Retirada no local*')
  }
  const pay = order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : ''
  if (pay) {
    lines.push(`*Pagamento:* ${pay}${order.changeFor ? ` - troco para ${money(order.changeFor)}` : ''}`)
  }
  return lines.join('\n')
}

export function buildWhatsAppUrl(order: Order, config: StoreConfig): string {
  const number = storeWhatsAppNumber(config.phone)
  if (!number) return ''
  return `https://wa.me/${number}?text=${encodeURIComponent(buildOrderMessage(order, config))}`
}
