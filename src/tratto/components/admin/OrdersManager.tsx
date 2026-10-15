// @ts-nocheck -- código original migrado sem alterações de lógica
import { formatOrderNumber } from '../../orderNumber'
import { useEffect, useState } from 'react'
import { Clock3, ChefHat, Truck, CheckCircle2, XCircle, X, Printer } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { Order } from '../../types'
import { money } from '../../format'

function OrdersManager() {
  const { orders, updateOrderStatus, config } = useStore()
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [printOrder, setPrintOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!printOrder) return
    const timer = window.setTimeout(() => window.print(), 250)
    const afterPrint = () => setPrintOrder(null)
    window.addEventListener('afterprint', afterPrint)
    return () => { window.clearTimeout(timer); window.removeEventListener('afterprint', afterPrint) }
  }, [printOrder])

  const filteredOrders = orders.filter(o => !filterStatus || o.status === filterStatus)

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

  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <p className="text-gray-500 text-sm">{orders.length} pedidos no total</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
            className={`rounded-xl border p-3 text-center transition-all ${
              filterStatus === status ? 'ring-2 ring-red-500 border-red-300' : 'border-gray-200'
            } bg-white hover:shadow-sm`}
          >
            <span className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f2] text-[#d9273f]"><StatusIcon icon={statusIcons[status]} /></span>
            <p className="text-lg font-bold text-gray-800 mt-1">{count}</p>
            <p className="text-xs text-gray-500">{statusLabels[status]}</p>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            !filterStatus ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Todos
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              filterStatus === key ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-bold text-gray-800">{formatOrderNumber(order)}</span>
                  {(order.source === 'manual' || order.orderType === 'balcao') && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Balcão</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                    <StatusIcon icon={statusIcons[order.status]} /> {statusLabels[order.status]}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Cliente</p>
                    <p className="font-medium text-gray-800">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Telefone</p>
                    <p className="font-medium text-gray-800">{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="font-bold text-green-700">{money(order.total + order.deliveryFee - (order.discount || 0))}</p>
                  </div>
                </div>
                {(order.deliveryType || order.paymentMethod) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {order.scheduledDate && (
                      <span className="px-2 py-1 rounded-full font-bold bg-purple-100 text-purple-800">
                        🗓️ Agendado: {order.scheduledDate.split('-').reverse().slice(0, 2).join('/')} {order.scheduledTime}
                      </span>
                    )}
                    {order.deliveryType && (
                      <span className={`px-2 py-1 rounded-full font-medium ${order.deliveryType === 'pickup' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {order.deliveryType === 'pickup' ? 'Retirada no local' : 'Entrega'}
                      </span>
                    )}
                    {order.paymentMethod && (
                      <span className="px-2 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                        {order.paymentMethod === 'card' ? 'Cartão' : order.paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}
                        {order.changeFor ? ` (troco p/ ${money(order.changeFor)})` : ''}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-2">
                  <p className="text-gray-500 text-xs">Itens: {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPrintOrder(order)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg"
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg"
                >
                  Detalhes
                </button>
                {getNextStatus(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium"
                  >
                    Avançar →
                  </button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          
          <p>Nenhum pedido encontrado</p>
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
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Pedido {formatOrderNumber(selectedOrder)}</h3>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"></button>
              </div>

              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-4 ${statusColors[selectedOrder.status]}`}>
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

              <div className="flex gap-2 mt-4">
                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)
                      setSelectedOrder({ ...selectedOrder, status: getNextStatus(selectedOrder.status)! })
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm"
                  >
                    Avançar para {statusLabels[getNextStatus(selectedOrder.status)!]}
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

function StatusIcon({ icon: Icon }: { icon: any }) {
  return <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
}

export default OrdersManager
