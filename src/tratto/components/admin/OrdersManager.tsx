// @ts-nocheck -- código original migrado sem alterações de lógica
import { formatOrderNumber } from '../../orderNumber'
import { businessDayStart, isArchived } from '../../orderArchive'
import { useEffect, useState } from 'react'
import { Clock3, ChefHat, Truck, CheckCircle2, XCircle, X, Printer } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { Order } from '../../types'
import { money } from '../../format'

function OrdersManager() {
  const { orders, updateOrderStatus, deleteOrder, config } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'board' | 'history'>('board')
  const [limits, setLimits] = useState<Record<string, number>>({})
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(t) }, [])
  // dia da loja = 24 h corridas a partir do horário de abertura; encerrados mais antigos vão para o histórico
  const dayStart = businessDayStart(config, now)
  const boardOrders = orders.filter(o => !isArchived(o, dayStart))
  const archivedOrders = orders.filter(o => isArchived(o, dayStart))
  const removeOrder = async (order: Order) => {
    if (!window.confirm(`Excluir o pedido ${formatOrderNumber(order)} de ${order.customerName || 'cliente'}? Essa ação não pode ser desfeita.`)) return
    if (await deleteOrder(order.id)) setSelectedId(prev => (prev === order.id ? null : prev))
  }
  const COLUMN_LIMIT = 10
  const PAGE_SIZE = 20
  const q = query.trim().toLowerCase()
  const historyOrders = archivedOrders.filter(o => {
    if (dateFilter && new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) !== dateFilter) return false
    if (!q) return true
    return [formatOrderNumber(o), o.id, o.customerName, o.customerPhone].some(v => String(v || '').toLowerCase().includes(q))
  })
  const pageCount = Math.max(1, Math.ceil(historyOrders.length / PAGE_SIZE))
  const pageOrders = historyOrders.slice((Math.min(page, pageCount) - 1) * PAGE_SIZE, Math.min(page, pageCount) * PAGE_SIZE)
  const selectedOrder = orders.find(o => o.id === selectedId) || null
  const setSelectedOrder = (o: Order | null) => setSelectedId(o ? o.id : null)
  const pipelineStatuses: Order['status'][] = ['pending', 'preparing', 'delivering', 'completed', 'cancelled']
  const [printOrder, setPrintOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!printOrder) return
    const timer = window.setTimeout(() => window.print(), 250)
    const afterPrint = () => setPrintOrder(null)
    window.addEventListener('afterprint', afterPrint)
    return () => { window.clearTimeout(timer); window.removeEventListener('afterprint', afterPrint) }
  }, [printOrder])

  const statusFlow: Order['status'][] = ['pending', 'preparing', 'delivering', 'completed']

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const idx = statusFlow.indexOf(current)
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1]
    return null
  }

  const statusLabels: { [key: string]: string } = {
    pending: 'Pendente',
    preparing: 'Preparando',
    delivering: 'Entregando',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  }

  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    preparing: 'bg-blue-100 text-blue-700 border-blue-300',
    delivering: 'bg-purple-100 text-purple-700 border-purple-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300'
  }

  const statusIcons: { [key: string]: any } = {
    pending: Clock3,
    preparing: ChefHat,
    delivering: Truck,
    completed: CheckCircle2,
    cancelled: XCircle,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <p className="text-gray-500 text-sm">{boardOrders.length} no quadro · {archivedOrders.length} no histórico</p>
      </div>

      <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
        <button onClick={() => setView('board')} className={`rounded-md px-4 py-1.5 ${view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Quadro</button>
        <button onClick={() => setView('history')} className={`rounded-md px-4 py-1.5 ${view === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>Histórico ({archivedOrders.length})</button>
      </div>

      {/* Pipeline: uma coluna por etapa, cards pequenos; clique no card abre os detalhes */}
      {view === 'board' && <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-start">
        {pipelineStatuses.map(status => {
          const allColOrders = boardOrders.filter(o => o.status === status)
          const limit = limits[status] || COLUMN_LIMIT
          const colOrders = allColOrders.slice(0, limit)
          return (
            <div key={status} className="rounded-xl bg-gray-50 border border-gray-200 flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-200">
                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColors[status]}`}>
                  <StatusIcon icon={statusIcons[status]} size={14} /> {statusLabels[status]}
                </span>
                <span className="text-xs font-bold text-gray-500">{allColOrders.length}</span>
              </div>
              <div className="space-y-2 p-2 min-h-[80px]">
                {colOrders.map(order => {
                  const next = getNextStatus(order.status)
                  const total = order.total + order.deliveryFee - (order.discount || 0)
                  return (
                    <div
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(order.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(order.id) } }}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition hover:border-red-300 hover:shadow"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-gray-800">{formatOrderNumber(order)}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            type="button"
                            title="Excluir pedido"
                            aria-label={`Excluir pedido ${formatOrderNumber(order)}`}
                            onClick={e => { e.stopPropagation(); void removeOrder(order) }}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-700">{order.customerName}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-green-700">{money(total)}</span>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          {order.deliveryType === 'pickup' ? 'Retirada' : order.deliveryType === 'delivery' ? 'Entrega' : ''}
                        </span>
                      </div>
                      {order.scheduledDate && (
                        <p className="mt-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                          🗓️ {order.scheduledDate.split('-').reverse().slice(0, 2).join('/')} {order.scheduledTime}
                        </p>
                      )}
                      {next && (
                        <button
                          onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, next) }}
                          className="mt-2 w-full rounded-md bg-green-500 py-1 text-xs font-medium text-white hover:bg-green-600"
                        >
                          Avançar →
                        </button>
                      )}
                    </div>
                  )
                })}
                {allColOrders.length > colOrders.length && (
                  <button
                    onClick={() => setLimits(prev => ({ ...prev, [status]: limit + COLUMN_LIMIT }))}
                    className="w-full rounded-md border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Ver mais ({allColOrders.length - colOrders.length})
                  </button>
                )}
                {allColOrders.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Nenhum pedido</p>}
              </div>
            </div>
          )
        })}
      </div>}

      {view === 'history' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-xs text-gray-500">Pedidos concluídos ou cancelados antes da última abertura da loja. Nada é apagado.</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Buscar por número, nome ou telefone"
              className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1) }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filtrar por data"
            />
            {(query || dateFilter) && (
              <button onClick={() => { setQuery(''); setDateFilter(''); setPage(1) }} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">Limpar</button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {pageOrders.map(order => (
              <button key={order.id} onClick={() => setSelectedId(order.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-gray-50">
                <span className="w-16 shrink-0 text-sm font-bold text-gray-800">{formatOrderNumber(order)}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{order.customerName}</span>
                <span className="hidden text-xs text-gray-400 sm:block">{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span className="text-sm font-bold text-green-700">{money(order.total + order.deliveryFee - (order.discount || 0))}</span>
                <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                  <StatusIcon icon={statusIcons[order.status]} size={13} /> {statusLabels[order.status]}
                </span>
              </button>
            ))}
            {pageOrders.length === 0 && <p className="py-8 text-center text-sm text-gray-400">Nenhum pedido no histórico</p>}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-40">← Anterior</button>
              <span className="text-gray-500">Página {Math.min(page, pageCount)} de {pageCount}</span>
              <button disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-40">Próxima →</button>
            </div>
          )}
        </div>
      )}

      {printOrder && (
        <div id="order-receipt-print" className="hidden">
          <style>{`
            @page { size: 80mm auto; margin: 4mm; }
            @media print {
              body * { visibility: hidden !important; }
              #order-receipt-print, #order-receipt-print * { visibility: visible !important; }
              #order-receipt-print { display: block !important; position: absolute; left: 0; top: 0; width: 72mm; color: #000; background: #fff; font: 11px/1.4 Arial, sans-serif; }
              .receipt-logo { display: block; max-width: 42mm; max-height: 20mm; object-fit: contain; margin: 0 auto 5px; }
              .receipt-center { text-align: center; }
              .receipt-line { border-top: 1px dashed #555; margin: 7px 0; }
              .receipt-row { display: flex; justify-content: space-between; gap: 8px; }
              .receipt-items { margin: 7px 0; }
              .receipt-small { font-size: 9px; }
            }
          `}</style>
          <div className="receipt-center">
            {config.logoUrl && <img className="receipt-logo" src={config.logoUrl} alt="Logo da loja" />}
            <strong style={{ fontSize: '15px' }}>{config.name || 'Minha Loja'}</strong>
            {config.subtitle && <div>{config.subtitle}</div>}
            {config.address && <div>{config.address}</div>}
            {config.phone && <div>Telefone: {config.phone}</div>}
            <div className="receipt-line" />
            <strong>COMPROVANTE DE VENDA</strong>
            <div>Pedido: {formatOrderNumber(printOrder)}</div>
            <div>{new Date(printOrder.createdAt).toLocaleString('pt-BR')}</div>
          </div>
          <div className="receipt-line" />
          <div><strong>Cliente:</strong> {printOrder.customerName}</div>
          <div><strong>Telefone:</strong> {printOrder.customerPhone}</div>
          <div><strong>Endereço:</strong> {printOrder.deliveryType === 'pickup' ? 'Retirada no local' : (printOrder.customerAddress || 'Não informado')}</div>
          <div><strong>Pagamento:</strong> {printOrder.paymentMethod === 'pix' ? 'Pix' : printOrder.paymentMethod === 'cash' ? 'Dinheiro' : printOrder.paymentMethod === 'card' ? 'Cartão' : 'Não informado'}</div>
          {printOrder.changeFor ? <div><strong>Troco para:</strong> {money(printOrder.changeFor)}</div> : null}
          <div className="receipt-line" />
          <div className="receipt-row"><strong>QTD / PRODUTO</strong><strong>VALOR</strong></div>
          <div className="receipt-items">
            {printOrder.items.map((item, index) => {
              const extras = (item.selectedAddOns || []).reduce((sum, addon) => sum + Number(addon.price || 0), 0)
              const unit = Number(item.product.price || 0) + extras
              return <div key={index} style={{ marginBottom: '5px' }}>
                <div>{item.quantity}x {item.product.name}</div>
                {(item.selectedAddOns || []).map(addon => <div key={addon.id} className="receipt-small"> + {addon.name}</div>)}
                {item.observation && <div className="receipt-small">Obs.: {item.observation}</div>}
                <div className="receipt-row"><span>{item.quantity} x {money(unit)}</span><span>{money(unit * item.quantity)}</span></div>
              </div>
            })}
          </div>
          <div className="receipt-line" />
          <div className="receipt-row"><span>Subtotal</span><span>{money(Number(printOrder.total || 0))}</span></div>
          <div className="receipt-row"><span>Taxa de entrega</span><span>{money(Number(printOrder.deliveryFee || 0))}</span></div>
          {Number(printOrder.discount || 0) > 0 && <div className="receipt-row"><span>Desconto</span><span>- {money(Number(printOrder.discount))}</span></div>}
          <div className="receipt-line" />
          <div className="receipt-row" style={{ fontSize: '14px', fontWeight: 700 }}><span>TOTAL</span><span>{money(Number(printOrder.total || 0) + Number(printOrder.deliveryFee || 0) - Number(printOrder.discount || 0))}</span></div>
          {printOrder.notes && <div style={{ marginTop: '8px' }}><strong>Observações:</strong> {printOrder.notes}</div>}
          <div className="receipt-line" />
          <div className="receipt-center receipt-small">Obrigado pela preferência!</div>
          <div className="receipt-center receipt-small">Comprovante não fiscal</div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Pedido {formatOrderNumber(selectedOrder)}</h3>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" aria-label="Fechar"><X size={16} /></button>
              </div>

              <div className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium border mb-4 ${statusColors[selectedOrder.status]}`}>
                <StatusIcon icon={statusIcons[selectedOrder.status]} /> {statusLabels[selectedOrder.status]}
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                </div>
                {selectedOrder.scheduledDate && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs text-purple-700">Pedido agendado para</p>
                    <p className="font-bold text-purple-900">{selectedOrder.scheduledDate.split('-').reverse().join('/')} às {selectedOrder.scheduledTime}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{selectedOrder.deliveryType === 'pickup' ? 'Retirada' : 'Endereço de entrega'}</p>
                  {selectedOrder.deliveryType === 'pickup' ? (
                    <p className="font-medium text-sm">Cliente retira no local</p>
                  ) : (
                    <p className="font-medium text-sm">{selectedOrder.customerAddress}</p>
                  )}
                </div>
                {(selectedOrder.paymentMethod || selectedOrder.deliveryType) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Pagamento</p>
                    <p className="font-medium text-sm">
                      {selectedOrder.paymentMethod === 'card' ? 'Cartão' :
                       selectedOrder.paymentMethod === 'pix' ? 'PIX' :
                       selectedOrder.paymentMethod === 'cash' ? 'Dinheiro' : 'Não informado'}
                      {selectedOrder.changeFor ? ` — troco para ${money(selectedOrder.changeFor)}` : ''}
                    </p>
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-gray-800 mb-2">Itens do pedido</h4>
              <div className="space-y-2 mb-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.quantity}x {item.product.name}</p>
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <p className="text-xs text-gray-500">
                          + {item.selectedAddOns.map(a => `${a.name} (+${money(a.price)})`).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{money(item.product.price + (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0))} cada</p>
                    </div>
                    <span className="font-semibold text-sm">{money((item.product.price + (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{money(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span>{money(selectedOrder.deliveryFee)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Desconto{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}</span>
                    <span>- {money(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-700">{money(selectedOrder.total + selectedOrder.deliveryFee - (selectedOrder.discount || 0))}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                    className="flex-1 min-w-[150px] bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm"
                  >
                    Avançar para {statusLabels[getNextStatus(selectedOrder.status)!]}
                  </button>
                )}
                <button
                  onClick={() => setPrintOrder(selectedOrder)}
                  className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm"
                >
                  <Printer size={16} /> Imprimir
                </button>
                <button
                  onClick={() => void removeOrder(selectedOrder)}
                  className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm"
                >
                  Excluir
                </button>
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => { if (window.confirm('Cancelar este pedido?')) updateOrderStatus(selectedOrder.id, 'cancelled') }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg text-sm"
                  >
                    Cancelar pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ icon: Icon, size = 16 }: { icon: any; size?: number }) {
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" className="shrink-0" />
}

export default OrdersManager
