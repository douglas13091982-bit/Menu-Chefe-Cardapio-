// @ts-nocheck
import { useEffect, useMemo, useState, useCallback } from 'react'
import { errorPt } from '@/lib/errors-pt'
import { supabase } from '@/integrations/supabase/client'
import LoginForm from './LoginForm'
import { BRAND } from './brand'
import { fetchPlatformSettingsAdmin } from '../services/platform'
import { compressImageToWebP } from '@/lib/image-compress'
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
    if (error) return setErr(errorPt(error))
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
    if (error) return setErr(errorPt(error))
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

  const run = async (p) => { const { error } = await p; if (error) setMsg(errorPt(error)); else { setMsg(''); reload() } }
  const suspend = (s) => run(supabase.from('stores').update({ status: 'suspended' }).eq('id', s.id))
  const reactivate = (s) => {
    const paid = s.paid_until && new Date(s.paid_until) > new Date()
    return run(supabase.from('stores').update(paid
      ? { status: 'active' }
      : { status: 'trial', trial_ends_at: new Date(Date.now() + (plat.trial_days || 7) * 86400000).toISOString() }).eq('id', s.id))
  }
  const extendTrial = (s) => {
    const base = Math.max(Date.now(), s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0)
    return run(supabase.from('stores').update({ status: 'trial', trial_ends_at: new Date(base + (plat.trial_days || 7) * 86400000).toISOString() }).eq('id', s.id))
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

      {(() => {
        const soon = rows.map(s => ({ s, st: effectiveStatus(s), end: s.status === 'trial' ? s.trial_ends_at : s.paid_until }))
          .filter(x => (x.st === 'trial' || x.st === 'active') && x.end && daysLeft(x.end) <= 5)
          .sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime())
        if (!soon.length) return null
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-900">Vencendo nos próximos 5 dias ({soon.length})</p>
            <ul className="mt-2 text-sm text-amber-900 space-y-1">
              {soon.map(({ s, st, end }) => <li key={s.id}><b>{s.name}</b> — {st === 'trial' ? 'teste' : 'assinatura'} termina em {fmtDate(end)} ({Math.max(0, daysLeft(end))} dia(s)){s.owner_email ? ' · ' + s.owner_email : ''}</li>)}
            </ul>
          </div>
        )
      })()}

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
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState(plat.hero_background_url || '')
  const [heroBackgroundFile, setHeroBackgroundFile] = useState(null)
  const [price, setPrice] = useState((plat.price_cents / 100).toFixed(2).replace('.', ','))
  const [trial, setTrial] = useState(plat.trial_days)
  const [wa, setWa] = useState(plat.contact_whatsapp || '')
  const [pixKey, setPixKey] = useState(plat.pix_key || '')
  const [pixHolder, setPixHolder] = useState(plat.pix_holder || '')
  const [pixCity, setPixCity] = useState(plat.pix_city || '')
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
      const compressed = await compressImageToWebP(logoFile, { maxWidth: 800, maxHeight: 800, quality: 0.85, asBlob: true, fileName: 'system-logo' })
      const path = 'system-logo.webp'
      const { error: uploadError } = await supabase.storage.from('platform-branding').upload(path, compressed.file, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '3600',
      })
      if (uploadError) {
        setBusy(false)
        return setMsg('Não foi possível enviar a logo. Confira se a migração de identidade visual foi aplicada. ' + uploadError.message)
      }
      nextLogoUrl = supabase.storage.from('platform-branding').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
    }
    let nextHeroBackgroundUrl = heroBackgroundUrl
    if (heroBackgroundFile) {
      const compressed = await compressImageToWebP(heroBackgroundFile, { maxWidth: 1920, maxHeight: 1200, quality: 0.82, asBlob: true, fileName: 'system-hero-background' })
      const path = 'system-hero-background.webp'
      const { error: uploadError } = await supabase.storage.from('platform-branding').upload(path, compressed.file, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '3600',
      })
      if (uploadError) {
        setBusy(false)
        return setMsg('Não foi possível enviar a imagem da home. Confira se a migração de identidade visual foi aplicada. ' + uploadError.message)
      }
      nextHeroBackgroundUrl = supabase.storage.from('platform-branding').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
    }
    const { error } = await supabase.from('platform_settings').update({
      system_name: name.trim(),
      logo_url: nextLogoUrl || null,
      hero_background_url: nextHeroBackgroundUrl || null,
      plan_name: plat.plan_name,
      price_cents: cents,
      trial_days: Math.max(0, Number(trial) || 0),
      contact_whatsapp: wa.replace(/\D/g, ''),
      pix_key: pixKey.trim(),
      pix_holder: pixHolder.trim(),
      pix_city: pixCity.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', 'main')
    setBusy(false)
    if (error) return setMsg('Não foi possível salvar. Confira se a migração de identidade visual foi aplicada. ' + error.message)
    setLogoFile(null)
    setHeroBackgroundFile(null)
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Imagem de fundo da primeira seção</label>
        <p className="text-xs text-gray-500">Essa arte aparece como fundo completo da home, atrás do título e dos botões. Prefira uma imagem horizontal 16:9 com a área mais limpa à esquerda.</p>
        <div className="flex flex-col gap-3">
          <div className="w-full aspect-[16/6] rounded-xl border border-gray-200 bg-gray-900 overflow-hidden">
            {heroBackgroundUrl
              ? <img src={heroBackgroundUrl} alt="Prévia do fundo da primeira seção" className="w-full h-full object-cover" />
              : <span className="h-full flex items-center justify-center text-xs text-gray-400">Usando a imagem padrão da home</span>}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" className={cls} onChange={e => {
            const file = e.target.files?.[0] || null
            if (file && file.size > 10 * 1024 * 1024) {
              setMsg('A imagem da home deve ter no máximo 10 MB.')
              e.target.value = ''
              return
            }
            setMsg('')
            setHeroBackgroundFile(file)
            if (file) setHeroBackgroundUrl(URL.createObjectURL(file))
          }} />
          <p className="text-xs text-gray-500">PNG, JPG ou WEBP. Máximo de 10 MB. Salve as configurações para publicar.</p>
          {heroBackgroundUrl && <button type="button" className="w-fit text-xs text-red-600 underline" onClick={() => { setHeroBackgroundUrl(''); setHeroBackgroundFile(null) }}>Usar imagem padrão da home</button>}
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
        <h4 className="font-semibold text-sm text-gray-900 pt-2">Pix para receber as mensalidades</h4>
        <p className="text-xs text-gray-500">Aparece para a loja na tela de teste/assinatura vencida, com botão "Pix copia e cola" já com o valor.</p>
        <label className="block text-sm">Chave Pix (CPF/CNPJ, e-mail, celular ou aleatória)<input className={cls + ' mt-1'} value={pixKey} onChange={e => setPixKey(e.target.value)} /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">Nome do recebedor<input className={cls + ' mt-1'} maxLength={25} value={pixHolder} onChange={e => setPixHolder(e.target.value)} placeholder="Como aparece no banco" /></label>
          <label className="block text-sm">Cidade<input className={cls + ' mt-1'} maxLength={15} value={pixCity} onChange={e => setPixCity(e.target.value)} placeholder="Joinville" /></label>
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.includes('sucesso') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}
      <button disabled={busy} className="bg-gray-900 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2.5 text-sm">{busy ? 'Salvando…' : 'Salvar identidade e configurações'}</button>
    </form>
  )
}


function ImageMigrationTab() {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ scanned: 0, converted: 0, skipped: 0, failed: 0, originalBytes: 0, finalBytes: 0 })
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const migrate = async () => {
    if (busy) return
    const confirmed = confirm('Converter as imagens antigas dos produtos de todas as lojas acessíveis para WebP? A rotina atualiza apenas a imagem dentro dos dados do produto, preserva os demais campos e pode ser executada novamente para continuar.')
    if (!confirmed) return
    setBusy(true)
    setMessage('Iniciando leitura dos produtos…')
    setErrors([])
    setProgress({ scanned: 0, converted: 0, skipped: 0, failed: 0, originalBytes: 0, finalBytes: 0 })

    const totals = { scanned: 0, converted: 0, skipped: 0, failed: 0, originalBytes: 0, finalBytes: 0 }
    const errorList: string[] = []
    const pageSize = 25
    let offset = 0
    let stop = false

    try {
      while (!stop) {
        const { data: rows, error } = await supabase
          .from('products')
          .select('store_id,id,data')
          .order('store_id', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (error) throw new Error('Não foi possível listar os produtos. Verifique as permissões do super admin: ' + error.message)
        if (!rows?.length) break

        for (const row of rows) {
          totals.scanned++
          try {
            const product = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
            const image = product?.image
            if (typeof image !== 'string' || !image.trim()) {
              totals.skipped++
              errorList.push('Produto ' + row.id + ': campo de imagem vazio ou não encontrado em data.image.')
              continue
            }
            if (/^data:image\/webp(?:;|,)/i.test(image)) {
              totals.skipped++
              continue
            }

            // Aceita imagens em base64 e URLs acessíveis pelo navegador.
            // URLs externas sem CORS serão registradas como falha, em vez de ignoradas silenciosamente.
            let response: Response
            try {
              response = await fetch(image)
            } catch (fetchErr: any) {
              totals.failed++
              errorList.push('Produto ' + row.id + ': não foi possível baixar a imagem para conversão (URL externa/CORS ou endereço indisponível).')
              continue
            }
            if (!response.ok) {
              totals.failed++
              errorList.push('Produto ' + row.id + ': a imagem respondeu HTTP ' + response.status + '.')
              continue
            }
            const blob = await response.blob()
            if (!blob.type.startsWith('image/') || blob.size === 0 || blob.size > 15 * 1024 * 1024) {
              totals.failed++
              errorList.push('Produto ' + row.id + ': formato não reconhecido como imagem ou arquivo acima de 15 MB.')
              continue
            }

            const compressed = await compressImageToWebP(blob, {
              maxWidth: 1200,
              maxHeight: 1200,
              quality: 0.8,
            })
            const output = compressed.dataUrl
            if (!output || !/^data:image\/webp(?:;|,)/i.test(output)) {
              totals.failed++
              errorList.push('Produto ' + row.id + ': o navegador não gerou WebP; imagem original mantida.')
            } else {
              const oldBytes = image.startsWith('data:') ? Math.ceil(image.length * 0.75) : blob.size
              const newBytes = Math.ceil(output.length * 0.75)
              // Para URLs remotas, salvar a versão WebP no próprio campo de imagem evita depender
              // do servidor original depois da migração. Só pula quando já é menor de verdade.
              if (newBytes >= oldBytes && image.startsWith('data:')) {
                totals.skipped++
                errorList.push('Produto ' + row.id + ': WebP não ficou menor; imagem original mantida.')
              } else {
                const updatedProduct = { ...product, image: output }
                const { error: updateError } = await supabase
                  .from('products')
                  .update({ data: updatedProduct })
                  .eq('store_id', row.store_id)
                  .eq('id', row.id)
                if (updateError) throw updateError
                totals.converted++
                totals.originalBytes += oldBytes
                totals.finalBytes += newBytes
              }
            }
          } catch (err: any) {
            totals.failed++
            errorList.push('Produto ' + row.id + ': ' + (err?.message || 'falha desconhecida'))
          }
          setProgress({ ...totals })
          if (errorList.length) setErrors(errorList.slice(-8))
        }
        offset += rows.length
        setMessage('Analisados ' + totals.scanned + ' produtos…')
        if (rows.length < pageSize) stop = true
      }

      setProgress({ ...totals })
      setMessage('Concluído. ' + totals.converted + ' imagens convertidas; ' + totals.skipped + ' ignoradas; ' + totals.failed + ' falhas.')
    } catch (err: any) {
      setMessage('Migração interrompida: ' + (err?.message || 'erro inesperado') + '. Você pode executar novamente; imagens já convertidas serão ignoradas.')
    } finally {
      setBusy(false)
    }
  }

  const savedBytes = Math.max(0, progress.originalBytes - progress.finalBytes)
  const formatBytes = (bytes: number) => bytes < 1024 * 1024
    ? Math.round(bytes / 1024) + ' KB'
    : (bytes / (1024 * 1024)).toFixed(2) + ' MB'

  return (
    <section className="bg-white rounded-2xl border p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Otimização das imagens dos cardápios</h2>
        <p className="text-sm text-gray-500 mt-1">Converte imagens antigas armazenadas diretamente nos dados dos produtos para WebP, reduzindo dimensões para até 1200 × 1200 px. Os demais dados do produto não são alterados.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Analisados', progress.scanned],
          ['Convertidos', progress.converted],
          ['Ignorados', progress.skipped],
          ['Falhas', progress.failed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-gray-50 p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      {progress.converted > 0 && (
        <p className="text-sm text-green-700">Redução estimada nas imagens convertidas: {formatBytes(savedBytes)}.</p>
      )}
      {message && <p className="text-sm text-gray-700" role="status">{message}</p>}
      {errors.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm font-semibold text-amber-900">Avisos recentes</p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-amber-900">{errors.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button type="button" onClick={migrate} disabled={busy} className="bg-gray-900 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 text-sm">
          {busy ? 'Convertendo imagens…' : 'Iniciar migração de imagens'}
        </button>
        <p className="text-xs text-gray-500">Processamento em lotes de 25 produtos. WebP existentes são ignorados. URLs são convertidas quando o navegador consegue acessá-las; bloqueios de CORS aparecem em Falhas/Avisos.</p>
      </div>
    </section>
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
      fetchPlatformSettingsAdmin(),
    ])
    if (st.error) setError(errorPt(st.error))
    setStores(st.data || [])
    setPlat(pl || { plan_name: 'Plano', price_cents: 0, trial_days: 7, contact_whatsapp: '' })
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
  const tabs = [['stores', 'Lojas e assinaturas'], ['payments', 'Pagamentos'], ['platform', 'Identidade e plataforma'], ['images', 'Imagens dos cardápios']]
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
        {tab === 'images' && <ImageMigrationTab />}
      </main>
    </div>
  )
}
