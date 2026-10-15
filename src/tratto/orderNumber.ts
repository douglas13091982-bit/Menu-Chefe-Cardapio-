// Código do pedido para exibir: número sequencial da loja (#0001). Pedidos sem número usam o id antigo.
export function formatOrderNumber(order: { id?: string; number?: number } | null | undefined): string {
  if (!order) return ''
  const n = order.number
  if (typeof n === 'number' && Number.isInteger(n) && n > 0) return '#' + String(n).padStart(4, '0')
  return order.id || ''
}
