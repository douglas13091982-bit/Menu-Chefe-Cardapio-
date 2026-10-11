import type { Coupon } from './types'

export const normalizeCode = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, '')

const todayBR = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()) // YYYY-MM-DD

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; message: string }

export function calcDiscount(coupon: Coupon, subtotal: number): number {
  const raw = coupon.type === 'percent' ? subtotal * (Number(coupon.value) / 100) : Number(coupon.value)
  return Math.round(Math.max(0, Math.min(raw, subtotal)) * 100) / 100
}

export function validateCoupon(
  coupons: Coupon[] | undefined,
  code: string,
  subtotal: number,
  today: string = todayBR(),
): CouponResult {
  const c = normalizeCode(code)
  if (!c) return { ok: false, message: 'Digite o código do cupom.' }
  const coupon = (coupons || []).find(x => normalizeCode(x.code) === c)
  if (!coupon || !coupon.active) return { ok: false, message: 'Cupom inválido.' }
  if (coupon.startsAt && today < coupon.startsAt) return { ok: false, message: 'Este cupom ainda não está válido.' }
  if (coupon.expiresAt && today > coupon.expiresAt) return { ok: false, message: 'Este cupom expirou.' }
  const min = Number(coupon.minOrder) || 0
  if (subtotal < min) {
    return { ok: false, message: `Pedido mínimo de R$ ${min.toFixed(2).replace('.', ',')} para este cupom.` }
  }
  return { ok: true, coupon, discount: calcDiscount(coupon, subtotal) }
}
