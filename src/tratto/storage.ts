// Helpers de persistência em localStorage com SSR-safety e validação de dados.
// Centraliza a leitura/escrita para evitar falhas silenciosas (JSON corrompido,
// formatos inesperados) e crashes durante renderização no servidor.

export function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/** Lê e valida um item do localStorage. Retorna o fallback em qualquer falha. */
export function loadJson<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  if (!isStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (validate) return validate(parsed) ? parsed : fallback
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

/** Escreve um item no localStorage sem lançar exceções (quota/QoS/SSR). */
export function saveJson(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // QuotaExceededError ou storage bloqueado — degradação graciosa.
    console.warn(`[storage] Falha ao salvar "${key}" no localStorage.`)
    return false
  }
}

// ---------- Validadores de domínio ----------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback)

/** Normaliza um produto vindo do storage; retorna null se for irrecuperável. */
export function normalizeProduct(v: unknown): import('./types').Product | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.name !== 'string') return null
  return {
    id: v.id,
    name: v.name,
    description: str(v.description),
    price: num(v.price, 0),
    image: str(v.image),
    categoryId: str(v.categoryId),
    popular: bool(v.popular),
    available: bool(v.available, true),
    addOns: Array.isArray(v.addOns)
      ? (v.addOns as unknown[])
          .filter(isRecord)
          .filter(a => typeof a.id === 'string' && typeof a.name === 'string')
          .map(a => ({ id: a.id as string, name: a.name as string, price: num(a.price, 0) }))
      : undefined,
  }
}

export function isProductArray(v: unknown): v is import('./types').Product[] {
  if (!Array.isArray(v)) return false
  return v.every(item => normalizeProduct(item) !== null)
}

/** Normaliza uma categoria vinda do storage; retorna null se irrecuperável. */
export function normalizeCategory(v: unknown): import('./types').Category | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.name !== 'string') return null
  return { id: v.id, name: v.name, icon: str(v.icon, '🍔'), order: num(v.order, 0) }
}

export function isCategoryArray(v: unknown): v is import('./types').Category[] {
  if (!Array.isArray(v)) return false
  return v.every(item => normalizeCategory(item) !== null)
}

/** Normaliza um pedido vindo do storage; retorna null se irrecuperável. */
export function normalizeOrder(v: unknown): import('./types').Order | null {
  if (!isRecord(v) || typeof v.id !== 'string') return null
  const items = Array.isArray(v.items)
    ? (v.items as unknown[])
        .map(rawItem => {
          if (!isRecord(rawItem)) return null
          const product = normalizeProduct(rawItem.product)
          if (!product) return null
          return {
            product,
            quantity: Math.max(1, Math.round(num(rawItem.quantity, 1))),
            observation: typeof rawItem.observation === 'string' ? rawItem.observation : undefined,
            selectedAddOns: Array.isArray(rawItem.selectedAddOns)
              ? (rawItem.selectedAddOns as unknown[])
                  .filter(isRecord)
                  .filter(a => typeof a.id === 'string' && typeof a.name === 'string')
                  .map(a => ({ id: a.id as string, name: a.name as string, price: num(a.price, 0) }))
              : undefined,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : []
  const statuses = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'] as const
  const status = statuses.includes(v.status as (typeof statuses)[number])
    ? (v.status as import('./types').Order['status'])
    : 'pending'
  return {
    id: v.id,
    items,
    total: num(v.total, 0),
    deliveryFee: num(v.deliveryFee, 0),
    status,
    customerName: str(v.customerName),
    customerPhone: str(v.customerPhone),
    customerAddress: str(v.customerAddress),
    deliveryType: v.deliveryType === 'pickup' || v.deliveryType === 'delivery' ? v.deliveryType : undefined,
    paymentMethod:
      v.paymentMethod === 'card' || v.paymentMethod === 'pix' || v.paymentMethod === 'cash'
        ? v.paymentMethod
        : undefined,
    changeFor: typeof v.changeFor === 'number' && Number.isFinite(v.changeFor) ? v.changeFor : undefined,
    createdAt: str(v.createdAt, new Date().toISOString()),
    updatedAt: str(v.updatedAt, new Date().toISOString()),
  }
}

export function isOrderArray(v: unknown): v is import('./types').Order[] {
  if (!Array.isArray(v)) return false
  return v.every(item => normalizeOrder(item) !== null)
}

/** Normaliza a configuração da loja, preenchendo campos ausentes com defaults. */
export function normalizeConfig(v: unknown, defaults: import('./types').StoreConfig): import('./types').StoreConfig {
  if (!isRecord(v)) return defaults
  return {
    ...defaults,
    name: str(v.name, defaults.name),
    subtitle: str(v.subtitle, defaults.subtitle),
    logoUrl: typeof v.logoUrl === 'string' && v.logoUrl ? v.logoUrl : undefined,
    phone: str(v.phone, defaults.phone),
    address: str(v.address, defaults.address),
    deliveryFee: num(v.deliveryFee, defaults.deliveryFee),
    minOrder: num(v.minOrder, defaults.minOrder),
    openTime: str(v.openTime, defaults.openTime),
    closeTime: str(v.closeTime, defaults.closeTime),
    isOpen: bool(v.isOpen, defaults.isOpen),
  }
}

/** Normaliza zonas de entrega; descarta entradas inválidas. */
export function normalizeDeliveryZones(v: unknown): import('./types').DeliveryZone[] | null {
  if (!Array.isArray(v)) return null
  const zones = (v as unknown[])
    .filter(isRecord)
    .filter(z => typeof z.id === 'string' && typeof z.name === 'string')
    .map(z => ({
      id: z.id as string,
      name: z.name as string,
      price: num(z.price, 0),
      estimatedTime: str(z.estimatedTime),
      coordinates: Array.isArray(z.coordinates)
        ? (z.coordinates as unknown[])
            .filter(isRecord)
            .filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')
            .map(c => ({ lat: c.lat as number, lng: c.lng as number }))
        : [],
    }))
  return zones.length > 0 || v.length === 0 ? zones : null
}
