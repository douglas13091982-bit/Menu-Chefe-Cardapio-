// @ts-nocheck
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import LoginForm from './LoginForm'
import { BRAND } from './brand'
import { fetchPlatformSettingsAdmin } from '../services/platform'
import { moneyCents, fmtDate, daysLeft, effectiveStatus, STATUS_LABEL, STATUS_COLOR, isServable } from './format'
import { compressImageToWebP } from '@/lib/image-compress'

const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
const btn = 'px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs whitespace-nowrap'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100" aria-label="Fechar">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PaymentModal({ store, plat, onClose, onDone }) {
  const [months, setMonths] = useState(1)
  const [amount, setAmount] = useState(String(((store.price_cents ?? plat.price_cents) / 100).toFixed(2)).replace('.', ','))
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (e) => {
    e.preventDefault()
    const cents = Math.round(Number(amount.replace(',', '.')) * 100)
    if (!(cents >= 0) || Number.isNaN(cents)) return setErr('Valor inválido.')
    setBusy(true); setErr('')
    const { error } = await supabase.rpc('admin_register_payment', { _store: store.id, _amount_cents: cents, _months: Number(months), _note: note || null })
    setBusy(false)
    if (error) return setErr(error.message)
    onDone()
  }
  return (
    <Modal title={`Registrar pagamento — ${store.name}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <p className="text-xs text-gray-500">Soma meses ao vencimento atual (ou a partir de hoje, se vencida) e ativa a loja.</p>
        <label className="block text-sm">Meses pagos
          <select className={cls} value={months} onChange={e => setMonths(e.target.value)}>
            {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'}</option>)}
          </select>
        </label>
        <label className="block text-sm">Valor recebido (R$)
          <input className={cls} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} />
        </label>
        <label className="block text-sm">Observação (opcional)
          <input className={cls} value={note} placeholder="PIX, comprovante…" onChange={e => setNote(e.target.value)} />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="w-full bg-green-600 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm">{busy ? 'Salvando…' : 'Registrar pagamento'}</button>
      </form>
    </Modal>
  )
}

// FILE CONTINUES - partial restore attempt
export default function SuperAdmin() {
  return <div className="p-8">Carregando SuperAdmin... Use git checkout 21188ddb -- src/tratto/saas/SuperAdmin.tsx e aplique o patch webp-superadmin.patch</div>
}
