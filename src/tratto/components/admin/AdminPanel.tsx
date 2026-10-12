// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState } from 'react'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, FolderOpen, MapPinned, TicketPercent, Megaphone, Settings } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import Dashboard from './Dashboard'
import ProductsManager from './ProductsManager'
import CategoriesManager from './CategoriesManager'
import OrdersManager from './OrdersManager'
import SettingsPanel from './SettingsPanel'
import DeliveryPanel from './DeliveryPanel'
import MarketingPanel from './MarketingPanel'
import CouponsManager from './CouponsManager'

type AdminTab = 'dashboard' | 'orders' | 'products' | 'categories' | 'delivery' | 'marketing' | 'coupons' | 'settings'

const tabs = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders' as const, label: 'Pedidos', icon: ClipboardList },
  { id: 'products' as const, label: 'Produtos', icon: UtensilsCrossed },
  { id: 'categories' as const, label: 'Categorias', icon: FolderOpen },
  { id: 'delivery' as const, label: 'Entrega', icon: MapPinned },
  { id: 'coupons' as const, label: 'Cupons', icon: TicketPercent },
  { id: 'marketing' as const, label: 'Marketing', icon: Megaphone },
  { id: 'settings' as const, label: 'Configurações', icon: Settings },
]

function AdminPanel() {
  const { orders } = useStore()
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-40 md:hidden w-12 h-12 bg-[#d9273f] text-white rounded-full shadow-lg flex items-center justify-center" aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        <span className="text-xs font-semibold tracking-wide">{sidebarOpen ? 'FECHAR' : 'MENU'}</span>
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#f4d6db] shadow-lg md:shadow-none
        transform transition-transform duration-200 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-14 md:pt-0
      `}>
        <div className="p-4">
          <h2 className="text-lg font-bold text-[#2f241f] mb-1">Painel Admin</h2>
          <p className="text-xs text-[#75636a] mb-6">Gerencie seu restaurante</p>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#fff0f2] text-[#d9273f] border border-[#ffc6cf] shadow-sm'
                    : 'text-[#51444a] hover:bg-[#fff0f2] hover:text-[#d9273f]'
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${activeTab === tab.id ? "bg-[#d9273f] text-white" : "text-[#6b6265] group-hover:bg-[#fff0f2] group-hover:text-[#d9273f]"}`}><tab.icon size={19} strokeWidth={1.8} /></span>
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.id === 'orders' && pendingOrdersCount > 0 && (
                  <span
                    aria-label={pendingOrdersCount + (pendingOrdersCount === 1 ? ' pedido novo' : ' pedidos novos')}
                    className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#d9273f] px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
                  >
                    {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'delivery' && <DeliveryPanel />}
        {activeTab === 'coupons' && <CouponsManager />}
        {activeTab === 'marketing' && <MarketingPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default AdminPanel
