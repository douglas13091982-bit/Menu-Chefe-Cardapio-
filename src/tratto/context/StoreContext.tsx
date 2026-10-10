import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Category, Order, StoreConfig, DeliveryZone } from '../types'

interface StoreContextType {
  // Config
  config: StoreConfig
  setConfig: (config: StoreConfig) => void
  // Products
  products: Product[]
  addProduct: (product: Product) => void
  updateProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  // Categories
  categories: Category[]
  addCategory: (category: Category) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: string) => void
  // Orders
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (id: string, status: Order['status']) => void
  // Delivery
  deliveryZones: DeliveryZone[]
  addDeliveryZone: (zone: DeliveryZone) => void
  updateDeliveryZone: (zone: DeliveryZone) => void
  deleteDeliveryZone: (id: string) => void
}

const defaultConfig: StoreConfig = {
  name: 'Tratto Hamburgueria',
  subtitle: 'Hamburguer Artesanal',
  phone: '(47) 99999-9999',
  address: 'Rua São Paulo, 1234 - Saguaçu, Joinville - SC',
  deliveryFee: 5.99,
  minOrder: 20,
  openTime: '18:00',
  closeTime: '23:00',
  isOpen: true
}

const defaultCategories: Category[] = [
  { id: 'hamburgueres', name: 'Hambúrgueres', icon: '🍔', order: 1 },
  { id: 'combos', name: 'Combos', icon: '🎁', order: 2 },
  { id: 'acompanhamentos', name: 'Acompanhamentos', icon: '🍟', order: 3 },
  { id: 'sobremesas', name: 'Sobremesas', icon: '🍫', order: 4 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 5 },
]

const defaultProducts: Product[] = [
  {
    id: '1', name: 'Tratto Duplo Cheddar',
    description: 'Dois blend de carne 120g, cheddar derretido, cebola caramelizada, alface, tomate e molho especial da casa no pão brioche.',
    price: 34.90, image: 'https://image.qwenlm.ai/generated-images/b62ff599-15a5-4145-8c58-c65f82e68458/_result.png',
    categoryId: 'hamburgueres', popular: true, available: true
  },
  {
    id: '2', name: 'Smash Bacon Crispy',
    description: 'Dois smash de 90g, bacon crocante, queijo prato derretido, picles e molho barbecue defumado no pão potato.',
    price: 32.90, image: 'https://image.qwenlm.ai/generated-images/bcef539b-80ef-4b18-b919-6dfe7b1b0fbb/_result.png',
    categoryId: 'hamburgueres', popular: true, available: true
  },
  {
    id: '3', name: 'Smash Tratto',
    description: 'Dois smash de 90g com queijo americano derretido nas bordas, picles, cebola roxa e molho smash especial.',
    price: 29.90, image: 'https://image.qwenlm.ai/generated-images/5439d0eb-4b3e-4d8b-ae55-67688ab6dbb4/_result.png',
    categoryId: 'hamburgueres', popular: true, available: true
  },
  {
    id: '4', name: 'Chicken Crispy Burger',
    description: 'Filé de frango empanado crocante, coleslaw, maionese de ervas e picles no pão brioche com gergelim.',
    price: 28.90, image: 'https://image.qwenlm.ai/generated-images/50704ef9-c654-4381-9ba7-795a0f6d07c4/_result.png',
    categoryId: 'hamburgueres', available: true
  },
  {
    id: '5', name: 'X-Burger Clássico',
    description: 'Blend de carne 150g, queijo prato, alface, tomate, cebola e maionese no pão australiano.',
    price: 26.90, image: 'https://image.qwenlm.ai/generated-images/b62ff599-15a5-4145-8c58-c65f82e68458/_result.png',
    categoryId: 'hamburgueres', available: true
  },
  {
    id: '6', name: 'Combo Tratto Duplo',
    description: 'Tratto Duplo Cheddar + Batata frita média + Refrigerante lata.',
    price: 44.90, image: 'https://image.qwenlm.ai/generated-images/b62ff599-15a5-4145-8c58-c65f82e68458/_result.png',
    categoryId: 'combos', popular: true, available: true
  },
  {
    id: '7', name: 'Combo Smash Bacon',
    description: 'Smash Bacon Crispy + Onion rings + Refrigerante lata.',
    price: 42.90, image: 'https://image.qwenlm.ai/generated-images/bcef539b-80ef-4b18-b919-6dfe7b1b0fbb/_result.png',
    categoryId: 'combos', available: true
  },
  {
    id: '8', name: 'Combo Família (4 pessoas)',
    description: '4 Tratto Duplo Cheddar + 2 Batatas fritas grandes + 4 Refrigerantes lata.',
    price: 149.90, image: 'https://image.qwenlm.ai/generated-images/5439d0eb-4b3e-4d8b-ae55-67688ab6dbb4/_result.png',
    categoryId: 'combos', available: true
  },
  {
    id: '9', name: 'Batata Frita Média',
    description: 'Porção de batatas fritas crocantes por fora e macias por dentro, com sal e tempero especial.',
    price: 16.90, image: 'https://image.qwenlm.ai/generated-images/f28df88c-a58f-4ee0-8237-746588c8fab5/_result.png',
    categoryId: 'acompanhamentos', popular: true, available: true
  },
  {
    id: '10', name: 'Batata com Cheddar e Bacon',
    description: 'Batatas fritas cobertas com cheddar cremoso e bacon crocante picado.',
    price: 24.90, image: 'https://image.qwenlm.ai/generated-images/f28df88c-a58f-4ee0-8237-746588c8fab5/_result.png',
    categoryId: 'acompanhamentos', available: true
  },
  {
    id: '11', name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos, crocantes e dourados. Acompanha molho ranch.',
    price: 18.90, image: 'https://image.qwenlm.ai/generated-images/f28df88c-a58f-4ee0-8237-746588c8fab5/_result.png',
    categoryId: 'acompanhamentos', available: true
  },
  {
    id: '12', name: 'Nuggets (10 un)',
    description: '10 nuggets de frango crocantes com molho barbecue e molho ranch.',
    price: 19.90, image: 'https://image.qwenlm.ai/generated-images/f28df88c-a58f-4ee0-8237-746588c8fab5/_result.png',
    categoryId: 'acompanhamentos', available: true
  },
  {
    id: '13', name: 'Brownie com Sorvete',
    description: 'Brownie de chocolate belga quentinho com bola de sorvete de creme e calda de chocolate.',
    price: 22.90, image: 'https://image.qwenlm.ai/generated-images/aaa3d1bf-c470-4b44-9309-afd633cd4a53/_result.png',
    categoryId: 'sobremesas', popular: true, available: true
  },
  {
    id: '14', name: 'Milkshake Ovomaltine',
    description: 'Milkshake cremoso de Ovomaltine com chantilly e calda de chocolate.',
    price: 19.90, image: 'https://image.qwenlm.ai/generated-images/aaa3d1bf-c470-4b44-9309-afd633cd4a53/_result.png',
    categoryId: 'sobremesas', available: true
  },
  {
    id: '15', name: 'Coca-Cola Lata 350ml',
    description: 'Coca-Cola lata gelada 350ml.',
    price: 7.90, image: '', categoryId: 'bebidas', available: true
  },
  {
    id: '16', name: 'Guaraná Antarctica Lata 350ml',
    description: 'Guaraná Antarctica lata gelada 350ml.',
    price: 7.90, image: '', categoryId: 'bebidas', available: true
  },
  {
    id: '17', name: 'Suco Natural 500ml',
    description: 'Suco natural da fruta. Sabores: Laranja, Limão, Maracujá ou Abacaxi.',
    price: 12.90, image: '', categoryId: 'bebidas', available: true
  },
  {
    id: '18', name: 'Água Mineral 500ml',
    description: 'Água mineral sem gás 500ml.',
    price: 4.90, image: '', categoryId: 'bebidas', available: true
  }
]

const defaultDeliveryZones: DeliveryZone[] = [
  {
    id: '1', name: 'Saguaçu', price: 5.99, estimatedTime: '25-35 min',
    coordinates: [
      { lat: -26.2850, lng: -48.8450 },
      { lat: -26.2800, lng: -48.8400 },
      { lat: -26.2900, lng: -48.8400 },
      { lat: -26.2900, lng: -48.8500 },
      { lat: -26.2850, lng: -48.8500 },
    ]
  },
  {
    id: '2', name: 'Centro', price: 7.99, estimatedTime: '30-40 min',
    coordinates: [
      { lat: -26.3000, lng: -48.8500 },
      { lat: -26.2950, lng: -48.8450 },
      { lat: -26.3050, lng: -48.8450 },
      { lat: -26.3050, lng: -48.8550 },
      { lat: -26.3000, lng: -48.8550 },
    ]
  },
  {
    id: '3', name: 'Boa Vista', price: 9.99, estimatedTime: '35-45 min',
    coordinates: [
      { lat: -26.2700, lng: -48.8300 },
      { lat: -26.2650, lng: -48.8250 },
      { lat: -26.2750, lng: -48.8250 },
      { lat: -26.2750, lng: -48.8350 },
      { lat: -26.2700, lng: -48.8350 },
    ]
  }
]

function generateDemoOrders(): Order[] {
  const statuses: Order['status'][] = ['pending', 'preparing', 'delivering', 'completed', 'completed', 'completed']
  const names = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Lucas Ferreira', 'Carla Mendes']
  const orders: Order[] = []
  
  for (let i = 0; i < 12; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 5) + 18, Math.floor(Math.random() * 60))
    
    orders.push({
      id: `ORD-${1000 + i}`,
      items: [
        { product: defaultProducts[Math.floor(Math.random() * 5)], quantity: Math.floor(Math.random() * 3) + 1 }
      ],
      total: Math.random() * 80 + 30,
      deliveryFee: [5.99, 7.99, 9.99][Math.floor(Math.random() * 3)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      customerName: names[Math.floor(Math.random() * names.length)],
      customerPhone: `(47) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      customerAddress: `Rua ${['das Flores', 'São Paulo', 'Principal', 'das Palmeiras'][Math.floor(Math.random() * 4)]}, ${Math.floor(Math.random() * 2000 + 100)}`,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    })
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<StoreConfig>(() => loadFromStorage('store_config', defaultConfig))
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('store_products', defaultProducts))
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage('store_categories', defaultCategories))
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('store_orders', generateDemoOrders()))
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => loadFromStorage('store_delivery_zones', defaultDeliveryZones))

  useEffect(() => { localStorage.setItem('store_config', JSON.stringify(config)) }, [config])
  useEffect(() => { localStorage.setItem('store_products', JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem('store_categories', JSON.stringify(categories)) }, [categories])
  useEffect(() => { localStorage.setItem('store_orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { localStorage.setItem('store_delivery_zones', JSON.stringify(deliveryZones)) }, [deliveryZones])

  const setConfig = (c: StoreConfig) => setConfigState(c)
  const addProduct = (p: Product) => setProducts(prev => [...prev, p])
  const updateProduct = (p: Product) => setProducts(prev => prev.map(item => item.id === p.id ? p : item))
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(item => item.id !== id))
  const addCategory = (c: Category) => setCategories(prev => [...prev, c])
  const updateCategory = (c: Category) => setCategories(prev => prev.map(item => item.id === c.id ? c : item))
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(item => item.id !== id))
  const addOrder = (o: Order) => setOrders(prev => [o, ...prev])
  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  }
  const addDeliveryZone = (z: DeliveryZone) => setDeliveryZones(prev => [...prev, z])
  const updateDeliveryZone = (z: DeliveryZone) => setDeliveryZones(prev => prev.map(item => item.id === z.id ? z : item))
  const deleteDeliveryZone = (id: string) => setDeliveryZones(prev => prev.filter(item => item.id !== id))

  return (
    <StoreContext.Provider value={{
      config, setConfig,
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory, updateCategory, deleteCategory,
      orders, addOrder, updateOrderStatus,
      deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
