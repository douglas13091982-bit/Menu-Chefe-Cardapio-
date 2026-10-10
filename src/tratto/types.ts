export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  popular?: boolean
  available: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  order: number
}

export interface CartItem {
  product: Product
  quantity: number
  observation?: string
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  deliveryFee: number
  status: 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled'
  customerName: string
  customerPhone: string
  customerAddress: string
  createdAt: string
  updatedAt: string
}

export interface StoreConfig {
  name: string
  subtitle: string
  phone: string
  address: string
  deliveryFee: number
  minOrder: number
  openTime: string
  closeTime: string
  isOpen: boolean
}

export interface DeliveryZone {
  id: string
  name: string
  price: number
  estimatedTime: string
  coordinates: { lat: number; lng: number }[]
}

export interface DailySales {
  date: string
  total: number
  orders: number
}
