export { moneyCents, fmtDate, daysLeft, slugify } from '../format'

export type EffectiveStatus = 'trial' | 'trial_expired' | 'active' | 'overdue' | 'suspended' | 'cancelled'
export function effectiveStatus(s: { status: string; trial_ends_at?: string | null; paid_until?: string | null }): EffectiveStatus {
  const now = Date.now()
  if (s.status === 'suspended') return 'suspended'
  if (s.status === 'cancelled') return 'cancelled'
  if (s.status === 'trial') return s.trial_ends_at && new Date(s.trial_ends_at).getTime() < now ? 'trial_expired' : 'trial'
  return s.paid_until && new Date(s.paid_until).getTime() < now ? 'overdue' : 'active'
}
export const STATUS_LABEL: Record<EffectiveStatus, string> = {
  trial: 'Em teste', trial_expired: 'Teste expirado', active: 'Ativa', overdue: 'Vencida', suspended: 'Suspensa', cancelled: 'Cancelada',
}
export const STATUS_COLOR: Record<EffectiveStatus, string> = {
  trial: 'bg-blue-100 text-blue-700', trial_expired: 'bg-amber-100 text-amber-700', active: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700', suspended: 'bg-gray-200 text-gray-700', cancelled: 'bg-gray-200 text-gray-500',
}
export const isServable = (s: EffectiveStatus) => s === 'trial' || s === 'active'
