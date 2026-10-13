import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { formatBRL } from '../../utils'
import { Order } from '../../types'

function OrdersManager() {
  const { orders, updateOrderStatus } = useStore()
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = orders.filter(o => !filterStatus || o.status === filterStatus)

  const statusFlow: Order['status'][] = ['pending', 'preparing', 'delivering', 'completed']

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const idx = statusFlow.indexOf(current)
    if (idx >= 0 && idx < statusFlow.length - 1) return statusFlow[idx + 1] ?? null
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

  const statusIcons: { [key: string]: string } = {
    pending: '⏳',
    preparing: '👨‍🍳',
    delivering: '🛵',
    completed: '✅',
    cancelled: '❌'
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
            <span className="text-xl">{statusIcons[status]}</span>
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
                  <span className="font-bold text-gray-800">{order.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                    {statusIcons[order.status]} {statusLabels[order.status]}
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
                    <p className="font-bold text-green-700">{formatBRL((order.total + order.deliveryFee))}</p>
                  </div>
                </div>
                {(order.deliveryType || order.paymentMethod) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {order.deliveryType && (
                      <span className={`px-2 py-1 rounded-full font-medium ${order.deliveryType === 'pickup' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {order.deliveryType === 'pickup' ? '🏪 Retirada no local' : '🛵 Entrega'}
                      </span>
                    )}
                    {order.paymentMethod && (
                      <span className="px-2 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                        {order.paymentMethod === 'card' ? '💳 Cartão' : order.paymentMethod === 'pix' ? '📱 PIX' : '💵 Dinheiro'}
                        {order.changeFor ? ` (troco p/ ${formatBRL(order.changeFor)})` : ''}
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
          <span className="text-4xl block mb-2">📋</span>
          <p>Nenhum pedido encontrado</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Pedido {selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">✕</button>
              </div>

              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-4 ${statusColors[selectedOrder.status]}`}>
                {statusIcons[selectedOrder.status]} {statusLabels[selectedOrder.status]}
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{selectedOrder.deliveryType === 'pickup' ? 'Retirada' : 'Endereço de entrega'}</p>
                  {selectedOrder.deliveryType === 'pickup' ? (
                    <p className="font-medium text-sm">🏪 Cliente retira no local</p>
                  ) : (
                    <p className="font-medium text-sm">{selectedOrder.customerAddress}</p>
                  )}
                </div>
                {(selectedOrder.paymentMethod || selectedOrder.deliveryType) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Pagamento</p>
                    <p className="font-medium text-sm">
                      {selectedOrder.paymentMethod === 'card' ? '💳 Cartão' :
                       selectedOrder.paymentMethod === 'pix' ? '📱 PIX' :
                       selectedOrder.paymentMethod === 'cash' ? '💵 Dinheiro' : 'Não informado'}
                      {selectedOrder.changeFor ? ` — troco para ${formatBRL(selectedOrder.changeFor)}` : ''}
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
                          + {item.selectedAddOns.map(a => `${a.name} (+${formatBRL(a.price)})`).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{formatBRL((item.product.price + (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0)))} cada</p>
                    </div>
                    <span className="font-semibold text-sm">{formatBRL(((item.product.price + (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity))}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatBRL(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span>{formatBRL(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-700">{formatBRL((selectedOrder.total + selectedOrder.deliveryFee))}</span>
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

export default OrdersManager
