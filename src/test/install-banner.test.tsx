import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import InstallAppBanner from '../tratto/components/InstallAppBanner'

const setUA = (ua: string) => Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })

describe('Faixa de instalar app', () => {
  afterEach(() => { cleanup(); localStorage.clear() })

  it('não aparece quando o navegador não permite instalar', () => {
    setUA('Mozilla/5.0 (X11; Linux x86_64) Chrome/120')
    const { container } = render(<InstallAppBanner slug="loja" storeName="Loja" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('no iPhone mostra o passo a passo e pode ser dispensada', () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1')
    render(<InstallAppBanner slug="loja" storeName="Padaria Boa" accent="#2563eb" />)
    expect(screen.getByText(/Instale o app de Padaria Boa/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Instalar'))
    expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Dispensar'))
    expect(screen.queryByText(/Instale o app/)).toBeNull()
    expect(localStorage.getItem('pwa-banner-dismissed:loja')).toBe('1')
  })
})
