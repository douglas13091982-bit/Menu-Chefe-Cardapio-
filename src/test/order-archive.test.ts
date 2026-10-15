import { describe, it, expect } from 'vitest'
import { businessDayStart, isArchived } from '../tratto/orderArchive'

const cfg: any = { openTime: '18:00', closeTime: '23:00' }
const brt = (s: string) => new Date(s + '-03:00')

describe('arquivamento', () => {
  it('depois da abertura: o dia começou hoje às 18h', () => {
    expect(businessDayStart(cfg, brt('2026-10-15T20:00:00')).toISOString()).toBe(brt('2026-10-15T18:00:00').toISOString())
  })
  it('antes da abertura: ainda vale a abertura de ontem (24 h corridas)', () => {
    expect(businessDayStart(cfg, brt('2026-10-15T09:00:00')).toISOString()).toBe(brt('2026-10-14T18:00:00').toISOString())
  })
  it('usa o horário do dia da semana', () => {
    const weekly = Array.from({ length: 7 }, (_, i) => ({ open: true, openTime: i === 4 ? '10:30' : '18:00', closeTime: '23:00' }))
    // 15/10/2026 é quinta-feira (4)
    expect(businessDayStart({ weeklyHours: weekly } as any, brt('2026-10-15T12:00:00')).toISOString()).toBe(brt('2026-10-15T10:30:00').toISOString())
  })
  it('só arquiva encerrados e anteriores ao início', () => {
    const start = brt('2026-10-15T18:00:00')
    const old = brt('2026-10-14T20:00:00').toISOString()
    const fresh = brt('2026-10-15T19:00:00').toISOString()
    expect(isArchived({ status: 'completed', updatedAt: old }, start)).toBe(true)
    expect(isArchived({ status: 'cancelled', updatedAt: old }, start)).toBe(true)
    expect(isArchived({ status: 'completed', updatedAt: fresh }, start)).toBe(false)
    expect(isArchived({ status: 'pending', createdAt: old }, start)).toBe(false)
    expect(isArchived({ status: 'delivering', updatedAt: old }, start)).toBe(false)
  })
})
