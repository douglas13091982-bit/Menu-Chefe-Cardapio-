// Arquivamento automático: concluídos/cancelados saem do quadro 24 h depois da abertura da loja.
// O "dia da loja" começa no horário de abertura e dura 24 horas corridas (fuso de Brasília, UTC-3).
import { getWeeklyHours } from './hours'
import type { StoreConfig } from './types'

const OFFSET_MS = 3 * 3600 * 1000 // America/Sao_Paulo (sem horário de verão)

function openTimeFor(config: Partial<StoreConfig>, weekday: number): [number, number] {
  const week = getWeeklyHours(config)
  const parse = (t: string): [number, number] | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim())
    if (!m) return null
    const h = Number(m[1]), mi = Number(m[2])
    return h < 24 && mi < 60 ? [h, mi] : null
  }
  const day = week[weekday]
  const own = day?.open ? parse(day.openTime) : null
  if (own) return own
  const anyOpen = week.map(d => (d.open ? parse(d.openTime) : null)).find(Boolean)
  return anyOpen || [0, 0]
}

/** Instante em que começou o "dia da loja" atual: a abertura mais recente (hoje, ou ontem se ainda não abriu hoje). */
export function businessDayStart(config: Partial<StoreConfig>, now: Date = new Date()): Date {
  const local = new Date(now.getTime() - OFFSET_MS) // campos UTC = relógio de Brasília
  for (let back = 0; back <= 1; back++) {
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - back))
    const [h, m] = openTimeFor(config, d.getUTCDay())
    const start = new Date(d.getTime() + (h * 60 + m) * 60000 + OFFSET_MS)
    if (start.getTime() <= now.getTime()) return start
  }
  return new Date(now.getTime() - 24 * 3600 * 1000)
}

/** Pedido arquivado = já encerrado (concluído/cancelado) e anterior ao início do dia da loja. Em andamento nunca arquiva. */
export function isArchived(order: { status: string; updatedAt?: string; createdAt?: string }, start: Date): boolean {
  if (order.status !== 'completed' && order.status !== 'cancelled') return false
  const t = Date.parse(order.updatedAt || '') || Date.parse(order.createdAt || '')
  return Number.isFinite(t) && t < start.getTime()
}
