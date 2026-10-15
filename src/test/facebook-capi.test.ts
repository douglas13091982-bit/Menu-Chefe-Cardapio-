import { describe, it, expect } from 'vitest'
import { normalizePhoneBR, sha256Hex, buildPurchaseEvent, orderValue } from '../lib/facebook-capi'

const order: any = {
  id: '#ABC123', total: 80, deliveryFee: 5, discount: 10, customerName: 'Douglas Ferreira Silva', customerPhone: '(47) 98925-9134',
  items: [
    { product: { id: 'p1', price: 40 }, quantity: 1, selectedAddOns: [{ price: 5 }] },
    { product: { id: 'p2', price: 15 }, quantity: 2 },
  ],
}

describe('API de Conversões: compra', () => {
  it('normaliza telefone brasileiro para 55 + DDD + número', () => {
    expect(normalizePhoneBR('(47) 98925-9134')).toBe('5547989259134')
    expect(normalizePhoneBR('47 3333-4444')).toBe('554733334444')
    expect(normalizePhoneBR('+55 47 98925-9134')).toBe('5547989259134')
    expect(normalizePhoneBR('123')).toBe('')
  })
  it('sha256 conhecido', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
  it('valor = produtos + entrega − desconto', () => {
    expect(orderValue(order)).toBe(75)
  })
  it('monta o evento com id do pedido, moeda, itens e dados com hash', async () => {
    const e: any = await buildPurchaseEvent({ order, eventTime: 1760000000, sourceUrl: 'https://x/teste', ip: '1.2.3.4', userAgent: 'UA', fbp: 'fb.1.1.2' })
    expect(e.event_name).toBe('Purchase')
    expect(e.event_id).toBe('#ABC123')
    expect(e.action_source).toBe('website')
    expect(e.custom_data).toMatchObject({ currency: 'BRL', value: 75, num_items: 3, content_ids: ['p1', 'p2'], order_id: '#ABC123' })
    expect(e.custom_data.contents[0]).toEqual({ id: 'p1', quantity: 1, item_price: 45 })
    expect(e.user_data.ph[0]).toBe(await sha256Hex('5547989259134'))
    expect(e.user_data.fn[0]).toBe(await sha256Hex('douglas'))
    expect(e.user_data.ln[0]).toBe(await sha256Hex('silva'))
    expect(JSON.stringify(e)).not.toContain('98925')
    expect(e.user_data.client_ip_address).toBe('1.2.3.4')
  })
})
