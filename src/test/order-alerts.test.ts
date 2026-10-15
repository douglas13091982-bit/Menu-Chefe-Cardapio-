import { describe, it, expect, vi, afterEach } from 'vitest'
import { createOrderAnnouncer, playOrderSound } from '../tratto/orderAlerts'

const o = (id: string, status = 'pending') => ({ id, status })

describe('anunciador de novo pedido', () => {
  it('abrir o painel não toca com pedidos que já existiam', () => {
    const a = createOrderAnnouncer()
    expect(a.fromPoll([o('1'), o('2')])).toEqual([])
  })

  it('sem Realtime: a consulta periódica anuncia o pedido novo, uma única vez', () => {
    const a = createOrderAnnouncer()
    a.fromPoll([o('1')])
    expect(a.fromPoll([o('1'), o('2')]).map(x => x.id)).toEqual(['2'])
    expect(a.fromPoll([o('1'), o('2')])).toEqual([]) // próxima consulta: já anunciado
  })

  it('com Realtime ligado: não toca duas vezes (Realtime + consulta)', () => {
    const a = createOrderAnnouncer()
    a.fromPoll([])
    expect(a.fromRealtime(o('9'))).toBe(true)
    expect(a.fromPoll([o('9')])).toEqual([]) // a consulta encontra o mesmo pedido: silêncio
    expect(a.fromRealtime(o('9'))).toBe(false)
  })

  it('só anuncia pedidos pendentes vindos da consulta', () => {
    const a = createOrderAnnouncer()
    a.fromPoll([])
    expect(a.fromPoll([o('3', 'completed'), o('4', 'cancelled')])).toEqual([])
  })

  it('pedido lançado pelo próprio lojista não toca', () => {
    const a = createOrderAnnouncer()
    a.fromPoll([])
    a.markKnown('manual-1')
    expect(a.fromPoll([o('manual-1')])).toEqual([])
    expect(a.fromRealtime(o('manual-1'))).toBe(false)
  })

  it('reset (troca de loja/login) volta a não tocar na primeira consulta', () => {
    const a = createOrderAnnouncer()
    a.fromPoll([o('1')])
    a.reset()
    expect(a.fromPoll([o('1'), o('5')])).toEqual([])
  })
})

describe('tocar o MP3', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('toca a URL configurada em volume máximo', () => {
    const play = vi.fn().mockResolvedValue(undefined)
    const made: any[] = []
    vi.stubGlobal('Audio', function (this: any, url: string) { this.url = url; this.volume = 0; this.play = play; made.push(this) })
    playOrderSound('data:audio/mpeg;base64,AAAA')
    expect(made[0].url).toBe('data:audio/mpeg;base64,AAAA')
    expect(made[0].volume).toBe(1)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('não faz nada sem MP3 salvo', () => {
    const ctor = vi.fn()
    vi.stubGlobal('Audio', ctor)
    playOrderSound(undefined)
    playOrderSound('')
    expect(ctor).not.toHaveBeenCalled()
  })

  it('se o navegador bloquear o áudio, não quebra o painel', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('Audio', function (this: any) { this.play = () => Promise.reject(new Error('NotAllowedError')) })
    expect(() => playOrderSound('data:audio/mpeg;base64,AAAA')).not.toThrow()
    await Promise.resolve(); await Promise.resolve()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
