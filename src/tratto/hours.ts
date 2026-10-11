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
