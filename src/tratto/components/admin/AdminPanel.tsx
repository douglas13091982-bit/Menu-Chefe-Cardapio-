// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState } from 'react'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, FolderOpen, MapPinned, TicketPercent, Megaphone, Settings, Menu, X } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-40 md:hidden w-12 h-12 bg-[#782d25] text-white rounded-full shadow-lg flex items-center justify-center" aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#fffdfa] border-r border-[#eee4da] shadow-lg md:shadow-none
        transform transition-transform duration-200 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-14 md:pt-0
      `}>
        <div className="p-4">
          <h2 className="text-lg font-bold text-[#30231e] mb-1">Painel Admin</h2>
          <p className="text-xs text-[#89796f] mb-6">Gerencie seu restaurante</p>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#f7ece6] text-[#782d25] border border-[#e8d0c3] shadow-sm'
                    : 'text-[#65564e] hover:bg-[#f8f0e9] hover:text-[#782d25]'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activeTab === tab.id ? "bg-[#782d25] text-white" : "bg-[#f5eee7] text-[#80695d]"}`}><tab.icon size={17} strokeWidth={1.8} /></span>
                <span>{tab.label}</span>
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
