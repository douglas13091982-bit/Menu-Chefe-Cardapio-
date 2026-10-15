// @ts-nocheck
import { formatOrderNumber } from '../../orderNumber'
import { useMemo, useState } from 'react'
import { Minus, Plus, Search, ShoppingBag, UserRound, Phone, CreditCard, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { money } from '../../format'


function ManualOrder() {
  const { products, categories, addOrder } = useStore()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const availableProducts = products.filter(p => p.available !== false)
  const filteredProducts = availableProducts.filter(p => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    const category = categories.find(c => c.id === p.categoryId)?.name || ''
    return p.name.toLowerCase().includes(term) || category.toLowerCase().includes(term)
  })
  const cartItems = useMemo(() => Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find(p => p.id === id), quantity }))
    .filter(item => item.product && item.quantity > 0), [cart, products])
  const total = cartItems.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0)

  const changeQuantity = (productId, delta) => {
    setSuccess('')
    setCart(prev => {
      const next = { ...prev }
      const quantity = Math.max(0, (next[productId] || 0) + delta)
      if (quantity === 0) delete next[productId]
      else next[productId] = quantity
      return next
    })
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!customerName.trim()) return setError('Informe o nome do cliente.')
    if (!customerPhone.trim()) return setError('Informe o telefone do cliente.')
    if (!cartItems.length) return setError('Adicione pelo menos um produto ao pedido.')
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const orderId = 'BAL-' + Date.now().toString().slice(-8)
      const order = {
        id: orderId,
        items: cartItems.map(({ product, quantity }) => ({ product, quantity, observation: '' })),
        total,
        deliveryFee: 0,
        status: 'pending',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: '',
        deliveryType: 'pickup',
        paymentMethod,
        createdAt: now,
        updatedAt: now,
        source: 'manual',
        orderType: 'balcao',
        notes: notes.trim()
      }
      const ok = await addOrder(order)
      if (!ok) { setError('Não foi possível registrar o pedido. Tente novamente.'); return }
      setCart({})
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')
      setSearch('')
      setSuccess('Pedido de balcão ' + formatOrderNumber(order) + ' registrado e enviado para a lista de pedidos.')
    } catch (e) {
      setError('Não foi possível registrar o pedido. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido manual</h1>
          <p className="mt-1 text-sm text-gray-500">Registre uma venda feita diretamente no balcão.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          <ShoppingBag size={17} /> Venda no balcão
        </span>
      </div>

      {success && <div role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{success}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submitOrder} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><UserRound size={18} className="text-gray-500" /><h2 className="font-semibold text-gray-900">Dados do cliente</h2></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">Nome do cliente
                <input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome completo" className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
              </label>
              <label className="block text-sm font-medium text-gray-700">Telefone
                <span className="relative mt-1.5 block"><Phone size={16} className="absolute left-3 top-3 text-gray-400" /><input required type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 font-normal outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" /></span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-semibold text-gray-900">Produtos</h2><p className="mt-1 text-xs text-gray-500">Selecione os itens e ajuste as quantidades.</p></div>
              <label className="relative block w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-2.5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto ou categoria" className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-red-400" /></label>
            </div>
            {filteredProducts.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredProducts.map(product => {
                const quantity = cart[product.id] || 0
                const category = categories.find(c => c.id === product.categoryId)?.name
                return <div key={product.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${quantity ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                  {product.image ? <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-gray-100 object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><ShoppingBag size={20} /></div>}
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-800">{product.name}</p>{category && <p className="truncate text-xs text-gray-500">{category}</p>}<p className="mt-1 text-sm font-bold text-gray-900">{money(product.price)}</p></div>
                  <div className="flex shrink-0 items-center gap-2">
                    {quantity > 0 && <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label={`Diminuir ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-100"><Minus size={15} /></button>}
                    {quantity > 0 && <span className="w-4 text-center text-sm font-semibold">{quantity}</span>}
                    <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label={`Adicionar ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d9273f] text-white hover:bg-[#b91f34]"><Plus size={16} /></button>
                  </div>
                </div>
              })}
            </div> : <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">{availableProducts.length ? 'Nenhum produto encontrado.' : 'Cadastre produtos disponíveis antes de registrar uma venda.'}</div>}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 font-semibold text-gray-900">Resumo do pedido</h2>
            {cartItems.length ? <div className="mb-4 space-y-3">
              {cartItems.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-3 text-sm"><span className="min-w-0 text-gray-600">{quantity}× {product.name}</span><span className="shrink-0 font-medium text-gray-900">{money(product.price * quantity)}</span></div>)}
            </div> : <p className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Nenhum produto selecionado ainda.</p>}
            <div className="border-t border-gray-200 pt-3"><div className="flex items-center justify-between"><span className="font-medium text-gray-600">Total</span><span className="text-2xl font-bold text-gray-900">{money(total)}</span></div><p className="mt-1 text-xs text-gray-500">Sem taxa de entrega (retirada no balcão).</p></div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><CreditCard size={18} className="text-gray-500" /><h2 className="font-semibold text-gray-900">Forma de pagamento</h2></div>
            <div className="space-y-2">
              {[{ value: 'pix', label: 'Pix', hint: 'Pagamento instantâneo' }, { value: 'cash', label: 'Dinheiro', hint: 'Pagamento em espécie' }, { value: 'card', label: 'Cartão', hint: 'Débito ou crédito' }].map(method => <label key={method.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${paymentMethod === method.value ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}><input type="radio" name="paymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="accent-[#d9273f]" /><span className="flex-1"><span className="block text-sm font-medium text-gray-800">{method.label}</span><span className="block text-xs text-gray-500">{method.hint}</span></span></label>)}
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700">Observações (opcional)
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Ex.: sem cebola, pedido para retirada..." className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal outline-none focus:border-red-400" />
            </label>
            <button type="submit" disabled={saving || cartItems.length === 0 || !customerName.trim() || !customerPhone.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d9273f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b91f34] disabled:cursor-not-allowed disabled:bg-gray-300">
              <CheckCircle2 size={17} />{saving ? 'Registrando pedido...' : 'Registrar pedido'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">O pedido será salvo como pendente na lista de pedidos.</p>
          </section>
        </div>
      </form>
    </div>
  )
}

export default ManualOrder
