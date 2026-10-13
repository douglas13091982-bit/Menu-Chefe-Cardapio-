// @ts-nocheck -- código original migrado sem alterações de lógica
export interface ProductAddOn {
  id: string
  name: string
  price: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  popular?: boolean
  available: boolean
  addOns?: ProductAddOn[]
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
  selectedAddOns?: ProductAddOn[]
}

export type DeliveryType = 'pickup' | 'delivery'
export type PaymentMethod = 'card' | 'pix' | 'cash'

export interface Order {
  id: string
  items: CartItem[]
  total: number
  deliveryFee: number
  status: 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled'
  customerName: string
  customerPhone: string
  customerAddress: string
  deliveryType?: DeliveryType
  paymentMethod?: PaymentMethod
  changeFor?: number
  discount?: number
  couponCode?: string
  scheduledDate?: string // YYYY-MM-DD
  scheduledTime?: string // HH:MM
  createdAt: string
  updatedAt: string
}

export interface DayHours {
  open: boolean
  openTime: string
  closeTime: string
}

export interface StoreConfig {
  name: string
  subtitle: string
  logoUrl?: string
  bannerImage?: string
  phone: string
  address: string
  deliveryFee: number
  deliveryPerKm?: number
  maxDeliveryKm?: number
  fixedZoneFeesEnabled?: boolean
  mapboxFreightEnabled?: boolean
  minOrder: number
  openTime: string
  closeTime: string
  weeklyHours?: DayHours[]
  pickupEnabled?: boolean
  schedulingEnabled?: boolean
  schedulingDays?: number
  schedulingSlotMinutes?: number
  schedulingLeadMinutes?: number
  coupons?: Coupon[]
  isOpen: boolean
}

export interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder?: number
  startsAt?: string // YYYY-MM-DD
  expiresAt?: string // YYYY-MM-DD
  active: boolean
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
