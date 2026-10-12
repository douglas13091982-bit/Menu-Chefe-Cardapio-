// @ts-nocheck
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import LoginForm from './LoginForm'
import { BRAND } from './brand'
import { moneyCents, fmtDate, daysLeft, effectiveStatus, STATUS_LABEL, STATUS_COLOR, isServable } from './format'

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

function EditModal({ store, plat, onClose, onDone }) {
  const [price, setPrice] = useState(store.price_cents == null ? '' : (store.price_cents / 100).toFixed(2).replace('.', ','))
  const [notes, setNotes] = useState(store.notes || '')
  const [trialEnd, setTrialEnd] = useState(store.trial_ends_at ? store.trial_ends_at.slice(0, 10) : '')
  const [paidUntil, setPaidUntil] = useState(store.paid_until ? store.paid_until.slice(0, 10) : '')
  const [err, setErr] = useState('')
  const save = async (e) => {
    e.preventDefault()
    const patch = {
      notes: notes || null,
      price_cents: price.trim() === '' ? null : Math.round(Number(price.replace(',', '.')) * 100),
      trial_ends_at: trialEnd ? new Date(trialEnd + 'T23:59:59').toISOString() : null,
      paid_until: paidUntil ? new Date(paidUntil + 'T23:59:59').toISOString() : null,
    }
    if (patch.price_cents != null && Number.isNaN(patch.price_cents)) return setErr('Preço inválido.')
    const { error } = await supabase.from('stores').update(patch).eq('id', store.id)
    if (error) return setErr(error.message)
    onDone()
  }
  return (
    <Modal title={`Editar — ${store.name}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <label className="block text-sm">Preço mensal desta loja (R$) — vazio usa o preço padrão ({moneyCents(plat.price_cents)})
          <input className={cls} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Fim do teste
            <input type="date" className={cls} value={trialEnd} onChange={e => setTrialEnd(e.target.value)} />
          </label>
          <label className="block text-sm">Pago até
            <input type="date" className={cls} value={paidUntil} onChange={e => setPaidUntil(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">Notas internas
          <textarea className={cls + ' h-20'} value={notes} onChange={e => setNotes(e.target.value)} />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full bg-gray-900 text-white font-semibold rounded-lg py-2.5 text-sm">Salvar</button>
      </form>
    </Modal>
  )
}

function StoresTab({ plat, reload, stores }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [pay, setPay] = useState(null)
  const [edit, setEdit] = useState(null)
  const [msg, setMsg] = useState('')

  const rows = useMemo(() => stores.map(s => ({ ...s, eff: effectiveStatus(s) })), [stores])
  const list = rows.filter(s => {
    if (filter !== 'all' && s.eff !== filter) return false
    const t = q.trim().toLowerCase()
    return !t || [s.name, s.slug, s.owner_email].some(v => String(v || '').toLowerCase().includes(t))
  })
  const count = (st) => rows.filter(s => s.eff === st).length
  const mrr = rows.filter(s => s.eff === 'active').reduce((n, s) => n + (s.price_cents ?? plat.price_cents), 0)

  const run = async (p) => { const { error } = await p; if (error) setMsg(error.message); else { setMsg(''); reload() } }
  const suspend = (s) => run(supabase.from('stores').update({ status: 'suspended' }).eq('id', s.id))
  const reactivate = (s) => {
    const paid = s.paid_until && new Date(s.paid_until) > new Date()
    return run(supabase.from('stores').update(paid
      ? { status: 'active' }
      : { status: 'trial', trial_ends_at: new Date(Date.now() + (plat.trial_days || 7) * 86400000).toISOString() }).eq('id', s.id))
  }
  const extendTrial = (s) => {
    const base = Math.max(Date.now(), s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0)
    return run(supabase.from('stores').update({ status: 'trial', trial_ends_at: new Date(base + 7 * 86400000).toISOString() }).eq('id', s.id))
  }
  const cancel = (s) => { if (confirm(`Cancelar a assinatura de ${s.name}? O cardápio sai do ar.`)) run(supabase.from('stores').update({ status: 'cancelled' }).eq('id', s.id)) }
  const remove = (s) => {
    const typed = prompt(`Excluir ${s.name} apaga produtos, pedidos e configurações para sempre.\nDigite o endereço (${s.slug}) para confirmar:`)
    if (typed === s.slug) run(supabase.from('stores').delete().eq('id', s.id))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['Lojas', rows.length], ['Ativas', count('active')], ['Em teste', count('trial')],
          ['Vencidas / expiradas', count('overdue') + count('trial_expired')], ['Receita mensal (ativas)', moneyCents(mrr)],
        ].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl shadow-sm p-4"><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold text-gray-900 mt-1">{v}</p></div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input className={cls} placeholder="Buscar por nome, endereço ou e-mail" value={q} onChange={e => setQ(e.target.value)} />
        <select className={cls + ' sm:max-w-[200px]'} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="text-left text-xs text-gray-500 border-b">
            <tr><th className="p-3">Loja</th><th className="p-3">Dono</th><th className="p-3">Status</th><th className="p-3">Vencimento</th><th className="p-3">Pedidos</th><th className="p-3">Mensalidade</th><th className="p-3">Ações</th></tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">Nenhuma loja encontrada.</td></tr>}
            {list.map(s => (
              <tr key={s.id} className="align-top">
                <td className="p-3"><a href={`/${s.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-gray-900 hover:underline">{s.name}</a><div className="text-xs text-gray-500">/{s.slug} · criada em {fmtDate(s.created_at)}</div>{s.notes && <div className="text-xs text-amber-700 mt-0.5">📝 {s.notes}</div>}</td>
                <td className="p-3 text-xs text-gray-600">{s.owner_email || '—'}</td>
                <td className="p-3"><span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_COLOR[s.eff]}`}>{STATUS_LABEL[s.eff]}</span></td>
                <td className="p-3 text-xs">
                  {s.status === 'trial' ? <>teste até {fmtDate(s.trial_ends_at)}<div className="text-gray-500">{daysLeft(s.trial_ends_at)} dia(s)</div></>
                    : s.paid_until ? <>até {fmtDate(s.paid_until)}<div className="text-gray-500">{daysLeft(s.paid_until)} dia(s)</div></> : '—'}
                </td>
                <td className="p-3 text-xs">{s.orders_count}<div className="text-gray-500">{s.last_order_at ? 'último ' + fmtDate(s.last_order_at) : 'sem pedidos'}</div></td>
                <td className="p-3 text-xs">{moneyCents(s.price_cents ?? plat.price_cents)}{s.price_cents != null && <div className="text-gray-500">personalizada</div>}</td>
                <td className="p-3"><div className="flex flex-wrap gap-1.5 max-w-[260px]">
                  <button className={btn + ' !bg-green-50 !border-green-200 text-green-700'} onClick={() => setPay(s)}>Registrar pagamento</button>
                  <button className={btn} onClick={() => extendTrial(s)}>+7 dias de teste</button>
                  {isServable(s.eff) ? <button className={btn} onClick={() => suspend(s)}>Suspender</button> : <button className={btn} onClick={() => reactivate(s)}>Reativar</button>}
                  <button className={btn} onClick={() => setEdit(s)}>Editar</button>
                  <button className={btn} onClick={() => cancel(s)}>Cancelar</button>
                  <button className={btn + ' text-red-600'} onClick={() => remove(s)}>Excluir</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pay && <PaymentModal store={pay} plat={plat} onClose={() => setPay(null)} onDone={() => { setPay(null); reload() }} />}
      {edit && <EditModal store={edit} plat={plat} onClose={() => setEdit(null)} onDone={() => { setEdit(null); reload() }} />}
    </div>
  )
}

function PaymentsTab({ stores }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('store_payments').select('*').order('paid_at', { ascending: false }).limit(100).then(({ data }) => setRows(data || []))
  }, [])
  const names = Object.fromEntries(stores.map(s => [s.id, s.name]))
  const total = (rows || []).reduce((n, r) => n + r.amount_cents, 0)
  if (!rows) return <p className="text-sm text-gray-500">Carregando…</p>
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Últimos {rows.length} pagamentos registrados — total {moneyCents(total)}</p>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-left text-xs text-gray-500 border-b"><tr><th className="p-3">Data</th><th className="p-3">Loja</th><th className="p-3">Meses</th><th className="p-3">Valor</th><th className="p-3">Obs.</th></tr></thead>
          <tbody className="divide-y">
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum pagamento registrado.</td></tr>}
            {rows.map(r => <tr key={r.id}><td className="p-3">{fmtDate(r.paid_at)}</td><td className="p-3">{names[r.store_id] || '—'}</td><td className="p-3">{r.months}</td><td className="p-3 font-medium">{moneyCents(r.amount_cents)}</td><td className="p-3 text-xs text-gray-500">{r.note || ''}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlatformTab({ plat, reload }) {
  const [name, setName] = useState(plat.system_name || BRAND)
  const [logoUrl, setLogoUrl] = useState(plat.logo_url || '')
  const [logoFile, setLogoFile] = useState(null)
  const [price, setPrice] = useState((plat.price_cents / 100).toFixed(2).replace('.', ','))
  const [trial, setTrial] = useState(plat.trial_days)
  const [wa, setWa] = useState(plat.contact_whatsapp || '')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setMsg('')
    const cents = Math.round(Number(price.replace(',', '.')) * 100)
    if (Number.isNaN(cents) || cents < 0) return setMsg('Preço inválido.')
    if (!name.trim()) return setMsg('Informe o nome do sistema.')
    setBusy(true)
    let nextLogoUrl = logoUrl
    if (logoFile) {
      const ext = (logoFile.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
      const path = 'system-logo.' + ext
      const { error: uploadError } = await supabase.storage.from('platform-branding').upload(path, logoFile, {
        upsert: true,
        contentType: logoFile.type || 'image/png',
        cacheControl: '3600',
      })
      if (uploadError) {
        setBusy(false)
        return setMsg('Não foi possível enviar a logo. Confira se a migração de identidade visual foi aplicada. ' + uploadError.message)
      }
      nextLogoUrl = supabase.storage.from('platform-branding').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
    }
    const { error } = await supabase.from('platform_settings').update({
      system_name: name.trim(),
      logo_url: nextLogoUrl || null,
      plan_name: plat.plan_name,
      price_cents: cents,
      trial_days: Math.max(0, Number(trial) || 0),
      contact_whatsapp: wa.replace(/\D/g, ''),
      updated_at: new Date().toISOString(),
    }).eq('id', 'main')
    setBusy(false)
    if (error) return setMsg('Não foi possível salvar. Confira se a migração de identidade visual foi aplicada. ' + error.message)
    setLogoFile(null)
    setMsg('Configurações salvas com sucesso.')
    reload()
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-5 max-w-2xl space-y-5">
      <div>
        <h3 className="font-bold text-gray-900">Identidade visual do sistema</h3>
        <p className="text-xs text-gray-500 mt-1">Essas configurações são da plataforma inteira, não da marca individual de cada restaurante.</p>
      </div>
      <label className="block text-sm font-medium text-gray-700">Nome do sistema
        <input className={cls + ' mt-1'} value={name} maxLength={80} required onChange={e => setName(e.target.value)} placeholder="Ex.: Meu Cardápio Digital" />
      </label>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Logotipo do sistema</label>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="w-24 h-24 shrink-0 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
            {logoUrl
              ? <img src={logoUrl} alt="Prévia da logo do sistema" className="max-w-full max-h-full object-contain" />
              : <span className="text-xs text-gray-400 text-center px-2">Sem logo personalizada</span>}
          </div>
          <div className="flex-1 space-y-2">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className={cls} onChange={e => {
              const file = e.target.files?.[0] || null
              if (file && file.size > 2 * 1024 * 1024) {
                setMsg('A logo deve ter no máximo 2 MB.')
                e.target.value = ''
                return
              }
              setMsg('')
              setLogoFile(file)
              if (file) setLogoUrl(URL.createObjectURL(file))
            }} />
            <p className="text-xs text-gray-500">PNG, JPG, WEBP ou SVG. Máximo de 2 MB.</p>
            {logoUrl && <button type="button" className="text-xs text-red-600 underline" onClick={() => { setLogoUrl(''); setLogoFile(null) }}>Remover logo personalizada</button>}
          </div>
        </div>
      </div>
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-900">Plano e contato</h4>
        <p className="text-xs text-gray-500">Essas informações aparecem na página inicial e nos avisos de teste/vencimento.</p>
        <label className="block text-sm">Nome do plano<input className={cls + ' mt-1'} value={plat.plan_name} readOnly /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">Preço mensal (R$)<input className={cls + ' mt-1'} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} /></label>
          <label className="block text-sm">Dias de teste (novas lojas)<input className={cls + ' mt-1'} type="number" min="0" value={trial} onChange={e => setTrial(e.target.value)} /></label>
        </div>
        <label className="block text-sm">WhatsApp de contato/cobrança (com DDD)<input className={cls + ' mt-1'} inputMode="tel" value={wa} onChange={e => setWa(e.target.value)} placeholder="47999999999" /></label>
      </div>
      {msg && <p className={\`text-sm \${msg.includes('sucesso') ? 'text-green-700' : 'text-red-600'}\`}>{msg}</p>}
      <button disabled={busy} className="bg-gray-900 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2.5 text-sm">{busy ? 'Salvando…' : 'Salvar identidade e configurações'}</button>
    </form>
  )
}

export default function SuperAdmin() {
  const [phase, setPhase] = useState('loading')
  const [stores, setStores] = useState([])
  const [plat, setPlat] = useState(null)
  const [tab, setTab] = useState('stores')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return setPhase('auth')
    const { data: isSuper } = await supabase.rpc('is_super_admin')
    if (!isSuper) return setPhase('denied')
    const [st, pl] = await Promise.all([
      supabase.rpc('admin_list_stores'),
      supabase.from('platform_settings').select('*').eq('id', 'main').maybeSingle(),
    ])
    if (st.error) setError(st.error.message)
    setStores(st.data || [])
    setPlat(pl.data || { plan_name: 'Plano', price_cents: 0, trial_days: 7, contact_whatsapp: '' })
    setPhase('ready')
  }, [])

  useEffect(() => {
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') load() })
    return () => subscription.unsubscribe()
  }, [load])

  const logout = async () => { try { await supabase.auth.signOut() } catch {} ; setPhase('auth') }

  if (phase === 'loading') return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Carregando…</div>
  if (phase === 'auth' || phase === 'denied') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <p className="text-center font-extrabold text-[#782d25] text-xl mb-4">{BRAND} · Super admin</p>
          {phase === 'denied' && <p className="text-sm text-red-600 mb-3">Esta conta não tem acesso de super admin.{' '}<button className="underline" onClick={logout}>Sair</button></p>}
          {phase === 'auth' && <LoginForm title="Entrar" subtitle="Acesso restrito à administração da plataforma" onDone={load} />}
        </div>
      </div>
    )
  }
  const tabs = [['stores', 'Lojas e assinaturas'], ['payments', 'Pagamentos'], ['platform', 'Identidade e plataforma']]
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b px-4 sm:px-6 h-14 flex items-center justify-between">
        <span className="font-extrabold text-[#782d25]">{plat?.logo_url ? <img src={plat.logo_url} alt="Logo do sistema" className="inline-block w-7 h-7 object-contain mr-2 align-middle" /> : null}{plat?.system_name || BRAND} <span className="text-gray-400 font-medium text-sm">· Super admin</span></span>
        <div className="flex gap-2 text-xs"><a href="/painel" className={btn}>Meu painel</a><button onClick={logout} className={btn}>Sair</button></div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${tab === id ? 'bg-gray-900 text-white' : 'bg-white border'}`}>{label}</button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {tab === 'stores' && <StoresTab stores={stores} plat={plat} reload={load} />}
        {tab === 'payments' && <PaymentsTab stores={stores} />}
        {tab === 'platform' && <PlatformTab plat={plat} reload={load} />}
      </main>
    </div>
  )
}
