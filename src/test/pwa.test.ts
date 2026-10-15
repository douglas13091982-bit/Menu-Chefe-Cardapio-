import { describe, it, expect } from 'vitest'
import { buildManifest, pwaShortName, safeHex, readableOn, storeInitial, hashString } from '../tratto/pwa'
import { decodePngDataUrl } from '../lib/pwa-store.server'

describe('PWA por loja', () => {
  it('encurta o nome para o ícone da tela inicial', () => {
    expect(pwaShortName('Tratto')).toBe('Tratto')
    expect(pwaShortName('Ferreira Sourdough Padaria')).toBe('Ferreira')
    expect(pwaShortName('')).toBe('Cardápio')
    // nunca corta palavra no meio: nome de uma palavra só fica inteiro (o Android abrevia com …)
    expect(pwaShortName('ferreirasordough')).toBe('ferreirasordough')
  })

  it('valida cores hex e cai no padrão quando inválida', () => {
    expect(safeHex('#ABC')).toBe('#aabbcc')
    expect(safeHex('d9273f')).toBe('#d9273f')
    expect(safeHex('rgb(1,2,3)')).toBe('#d9273f')
    expect(safeHex(undefined, '#ffffff')).toBe('#ffffff')
  })

  it('escolhe texto legível sobre o fundo', () => {
    expect(readableOn('#ffffff')).toBe('#1f2937')
    expect(readableOn('#d9273f')).toBe('#ffffff')
    expect(readableOn('#000000')).toBe('#ffffff')
  })

  it('usa a primeira letra/número do nome', () => {
    expect(storeInitial('  ferreira')).toBe('F')
    expect(storeInitial('7 Mares')).toBe('7')
    expect(storeInitial('')).toBe('C')
  })

  it('cada loja tem um app distinto, abrindo direto no cardápio dela', () => {
    const icons = [{ src: 'data:image/png;base64,AA', sizes: '192x192', type: 'image/png' }]
    const a = buildManifest({ slug: 'loja-a', name: 'Loja A', origin: 'https://menu.app/', themeColor: '#112233', icons })
    const b = buildManifest({ slug: 'loja-b', name: 'Loja B', origin: 'https://menu.app', icons })
    expect(a.id).not.toBe(b.id)
    expect(a.start_url).toBe('https://menu.app/loja-a')
    expect(a.scope).toBe('https://menu.app/loja-a')
    expect(a.start_url.startsWith(a.scope)).toBe(true)
    expect(a.display).toBe('standalone')
    expect(a.theme_color).toBe('#112233')
    expect(b.theme_color).toBe('#d9273f')
    expect(a.icons).toEqual(icons)
  })

  it('hash do ícone muda quando o ícone muda (para furar o cache)', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('abc')).not.toBe(hashString('abd'))
    expect(hashString('')).toBe(hashString(''))
  })

  it('só aceita PNG de verdade como ícone do servidor', () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const ok = decodePngDataUrl('data:image/png;base64,' + png)
    expect(ok && ok[0]).toBe(0x89)
    expect(decodePngDataUrl('data:image/webp;base64,' + png)).toBeNull()
    expect(decodePngDataUrl('data:image/png;base64,AAAA')).toBeNull() // não tem a assinatura PNG
    expect(decodePngDataUrl('')).toBeNull()
    expect(decodePngDataUrl(undefined)).toBeNull()
  })
})
