// @ts-nocheck -- código original migrado sem alterações de lógica
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Category, Order, StoreConfig, DeliveryZone } from '../types'
import { supabase } from '@/integrations/supabase/client'
import { setDbMapboxToken } from '../mapboxToken'

export { isCurrentUserAdmin }

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
  deliveryPerKm: 1.5,
  maxDeliveryKm: 10,
  fixedZoneFeesEnabled: false,
  mapboxFreightEnabled: true,
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
    price: 34.90, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    categoryId: 'hamburgueres', popular: true, available: true
  },
  {
    id: '2', name: 'Smash Bacon Crispy',
    description: 'Dois smash de 90g, bacon crocante, queijo prato derretido, picles e molho barbecue defumado no pão potato.',
    price: 32.90, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=900&q=85',
    categoryId: 'hamburgueres', popular: true, available: true
  },
  {
    id: '3', name: 'Smash Tratto',
    description: 'Dois smash de 90g com queijo americano derretido nas bordas, picles, cebola roxa e molho smash especial.',
    price: 29.90, image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=900&q=85',
    categoryId: 'hamburgueres', popular: true, available: true
  },
  {
    id: '4', name: 'Chicken Crispy Burger',
    description: 'Filé de frango empanado crocante, coleslaw, maionese de ervas e picles no pão brioche com gergelim.',
    price: 28.90, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=85',
    categoryId: 'hamburgueres', available: true
  },
  {
    id: '5', name: 'X-Burger Clássico',
    description: 'Blend de carne 150g, queijo prato, alface, tomate, cebola e maionese no pão australiano.',
    price: 26.90, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85',
    categoryId: 'hamburgueres', available: true
  },
  {
    id: '6', name: 'Combo Tratto Duplo',
    description: 'Tratto Duplo Cheddar + Batata frita média + Refrigerante lata.',
    price: 44.90, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85',
    categoryId: 'combos', popular: true, available: true
  },
  {
    id: '7', name: 'Combo Smash Bacon',
    description: 'Smash Bacon Crispy + Onion rings + Refrigerante lata.',
    price: 42.90, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?auto=format&fit=crop&w=900&q=85',
    categoryId: 'combos', available: true
  },
  {
    id: '8', name: 'Combo Família (4 pessoas)',
    description: '4 Tratto Duplo Cheddar + 2 Batatas fritas grandes + 4 Refrigerantes lata.',
    price: 149.90, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    categoryId: 'combos', available: true
  },
  {
    id: '9', name: 'Batata Frita Média',
    description: 'Porção de batatas fritas crocantes por fora e macias por dentro, com sal e tempero especial.',
    price: 16.90, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
    categoryId: 'acompanhamentos', popular: true, available: true
  },
  {
    id: '10', name: 'Batata com Cheddar e Bacon',
    description: 'Batatas fritas cobertas com cheddar cremoso e bacon crocante picado.',
    price: 24.90, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
    categoryId: 'acompanhamentos', available: true
  },
  {
    id: '11', name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos, crocantes e dourados. Acompanha molho ranch.',
    price: 18.90, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=85',
    categoryId: 'acompanhamentos', available: true
  },
  {
    id: '12', name: 'Nuggets (10 un)',
    description: '10 nuggets de frango crocantes com molho barbecue e molho ranch.',
    price: 19.90, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=85',
    categoryId: 'acompanhamentos', available: true
  },
  {
    id: '13', name: 'Brownie com Sorvete',
    description: 'Brownie de chocolate belga quentinho com bola de sorvete de creme e calda de chocolate.',
    price: 22.90, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85',
    categoryId: 'sobremesas', popular: true, available: true
  },
  {
    id: '14', name: 'Milkshake Ovomaltine',
    description: 'Milkshake cremoso de Ovomaltine com chantilly e calda de chocolate.',
    price: 19.90, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=85',
    categoryId: 'sobremesas', available: true
  },
  {
    id: '15', name: 'Coca-Cola Lata 350ml',
    description: 'Coca-Cola lata gelada 350ml.',
    price: 7.90, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85', categoryId: 'bebidas', available: true
  },
  {
    id: '16', name: 'Guaraná Antarctica Lata 350ml',
    description: 'Guaraná Antarctica lata gelada 350ml.',
    price: 7.90, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=85', categoryId: 'bebidas', available: true
  },
  {
    id: '17', name: 'Suco Natural 500ml',
    description: 'Suco natural da fruta. Sabores: Laranja, Limão, Maracujá ou Abacaxi.',
    price: 12.90, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=85', categoryId: 'bebidas', available: true
  },
  {
    id: '18', name: 'Água Mineral 500ml',
    description: 'Água mineral sem gás 500ml.',
    price: 4.90, image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=900&q=85', categoryId: 'bebidas', available: true
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

async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  if (error) { console.error('Erro ao verificar papel admin:', error); return false }
  return data === true
}

function logError(action: string, error: any) {
  if (error) console.error(`Erro ao ${action}:`, error)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Começa com os dados padrão: se o banco falhar, o cardápio continua abrindo
  const [config, setConfigState] = useState<StoreConfig>(defaultConfig)
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(defaultDeliveryZones)
  const [isAdmin, setIsAdmin] = useState(false)

  // Leitura pública (cardápio)
  useEffect(() => {
    let cancelled = false
    const loadPublic = async () => {
      try {
        const [settingsRes, catRes, prodRes, zoneRes] = await Promise.all([
          supabase.from('store_settings').select('config, mapbox_public_token').eq('id', 'main').maybeSingle(),
          supabase.from('categories').select('data, sort_order').order('sort_order'),
          supabase.from('products').select('data, sort_order').order('sort_order'),
          supabase.from('delivery_zones').select('data'),
        ])
        if (cancelled) return
        if (settingsRes.data) {
          setConfigState({ ...defaultConfig, ...(settingsRes.data.config || {}) })
          setDbMapboxToken(settingsRes.data.mapbox_public_token || '')
        }
        if (catRes.data && catRes.data.length > 0) setCategories(catRes.data.map(r => r.data))
        if (prodRes.data && prodRes.data.length > 0) setProducts(prodRes.data.map(r => r.data))
        if (zoneRes.data && zoneRes.data.length > 0) setDeliveryZones(zoneRes.data.map(r => r.data))
        ;[settingsRes, catRes, prodRes, zoneRes].forEach(r => logError('carregar dados do cardápio', r.error))
      } catch (err) {
        console.error('Falha ao conectar ao banco; usando dados padrão.', err)
      }
    }
    loadPublic()
    return () => { cancelled = true }
  }, [])

  // Sessão do admin
  useEffect(() => {
    const check = () => { isCurrentUserAdmin().then(setIsAdmin).catch(() => setIsAdmin(false)) }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') check()
    })
    return () => subscription.unsubscribe()
  }, [])

  // Admin: mantém pedidos atualizados em tempo real e carrega dados iniciais
  useEffect(() => {
    if (!isAdmin) { setOrders([]); return }
    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        const row = payload.new as any
        if (!row?.id) return
        if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== row.id))
          return
        }
        const order = { ...(row.data || {}), id: row.id, status: row.status }
        setOrders(prev => {
          const exists = prev.some(item => item.id === order.id)
          return exists
            ? prev.map(item => item.id === order.id ? { ...item, ...order } : item)
            : [order, ...prev]
        })
      })
      .subscribe()
    const loadAdmin = async () => {
      const [settingsRes, catRes, prodRes, zoneRes] = await Promise.all([
        supabase.from('store_settings').select('id').eq('id', 'main').maybeSingle(),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('delivery_zones').select('id', { count: 'exact', head: true }),
      ])
      if (!settingsRes.error && !settingsRes.data) {
        logError('popular configurações', (await supabase.from('store_settings').insert({ id: 'main', config: defaultConfig })).error)
      }
      if (!catRes.error && catRes.count === 0) {
        logError('popular categorias', (await supabase.from('categories').insert(defaultCategories.map((c, i) => ({ id: c.id, data: c, sort_order: c.order ?? i })))).error)
      }
      if (!prodRes.error && prodRes.count === 0) {
        logError('popular produtos', (await supabase.from('products').insert(defaultProducts.map((p, i) => ({ id: p.id, data: p, sort_order: i })))).error)
      }
      if (!zoneRes.error && zoneRes.count === 0) {
        logError('popular zonas', (await supabase.from('delivery_zones').insert(defaultDeliveryZones.map(z => ({ id: z.id, data: z })))).error)
      }
      const { data, error } = await supabase.from('orders').select('data, status').order('created_at', { ascending: false })
      logError('carregar pedidos', error)
      if (data) setOrders(data.map(r => ({ ...r.data, status: r.status })))
    }
    loadAdmin().catch(err => console.error('Erro no carregamento do admin:', err))
    return () => { supabase.removeChannel(channel) }
  }, [isAdmin])

  const setConfig = (c: StoreConfig) => {
    setConfigState(c)
    supabase.from('store_settings').upsert({ id: 'main', config: c, updated_at: new Date().toISOString() })
      .then(({ error }) => logError('salvar configurações', error))
  }
  const saveProduct = (p: Product, sortOrder?: number) => {
    const row: any = { id: p.id, data: p }
    if (sortOrder !== undefined) row.sort_order = sortOrder
    supabase.from('products').upsert(row).then(({ error }) => logError('salvar produto', error))
  }
  const addProduct = (p: Product) => { setProducts(prev => { saveProduct(p, prev.length); return [...prev, p] }) }
  const updateProduct = (p: Product) => { setProducts(prev => prev.map(item => item.id === p.id ? p : item)); saveProduct(p) }
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id))
    supabase.from('products').delete().eq('id', id).then(({ error }) => logError('apagar produto', error))
  }
  const saveCategory = (c: Category) => {
    supabase.from('categories').upsert({ id: c.id, data: c, sort_order: c.order ?? 0 }).then(({ error }) => logError('salvar categoria', error))
  }
  const addCategory = (c: Category) => { setCategories(prev => [...prev, c]); saveCategory(c) }
  const updateCategory = (c: Category) => { setCategories(prev => prev.map(item => item.id === c.id ? c : item)); saveCategory(c) }
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id))
    supabase.from('categories').delete().eq('id', id).then(({ error }) => logError('apagar categoria', error))
  }
  const addOrder = (o: Order) => {
    setOrders(prev => [o, ...prev])
    // O cliente só insere o pedido (sem .select(), pois não pode ler pedidos)
    supabase.from('orders').insert({ id: o.id, data: o, status: 'pending' })
      .then(({ error }) => logError('enviar pedido', error))
  }
  const updateOrderStatus = (id: string, status: Order['status']) => {
    const updatedAt = new Date().toISOString()
    let updated: Order | undefined
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o
      updated = { ...o, status, updatedAt }
      return updated
    }))
    const current = orders.find(o => o.id === id)
    const data = updated || (current ? { ...current, status, updatedAt } : undefined)
    if (!data) return
    supabase.from('orders').update({ data, status, updated_at: updatedAt }).eq('id', id)
      .then(({ error }) => logError('atualizar pedido', error))
  }
  const saveZone = (z: DeliveryZone) => {
    supabase.from('delivery_zones').upsert({ id: z.id, data: z }).then(({ error }) => logError('salvar zona', error))
  }
  const addDeliveryZone = (z: DeliveryZone) => { setDeliveryZones(prev => [...prev, z]); saveZone(z) }
  const updateDeliveryZone = (z: DeliveryZone) => { setDeliveryZones(prev => prev.map(item => item.id === z.id ? z : item)); saveZone(z) }
  const deleteDeliveryZone = (id: string) => {
    setDeliveryZones(prev => prev.filter(item => item.id !== id))
    supabase.from('delivery_zones').delete().eq('id', id).then(({ error }) => logError('apagar zona', error))
  }

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
