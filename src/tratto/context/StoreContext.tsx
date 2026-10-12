// @ts-nocheck -- código original migrado sem alterações de lógica
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, Category, Order, StoreConfig, DeliveryZone } from '../types'
import { supabase } from '@/integrations/supabase/client'
import { setDbMapboxToken } from '../mapboxToken'
import { setCurrentStoreId } from '../tenant'

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
  // Loja (SaaS)
  storeId: string
  storeName: string
  storeState: 'loading' | 'ready' | 'notfound' | 'unavailable'
  dataReady: boolean
}

const defaultConfig: StoreConfig = {
  name: 'Minha Loja',
  subtitle: 'Cardápio digital',
  phone: '',
  address: '',
  deliveryFee: 5,
  deliveryPerKm: 1.5,
  maxDeliveryKm: 10,
  fixedZoneFeesEnabled: false,
  mapboxFreightEnabled: true,
  minOrder: 0,
  openTime: '18:00',
  closeTime: '23:00',
  isOpen: true
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

function logError(action: string, error: any) {
  if (error) console.error(`Erro ao ${action}:`, error)
}

interface StoreProviderProps {
  children: ReactNode
  /** Cardápio público: resolve a loja pelo endereço (slug). */
  slug?: string
  /** Painel do lojista: loja já conhecida (o banco só deixa membros editar). */
  storeId?: string
  isAdmin?: boolean
}

export function StoreProvider({ children, slug, storeId: storeIdProp, isAdmin = false }: StoreProviderProps) {
  const [sid, setSid] = useState<string>(storeIdProp || '')
  const [storeName, setStoreName] = useState('')
  const [storeState, setStoreState] = useState<'loading' | 'ready' | 'notfound' | 'unavailable'>(storeIdProp ? 'ready' : 'loading')
  const [dataReady, setDataReady] = useState(false)
  const [config, setConfigState] = useState<StoreConfig>(defaultConfig)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])

  // 1) Descobre a loja pelo endereço (cardápio público)
  useEffect(() => {
    if (storeIdProp) { setSid(storeIdProp); setStoreState('ready'); return }
    if (!slug) return
    let cancelled = false
    setStoreState('loading')
    supabase.rpc('get_public_store', { _slug: slug }).then(({ data, error }) => {
      if (cancelled) return
      const row = Array.isArray(data) ? data[0] : data
      if (error || !row) { setStoreState('notfound'); return }
      setStoreName(row.name || '')
      setSid(row.id)
      setStoreState(row.available ? 'ready' : 'unavailable')
    })
    return () => { cancelled = true }
  }, [slug, storeIdProp])

  useEffect(() => { setCurrentStoreId(sid); return () => setCurrentStoreId('') }, [sid])

  // 2) Leitura dos dados da loja
  useEffect(() => {
    if (!sid || storeState !== 'ready') return
    let cancelled = false
    setDataReady(false)
    const load = async () => {
      try {
        const [settingsRes, catRes, prodRes, zoneRes] = await Promise.all([
          supabase.from('store_settings').select('config, mapbox_public_token').eq('store_id', sid).maybeSingle(),
          supabase.from('categories').select('data, sort_order').eq('store_id', sid).order('sort_order'),
          supabase.from('products').select('data, sort_order').eq('store_id', sid).order('sort_order'),
          supabase.from('delivery_zones').select('data').eq('store_id', sid),
        ])
        if (cancelled) return
        const cfg = settingsRes.data?.config || {}
        setConfigState({ ...defaultConfig, ...(storeName ? { name: storeName } : {}), ...cfg })
        setDbMapboxToken(settingsRes.data?.mapbox_public_token || '')
        setCategories((catRes.data || []).map(r => r.data))
        setProducts((prodRes.data || []).map(r => r.data))
        setDeliveryZones((zoneRes.data || []).map(r => r.data))
        ;[settingsRes, catRes, prodRes, zoneRes].forEach(r => logError('carregar dados do cardápio', r.error))
      } catch (err) {
        console.error('Falha ao carregar a loja.', err)
      } finally {
        if (!cancelled) setDataReady(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [sid, storeState])

  // 3) Painel: pedidos em tempo real
  useEffect(() => {
    if (!isAdmin || !sid) { setOrders([]); return }
    const channel = supabase
      .channel('orders-live-' + sid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${sid}` }, payload => {
        const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any
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
    supabase.from('orders').select('data, status').eq('store_id', sid).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        logError('carregar pedidos', error)
        if (data) setOrders(data.map(r => ({ ...r.data, status: r.status })))
      })
    return () => { supabase.removeChannel(channel) }
  }, [isAdmin, sid])

  const setConfig = (c: StoreConfig) => {
    setConfigState(c)
    supabase.from('store_settings').upsert({ store_id: sid, config: c, updated_at: new Date().toISOString() })
      .then(({ error }) => logError('salvar configurações', error))
  }
  const saveProduct = (p: Product, sortOrder?: number) => {
    const row: any = { store_id: sid, id: p.id, data: p }
    if (sortOrder !== undefined) row.sort_order = sortOrder
    supabase.from('products').upsert(row, { onConflict: 'store_id,id' }).then(({ error }) => logError('salvar produto', error))
  }
  const addProduct = (p: Product) => { setProducts(prev => { saveProduct(p, prev.length); return [...prev, p] }) }
  const updateProduct = (p: Product) => { setProducts(prev => prev.map(item => item.id === p.id ? p : item)); saveProduct(p) }
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id))
    supabase.from('products').delete().eq('store_id', sid).eq('id', id).then(({ error }) => logError('apagar produto', error))
  }
  const saveCategory = (c: Category) => {
    supabase.from('categories').upsert({ store_id: sid, id: c.id, data: c, sort_order: c.order ?? 0 }, { onConflict: 'store_id,id' })
      .then(({ error }) => logError('salvar categoria', error))
  }
  const addCategory = (c: Category) => { setCategories(prev => [...prev, c]); saveCategory(c) }
  const updateCategory = (c: Category) => { setCategories(prev => prev.map(item => item.id === c.id ? c : item)); saveCategory(c) }
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id))
    supabase.from('categories').delete().eq('store_id', sid).eq('id', id).then(({ error }) => logError('apagar categoria', error))
  }
  const addOrder = (o: Order) => {
    setOrders(prev => [o, ...prev])
    // O cliente só insere o pedido (sem .select(), pois não pode ler pedidos)
    supabase.from('orders').insert({ store_id: sid, id: o.id, data: o, status: 'pending' })
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
    supabase.from('orders').update({ data, status, updated_at: updatedAt }).eq('store_id', sid).eq('id', id)
      .then(({ error }) => logError('atualizar pedido', error))
  }
  const saveZone = (z: DeliveryZone) => {
    supabase.from('delivery_zones').upsert({ store_id: sid, id: z.id, data: z }, { onConflict: 'store_id,id' })
      .then(({ error }) => logError('salvar zona', error))
  }
  const addDeliveryZone = (z: DeliveryZone) => { setDeliveryZones(prev => [...prev, z]); saveZone(z) }
  const updateDeliveryZone = (z: DeliveryZone) => { setDeliveryZones(prev => prev.map(item => item.id === z.id ? z : item)); saveZone(z) }
  const deleteDeliveryZone = (id: string) => {
    setDeliveryZones(prev => prev.filter(item => item.id !== id))
    supabase.from('delivery_zones').delete().eq('store_id', sid).eq('id', id).then(({ error }) => logError('apagar zona', error))
  }

  return (
    <StoreContext.Provider value={{
      config, setConfig,
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory, updateCategory, deleteCategory,
      orders, addOrder, updateOrderStatus,
      deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone,
      storeId: sid, storeName: storeName || config.name, storeState, dataReady
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
