import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const update = vi.fn()
const mk = (id: string, status: string, number: number, extra = {}) => ({
  id, number, status, items: [{ product: { name: 'Pizza', price: 50 }, quantity: 1 }], total: 50, deliveryFee: 5,
  customerName: 'Douglas ' + id, customerPhone: '4799', customerAddress: 'Rua A', createdAt: '2026-10-14T23:27:00Z', updatedAt: '', ...extra,
})
vi.mock('../tratto/context/StoreContext', () => ({
  useStore: () => ({
    config: { name: 'Loja' }, updateOrderStatus: update,
    orders: [mk('a', 'pending', 1), mk('b', 'preparing', 2, { scheduledDate: '2026-10-15', scheduledTime: '18:30' }), mk('c', 'cancelled', 3)],
  }),
}))
import OrdersManager from '../tratto/components/admin/OrdersManager'

describe('Pedidos em pipeline', () => {
  it('mostra uma coluna por etapa com os cards', () => {
    render(<OrdersManager />)
    for (const t of ['Pendente', 'Preparando', 'Entregando', 'Concluído', 'Cancelado']) expect(screen.getAllByText(t).length).toBeGreaterThan(0)
    expect(screen.getByText('#0001')).toBeTruthy()
    expect(screen.getByText('#0003')).toBeTruthy()
  })
  it('clicar no card abre o popup com os detalhes; avançar no card não abre o popup', () => {
    render(<OrdersManager />)
    expect(screen.queryByText('Itens do pedido')).toBeNull()
    fireEvent.click(screen.getAllByText('Avançar →')[0])
    expect(update).toHaveBeenCalledWith('a', 'preparing')
    expect(screen.queryByText('Itens do pedido')).toBeNull()
    fireEvent.click(screen.getByText('#0002'))
    expect(screen.getByText('Itens do pedido')).toBeTruthy()
    expect(screen.getByText('Pedido #0002')).toBeTruthy()
  })
})
