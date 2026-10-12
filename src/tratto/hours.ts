// Horário de funcionamento por dia da semana (fuso de Brasília)
import type { DayHours, StoreConfig } from './types'

// índice 0 = domingo
export const DAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const DAY_NAMES_LOWER = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
// ordem de exibição no painel: segunda a domingo
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const STORE_TZ = 'America/Sao_Paulo'

export function defaultWeeklyHours(openTime = '18:00', closeTime = '23:00'): DayHours[] {
  return Array.from({ length: 7 }, () => ({ open: true, openTime, closeTime }))
}

// Usa o horário por dia; se a loja ainda não tem, parte do horário único antigo (openTime/closeTime)
export function getWeeklyHours(config: Partial<StoreConfig>): DayHours[] {
  const w = config.weeklyHours
  if (Array.isArray(w) && w.length === 7) {
    return w.map(d => ({ open: !!d?.open, openTime: d?.openTime || '', closeTime: d?.closeTime || '' }))
  }
  return defaultWeeklyHours(config.openTime || '18:00', config.closeTime || '23:00')
}

const toMin = (t: string) => {
  const [h, m] = (t || '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN
}

const validRange = (d: DayHours) => {
  const o = toMin(d.openTime)
  const c = toMin(d.closeTime)
  return d.open && Number.isFinite(o) && Number.isFinite(c) && o !== c
}

function storeNow(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const wd = parts.find(p => p.type === 'weekday')?.value || 'Sun'
  let h = Number(parts.find(p => p.type === 'hour')?.value || 0)
  if (h === 24) h = 0
  const m = Number(parts.find(p => p.type === 'minute')?.value || 0)
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd), minutes: h * 60 + m }
}

export interface StoreStatus {
  open: boolean
  text: string
}

export function getStoreStatus(config: Partial<StoreConfig>, date: Date = new Date()): StoreStatus {
  // chave geral do painel: fecha a loja mesmo dentro do horário
  if (config.isOpen === false) return { open: false, text: 'Fechado no momento' }

  const week = getWeeklyHours(config)
  const { day, minutes } = storeNow(date)
  const today = week[day]
  const prev = week[(day + 6) % 7]

  if (validRange(today)) {
    const o = toMin(today.openTime)
    const c = toMin(today.closeTime)
    if (c > o && minutes >= o && minutes < c) return { open: true, text: `Aberto agora • até ${today.closeTime}` }
    if (c < o && minutes >= o) return { open: true, text: `Aberto agora • até ${today.closeTime}` }
  }
  // turno que começou ontem e termina de madrugada
  if (validRange(prev)) {
    const po = toMin(prev.openTime)
    const pc = toMin(prev.closeTime)
    if (pc < po && minutes < pc) return { open: true, text: `Aberto agora • até ${prev.closeTime}` }
  }

  if (validRange(today) && minutes < toMin(today.openTime)) {
    return { open: false, text: `Fechado • abre hoje às ${today.openTime}` }
  }
  for (let i = 1; i <= 7; i++) {
    const idx = (day + i) % 7
    if (validRange(week[idx])) {
      const when = i === 1 ? 'amanhã' : DAY_NAMES_LOWER[idx]
      return { open: false, text: `Fechado • abre ${when} às ${week[idx].openTime}` }
    }
  }
  return { open: false, text: 'Fechado' }
}

// ---------- Agendamento de pedidos ----------
export interface ScheduleDay {
  date: string // YYYY-MM-DD (data em Brasília)
  label: string // "Hoje", "Amanhã", "ter, 14/10"
  times: string[] // "18:00", "18:30"…
}

const pad = (n: number) => String(n).padStart(2, '0')
const fmtTime = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

function brtDateString(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: STORE_TZ }).format(date) // YYYY-MM-DD
}

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/**
 * Horários disponíveis para agendar, sempre dentro do horário de funcionamento de cada dia.
 * Hoje só entram horários com antecedência mínima (leadMinutes).
 */
export function getScheduleSlots(
  config: Partial<StoreConfig>,
  now: Date = new Date(),
  opts?: { days?: number; slotMinutes?: number; leadMinutes?: number },
): ScheduleDay[] {
  const days = Math.min(Math.max(Number(opts?.days ?? config.schedulingDays ?? 7) || 7, 1), 30)
  const slot = Math.min(Math.max(Number(opts?.slotMinutes ?? config.schedulingSlotMinutes ?? 30) || 30, 10), 240)
  const lead = Math.max(Number(opts?.leadMinutes ?? config.schedulingLeadMinutes ?? 60) || 0, 0)
  const week = getWeeklyHours(config)
  const today = brtDateString(now)
  const { minutes: nowMin } = storeNow(now)
  const [ty, tm, td] = today.split('-').map(Number)
  const out: ScheduleDay[] = []

  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(ty, tm - 1, td + i, 12))
    const date = d.toISOString().slice(0, 10)
    const dow = d.getUTCDay()
    const h = week[dow]
    if (!validRange(h)) continue
    const o = toMin(h.openTime)
    const c = toMin(h.closeTime)
    const lastStart = (c > o ? c : 24 * 60) - slot // vira a meia-noite: agenda só até 23:59 do próprio dia
    const times: string[] = []
    for (let t = o; t <= lastStart; t += slot) {
      if (i === 0 && t < nowMin + lead) continue
      times.push(fmtTime(t))
    }
    if (!times.length) continue
    const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : `${WEEKDAY_SHORT[dow]}, ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`
    out.push({ date, label, times })
  }
  return out
}

export function formatScheduled(date?: string, time?: string): string {
  if (!date || !time) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y} às ${time}`
}
