import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import Dashboard from './Dashboard'
import ProductsManager from './ProductsManager'
import CategoriesManager from './CategoriesManager'
import OrdersManager from './OrdersManager'
import SettingsPanel from './SettingsPanel'
import DeliveryPanel from './DeliveryPanel'

type AdminTab = 'dashboard' | 'orders' | 'products' | 'categories' | 'delivery' | 'settings'

const tabs: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'orders', label: 'Pedidos', icon: '📋' },
  { id: 'products', label: 'Produtos', icon: '🍔' },
  { id: 'categories', label: 'Categorias', icon: '📁' },
  { id: 'delivery', label: 'Entrega', icon: '🗺️' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
]

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-40 md:hidden w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg md:shadow-sm
        transform transition-transform duration-200 md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-14 md:pt-0
      `}>
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Painel Admin</h2>
          <p className="text-xs text-gray-500 mb-6">Gerencie seu restaurante</p>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
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
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

export default AdminPanel
