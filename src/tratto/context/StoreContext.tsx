// @ts-nocheck -- código original migrado sem alterações de lógica
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
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
  lastIncomingOrder: Order | null
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
  const [lastIncomingOrder, setLastIncomingOrder] = useState<Order | null>(null)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  // Falhas ao gravar (permissão, assinatura inativa, rede) aparecem para o usuário em vez de ficarem só no console
  const [saveError, setSaveError] = useState<string | null>(null)
  const notifyError = (action: string, error: any) => {
    if (!error) return
    console.error(`Erro ao ${action}:`, error)
    const denied = error.code === '42501' || /row-level security|permission denied/i.test(error.message || '')
    const detail = typeof error?.message === 'string' ? error.message.trim() : ''
    setSaveError(denied
      ? `Não foi possível ${action}: sem permissão ou assinatura da loja inativa.${detail ? ' Detalhe: ' + detail : ''}`
      : `Não foi possível ${action}.${detail ? ' Detalhe: ' + detail : ' Verifique a conexão e tente novamente.'}`)
  }
  const soundUrlRef = useRef<string | undefined>(undefined)
  soundUrlRef.current = config.orderNotificationSoundUrl

  // 1) Descobre a loja pelo endereço (cardápio público)
  useEffect(() => {
    if (storeIdProp) { setSid(storeIdProp); setStoreState('ready'); return }
    if (!slug) return
    let cancelled = false
    setStoreState('loading')
    supabase.rpc('get_public_store', { _slug: slug === 'ferreira-sourdough' ? 'teste' : slug }).then(({ data, error }) => {
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
        // Prioriza os dados que permitem mostrar o cardápio; zonas de entrega
        // são carregadas em seguida para não bloquear a primeira renderização.
        const [settingsRes, catRes, prodRes] = await Promise.all([
          supabase.from('store_settings').select('config, mapbox_public_token').eq('store_id', sid).maybeSingle(),
          supabase.from('categories').select('data, sort_order').eq('store_id', sid).order('sort_order'),
          supabase.from('products').select('data, sort_order').eq('store_id', sid).order('sort_order'),
        ])
        if (cancelled) return
        const cfg = settingsRes.data?.config || {}
        setConfigState({ ...defaultConfig, ...(storeName ? { name: storeName } : {}), ...cfg })
        setDbMapboxToken(settingsRes.data?.mapbox_public_token || '')
        setCategories((catRes.data || []).map(r => r.data))
        setProducts((prodRes.data || []).map(r => r.data))
        ;[settingsRes, catRes, prodRes].forEach(r => logError('carregar dados do cardápio', r.error))
        // O cardápio pode aparecer sem esperar por esta consulta secundária.
        setDataReady(true)
        supabase.from('delivery_zones').select('data').eq('store_id', sid).then(({ data, error }) => {
          if (cancelled) return
          if (error) logError('carregar zonas de entrega', error)
          setDeliveryZones((data || []).map(r => r.data))
        })
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
    let cancelled = false
    const channel = supabase
      .channel('orders-live-' + sid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${sid}` }, payload => {
        const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any
        if (!row?.id) return
        if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(order => order.id !== row.id))
          return
        }
        if (payload.eventType === 'INSERT' && soundUrlRef.current && typeof window !== 'undefined' && window.localStorage.getItem('tratto_order_sound_enabled') === '1') {
          try {
            const notificationAudio = new Audio(soundUrlRef.current)
            notificationAudio.volume = 1
            void notificationAudio.play().catch(error => console.warn('Som de novo pedido bloqueado pelo navegador. Ative o som no painel e teste novamente.', error))
          } catch (error) {
            console.warn('Não foi possível reproduzir o som de novo pedido.', error)
          }
        }
        const order = { ...(row.data || {}), id: row.id, status: row.status }
        if (payload.eventType === 'INSERT') setLastIncomingOrder(order)
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
        if (cancelled) return
        logError('carregar pedidos', error)
        if (!data) return
        const loaded = data.map(r => ({ ...r.data, status: r.status }))
        // mantém pedidos que chegaram em tempo real enquanto a lista carregava
        setOrders(prev => {
          const ids = new Set(loaded.map(o => o.id))
          return [...prev.filter(o => !ids.has(o.id)), ...loaded]
        })
      })
    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [isAdmin, sid])

  const setConfig = async (c: StoreConfig): Promise<boolean> => {
    if (!sid) {
      setSaveError('Não foi possível salvar as configurações: loja não identificada. Atualize a página e tente novamente.')
      return false
    }
    const { error } = await supabase.from('store_settings').upsert(
      { store_id: sid, config: c, updated_at: new Date().toISOString() },
      { onConflict: 'store_id' }
    )
    if (error) {
      notifyError('salvar configurações', error)
      return false
    }
    setConfigState(c)
    setSaveError(null)
    return true
  }
  const saveProduct = (p: Product, sortOrder?: number) => {
    const row: any = { store_id: sid, id: p.id, data: p }
    if (sortOrder !== undefined) row.sort_order = sortOrder
    supabase.from('products').upsert(row, { onConflict: 'store_id,id' }).then(({ error }) => notifyError('salvar produto', error))
  }
  const addProduct = (p: Product) => { saveProduct(p, products.length); setProducts(prev => [...prev, p]) }
  const updateProduct = (p: Product) => { setProducts(prev => prev.map(item => item.id === p.id ? p : item)); saveProduct(p) }
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id))
    supabase.from('products').delete().eq('store_id', sid).eq('id', id).then(({ error }) => notifyError('apagar produto', error))
  }
  const saveCategory = (c: Category) => {
    supabase.from('categories').upsert({ store_id: sid, id: c.id, data: c, sort_order: c.order ?? 0 }, { onConflict: 'store_id,id' })
      .then(({ error }) => notifyError('salvar categoria', error))
  }
  const addCategory = (c: Category) => { setCategories(prev => [...prev, c]); saveCategory(c) }
  const updateCategory = (c: Category) => { setCategories(prev => prev.map(item => item.id === c.id ? c : item)); saveCategory(c) }
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id))
    supabase.from('categories').delete().eq('store_id', sid).eq('id', id).then(({ error }) => notifyError('apagar categoria', error))
  }
  const addOrder = async (o: Order): Promise<boolean> => {
    if (!sid) {
      notifyError('enviar pedido', { message: 'Loja não identificada.' })
      return false
    }
    // Não copie imagens embutidas em base64 para o JSON do pedido: elas podem
    // ultrapassar o limite de tamanho da coluna. O catálogo continua com a imagem.
    const persistedOrder = {
      ...o,
      items: (o.items || []).map((item: any) => {
        const product = item.product || {}
        const image = typeof product.image === 'string' &&
          product.image.length < 2000 &&
          /^https?:\/\//i.test(product.image)
          ? product.image
          : ''
        return {
          ...item,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image,
            categoryId: product.categoryId,
            popular: product.popular,
            available: product.available,
            addOns: product.addOns,
          },
          selectedAddOns: item.selectedAddOns || [],
        }
      }),
    }
    // Só confirma o pedido na interface depois que o banco aceitar a gravação.
    const { error } = await supabase.from('orders').insert({
      store_id: sid, id: o.id, data: persistedOrder, status: 'pending'
    })
    if (error) {
      notifyError('enviar pedido', error)
      return false
    }
    setOrders(prev => (prev.some(x => x.id === o.id) ? prev : [o, ...prev]))
    return true
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
      .then(({ error }) => notifyError('atualizar pedido', error))
  }
  const saveZone = (z: DeliveryZone) => {
    supabase.from('delivery_zones').upsert({ store_id: sid, id: z.id, data: z }, { onConflict: 'store_id,id' })
      .then(({ error }) => notifyError('salvar zona', error))
  }
  const addDeliveryZone = (z: DeliveryZone) => { setDeliveryZones(prev => [...prev, z]); saveZone(z) }
  const updateDeliveryZone = (z: DeliveryZone) => { setDeliveryZones(prev => prev.map(item => item.id === z.id ? z : item)); saveZone(z) }
  const deleteDeliveryZone = (id: string) => {
    setDeliveryZones(prev => prev.filter(item => item.id !== id))
    supabase.from('delivery_zones').delete().eq('store_id', sid).eq('id', id).then(({ error }) => notifyError('apagar zona', error))
  }

  return (
    <StoreContext.Provider value={{
      config, setConfig,
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory, updateCategory, deleteCategory,
      orders, lastIncomingOrder, addOrder, updateOrderStatus,
      deliveryZones, addDeliveryZone, updateDeliveryZone, deleteDeliveryZone,
      storeId: sid, storeName: storeName || config.name, storeState, dataReady
    }}>
      {children}
      {saveError && (
        <div role="alert" style={{ position: 'fixed', left: '12px', right: '12px', bottom: '12px', zIndex: 9999, margin: '0 auto', maxWidth: '520px', maxHeight: '35vh', overflowY: 'auto', boxSizing: 'border-box', borderRadius: '12px', background: '#b91c1c', color: '#fff', padding: '14px 16px', fontSize: '14px', lineHeight: 1.45, boxShadow: '0 8px 28px rgba(0,0,0,.28)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{saveError}</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => setSaveError(null)} style={{ color: '#fff', background: 'transparent', border: 0, fontSize: '22px', lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
