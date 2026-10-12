// @ts-nocheck
import { useState } from 'react'
import { Tag, Pencil, Trash2, Plus } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { normalizeCode } from '../../coupons'

const empty = { code: '', type: 'percent', value: '', minOrder: '', startsAt: '', expiresAt: '', active: true }
const money = (n) => 'R$ ' + Number(n).toFixed(2).replace('.', ',')

export default function CouponsManager() {
  const { config, setConfig } = useStore()
  const coupons = config.coupons || []
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const save = (list) => setConfig({ ...config, coupons: list })

  const submit = (e) => {
    e.preventDefault()
    const code = normalizeCode(form.code)
    const value = Number(String(form.value).replace(',', '.'))
    if (!code) return setError('Informe o código do cupom.')
    if (!(value > 0)) return setError('Informe um valor de desconto maior que zero.')
    if (form.type === 'percent' && value > 100) return setError('O percentual máximo é 100%.')
    if (coupons.some(c => normalizeCode(c.code) === code && c.id !== editingId)) return setError('Já existe um cupom com esse código.')
    if (form.startsAt && form.expiresAt && form.expiresAt < form.startsAt) return setError('A data final deve ser depois da inicial.')
    const coupon = {
      id: editingId || 'cp' + Date.now().toString(36),
      code,
      type: form.type,
      value,
      minOrder: Number(String(form.minOrder).replace(',', '.')) || 0,
      startsAt: form.startsAt || '',
      expiresAt: form.expiresAt || '',
      active: form.active,
    }
    save(editingId ? coupons.map(c => (c.id === editingId ? coupon : c)) : [...coupons, coupon])
    setForm(empty); setEditingId(null); setError('')
  }

  const edit = (c) => {
    setEditingId(c.id)
    setForm({ code: c.code, type: c.type, value: String(c.value), minOrder: c.minOrder ? String(c.minOrder) : '', startsAt: c.startsAt || '', expiresAt: c.expiresAt || '', active: c.active })
    setError('')
  }

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Tag size={20} className="text-[#d9273f]" /> Cupons de desconto</h2>
        <p className="text-sm text-gray-500">Crie cupons para suas promoções. O cliente digita o código no carrinho e recebe o desconto.</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 space-y-3">
        <h3 className="font-semibold">{editingId ? 'Editar cupom' : 'Novo cupom'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">Código
            <input className={inputCls} placeholder="BEMVINDO10" value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </label>
          <label className="text-sm">Tipo de desconto
            <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Porcentagem (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </label>
          <label className="text-sm">{form.type === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
            <input className={inputCls} inputMode="decimal" placeholder={form.type === 'percent' ? '10' : '5,00'} value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })} />
          </label>
          <label className="text-sm">Pedido mínimo (R$) — opcional
            <input className={inputCls} inputMode="decimal" placeholder="0" value={form.minOrder}
              onChange={e => setForm({ ...form, minOrder: e.target.value })} />
          </label>
          <label className="text-sm">Válido a partir de — opcional
            <input type="date" className={inputCls} value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
          </label>
          <label className="text-sm">Válido até — opcional
            <input type="date" className={inputCls} value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Cupom ativo
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">
            {editingId ? 'Salvar alterações' : <><Plus size={15} className="inline mr-1" />Criar cupom</>}
          </button>
          {editingId && (
            <button type="button" className="border rounded-lg px-4 py-2 text-sm" onClick={() => { setEditingId(null); setForm(empty); setError('') }}>Cancelar</button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow divide-y">
        {coupons.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum cupom criado ainda.</p>}
        {coupons.map(c => (
          <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold tracking-wide">{c.code}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{c.active ? 'Ativo' : 'Desativado'}</span>
              </p>
              <p className="text-sm text-gray-600">
                {c.type === 'percent' ? `${c.value}% de desconto` : `${money(c.value)} de desconto`}
                {c.minOrder > 0 && ` • mínimo ${money(c.minOrder)}`}
                {c.startsAt && ` • de ${c.startsAt.split('-').reverse().join('/')}`}
                {c.expiresAt && ` • até ${c.expiresAt.split('-').reverse().join('/')}`}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button className="border rounded-lg px-3 py-1" onClick={() => save(coupons.map(x => x.id === c.id ? { ...x, active: !x.active } : x))}>{c.active ? 'Desativar' : 'Ativar'}</button>
              <button className="border rounded-lg px-3 py-1" onClick={() => edit(c)}><Pencil size={14} className="inline mr-1" />Editar</button>
              <button className="border border-red-300 text-red-600 rounded-lg px-3 py-1" onClick={() => { if (confirm(`Excluir o cupom ${c.code}?`)) save(coupons.filter(x => x.id !== c.id)) }}><Trash2 size={14} className="inline mr-1" />Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
