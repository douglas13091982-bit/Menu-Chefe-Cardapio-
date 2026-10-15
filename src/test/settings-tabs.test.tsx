import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../tratto/context/StoreContext', () => ({
  useStore: () => ({ dataReady: true, config: { name: 'Loja', phone: '', address: '', deliveryFee: 5, minOrder: 20, subtitle: '', openTime: '18:00', closeTime: '23:00', isOpen: true }, setConfig: async () => true }),
}))
vi.mock('../tratto/components/admin/MapboxIntegration', () => ({ default: () => <div>MAPBOX-INTEGRACAO</div> }))
import SettingsPanel from '../tratto/components/admin/SettingsPanel'

const visible = (text: string | RegExp) => {
  const el = screen.queryAllByText(text)[0]
  return !!el && !el.closest('.hidden')
}

describe('Configurações em abas', () => {
  it('mostra uma seção por aba', () => {
    render(<SettingsPanel />)
    expect(screen.getAllByRole('tab').length).toBe(7)
    expect(visible('Informações da Loja')).toBe(false)
    fireEvent.click(screen.getByRole('tab', { name: 'Loja' }))
    expect(visible('Informações da Loja')).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: 'Integrações' }))
    expect(screen.getByText('MAPBOX-INTEGRACAO')).toBeTruthy()
    expect(visible('Informações da Loja')).toBe(false)
    fireEvent.click(screen.getByRole('tab', { name: 'Segurança' }))
    expect(screen.queryByText('MAPBOX-INTEGRACAO')).toBeNull()
    expect(screen.getByText(/Segurança - Senha/)).toBeTruthy()
  })
  it('o botão Salvar existe e a aba Entrega/Pedidos/Horários também funcionam', () => {
    render(<SettingsPanel />)
    for (const t of ['Horários', 'Entrega', 'Pedidos']) fireEvent.click(screen.getByRole('tab', { name: t }))
    expect(screen.getByText('Salvar Configurações')).toBeTruthy()
  })
})
