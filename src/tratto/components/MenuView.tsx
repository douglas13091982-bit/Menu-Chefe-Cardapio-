// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { Product, CartItem, ProductAddOn, Order, DeliveryType, PaymentMethod } from '../types'
import { getMapboxToken } from '../mapboxToken'

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

// preço unitário do item do carrinho (produto + adicionais selecionados)
const getItemUnitPrice = (item: CartItem) =>
  item.product.price + (item.selectedAddOns || []).reduce((sum, a) => sum + a.price, 0)

function MenuView() {
  const { config, products, categories, deliveryZones, addOrder } = useStore()
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  // quando editando uma linha do carrinho, o modal salva as alterações na própria linha
  const [editingCartKey, setEditingCartKey] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  // Checkout (aparece após "Finalizar pedido" no carrinho)
  const [showCheckout, setShowCheckout] = useState(false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerNumber, setCustomerNumber] = useState('')
  const [cep, setCep] = useState('')
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [cepMessage, setCepMessage] = useState('')
  const cepRequestRef = useRef(0)
  const [changeFor, setChangeFor] = useState('')
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const addToCart = (product: Product, addOnIds: string[] = [], incQty = false) => {
    const chosenAddOns = (product.addOns || []).filter(a => addOnIds.includes(a.id))
    setCart(prev => {
      const keyOf = (item: CartItem) =>
        item.product.id + '|' + [...(item.selectedAddOns || [])].map(a => a.id).sort().join(',')
      const key = product.id + '|' + chosenAddOns.map(a => a.id).sort().join(',')
      const existing = prev.find(item => keyOf(item) === key)
      if (existing) {
        return prev.map(item => keyOf(item) === key ? { ...item, quantity: item.quantity + (incQty ? 1 : 0) } : item)
      }
      return [...prev, { product, quantity: 1, selectedAddOns: chosenAddOns }]
    })
  }

  const removeFromCart = (productId: string, addOnIds?: string[]) => {
    setCart(prev => {
      const targetKey = addOnIds
        ? productId + '|' + [...addOnIds].sort().join(',')
        : undefined
      // se passou os adicionais, mexe exatamente naquele item; senão remove o último desse produto
      for (let i = prev.length - 1; i >= 0; i--) {
        const k = prev[i].product.id + '|' + [...(prev[i].selectedAddOns || [])].map(a => a.id).sort().join(',')
        if (targetKey ? k === targetKey : prev[i].product.id === productId) {
          if (prev[i].quantity > 1) {
            return prev.map((item, idx) => idx === i ? { ...item, quantity: item.quantity - 1 } : item)
          }
          return prev.filter((_, idx) => idx !== i)
        }
      }
      return prev
    })
  }

  const getCartQuantity = (productId: string) => {
    const item = cart.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const itemKeyOf = (item: CartItem) =>
    item.product.id + '|' + [...(item.selectedAddOns || [])].map(a => a.id).sort().join(',')

  // abre o modal do produto para editar os extras de uma linha específica do carrinho
  const openEditExtras = (item: CartItem) => {
    setSelectedProduct(item.product)
    setSelectedAddOns((item.selectedAddOns || []).map(a => a.id))
    setEditingCartKey(itemKeyOf(item))
    setShowProductModal(true)
  }

  // salva as seleções do modal na própria linha do carrinho (preço e quantidade atualizados)
  const updateCartItemAddOns = () => {
    if (!selectedProduct || !editingCartKey) return
    const chosenAddOns = (selectedProduct.addOns || []).filter(a => selectedAddOns.includes(a.id))
    const newKey = selectedProduct.id + '|' + chosenAddOns.map(a => a.id).sort().join(',')
    setCart(prev => {
      const idx = prev.findIndex(i => itemKeyOf(i) === editingCartKey)
      if (idx === -1) return prev.filter(i => itemKeyOf(i) !== newKey)
      const edited = { ...prev[idx], selectedAddOns: chosenAddOns }
      // se já existir outra linha idêntica à nova, soma as quantidades e remove a editada
      const dupIdx = prev.findIndex((i, j) => j !== idx && itemKeyOf(i) === newKey)
      if (dupIdx !== -1) {
        const merged = { ...prev[dupIdx], quantity: prev[dupIdx].quantity + prev[idx].quantity }
        return prev.map((i, j) => (j === dupIdx ? merged : i)).filter((_, j) => j !== idx)
      }
      return prev.map((i, j) => (j === idx ? edited : i))
    })
    setEditingCartKey(null)
    setShowProductModal(false)
  }

  // marca/desmarca um adicional direto na linha do carrinho (sem abrir a página/modal do produto)
  const toggleCartItemAddOn = (item: CartItem, addOnId: string) => {
    const currentIds = (item.selectedAddOns || []).map(a => a.id)
    const nextIds = currentIds.includes(addOnId)
      ? currentIds.filter(id => id !== addOnId)
      : [...currentIds, addOnId]
    const chosenAddOns = (item.product.addOns || []).filter(a => nextIds.includes(a.id))
    const oldKey = itemKeyOf(item)
    const newKey = item.product.id + '|' + chosenAddOns.map(a => a.id).sort().join(',')
    setCart(prev => {
      const idx = prev.findIndex(i => itemKeyOf(i) === oldKey)
      if (idx === -1) return prev
      // se já existir outra linha idêntica à nova, soma as quantidades e remove a editada
      const dupIdx = prev.findIndex((i, j) => j !== idx && itemKeyOf(i) === newKey)
      if (dupIdx !== -1) {
        const merged = { ...prev[dupIdx], quantity: prev[dupIdx].quantity + prev[idx].quantity }
        return prev.map((i, j) => (j === dupIdx ? merged : i)).filter((_, j) => j !== idx)
      }
      return prev.map((i, j) => (j === idx ? { ...i, selectedAddOns: chosenAddOns } : i))
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0)

  // ---- Checkout helpers ----
  const checkoutDeliveryFee = deliveryType === 'delivery' ? config.deliveryFee : 0
  const checkoutTotal = totalPrice + checkoutDeliveryFee
  const changeValue = parseFloat((changeFor || '').replace(',', '.')) || 0
  const paymentLabels: Record<PaymentMethod, string> = {
    card: 'Cartão',
    pix: 'PIX',
    cash: 'Dinheiro',
  }
  // Busca o endereço pelo CEP usando a Geocoding API do Mapbox (token configurado no painel admin)
  const lookupCep = async (digits: string) => {
    const requestId = ++cepRequestRef.current
    const token = getMapboxToken()
    if (!token) {
      setCepStatus('error')
      setCepMessage('Busca por CEP indisponível no momento. Preencha o endereço manualmente.')
      return
    }
    setCepStatus('loading')
    setCepMessage('Buscando endereço...')
    try {
      const formatted = digits.slice(0, 5) + '-' + digits.slice(5)
      const url =
        'https://api.mapbox.com/search/geocode/v6/forward' +
        `?q=${encodeURIComponent(formatted)}&country=br&language=pt&limit=1&types=postcode,street,address` +
        `&access_token=${encodeURIComponent(token)}`
      const res = await fetch(url)
      if (requestId !== cepRequestRef.current) return
      if (!res.ok) throw new Error('http ' + res.status)
      const data = await res.json()
      if (requestId !== cepRequestRef.current) return
      const feature = data?.features?.[0]
      const ctx = feature?.properties?.context || {}
      const type = feature?.properties?.feature_type
      const street =
        ctx.address?.street_name ||
        ctx.street?.name ||
        (type === 'street' ? feature?.properties?.name : '') ||
        ''
      const neighborhood = ctx.neighborhood?.name || ctx.locality?.name || ''
      const city = ctx.place?.name || ctx.district?.name || ''
      const uf = ctx.region?.region_code || ''
      if (!feature || (!street && !neighborhood && !city)) {
        setCepStatus('error')
        setCepMessage('Não encontramos esse CEP. Preencha o endereço manualmente.')
        return
      }
      const cityUf = city && uf ? `${city} - ${uf}` : city
      setCustomerAddress([street, neighborhood, cityUf].filter(Boolean).join(', '))
      setCepStatus('ok')
      setCepMessage(
        street
          ? 'Endereço encontrado! Informe o número e o complemento.'
          : 'CEP localizado. Complete a rua e informe o número.'
      )
    } catch {
      if (requestId !== cepRequestRef.current) return
      setCepStatus('error')
      setCepMessage('Não foi possível buscar o CEP agora. Preencha o endereço manualmente.')
    }
  }

  const handleCepChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    setCep(digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits)
    if (digits.length === 8) {
      lookupCep(digits)
    } else {
      cepRequestRef.current++
      setCepStatus('idle')
      setCepMessage('')
    }
  }

  const canPlaceOrder =
    customerName.trim() !== '' &&
    customerPhone.trim() !== '' &&
    paymentMethod !== '' &&
    (deliveryType === 'pickup' || (customerAddress.trim() !== '' && customerNumber.trim() !== ''))

  const openCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
  }

  const placeOrder = () => {
    if (!canPlaceOrder) return
    const now = new Date().toISOString()
    const order: Order = {
      id: '#' + Math.floor(1000 + Math.random() * 9000),
      items: cart,
      total: totalPrice,
      deliveryFee: checkoutDeliveryFee,
      status: 'pending',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: deliveryType === 'delivery'
        ? `${customerAddress.trim()}, nº ${customerNumber.trim()}${cep.length === 9 ? ' - CEP ' + cep : ''}`
        : '',
      deliveryType,
      paymentMethod: paymentMethod as PaymentMethod,
      changeFor: paymentMethod === 'cash' && changeValue > checkoutTotal ? changeValue : undefined,
      createdAt: now,
      updatedAt: now,
    }
    addOrder(order)
    setOrderPlaced(order)
    setShowCheckout(false)
    setCart([])
    setPaymentMethod('')
    setChangeFor('')
    setCustomerAddress('')
    setCustomerNumber('')
    setCep('')
    setCepStatus('idle')
    setCepMessage('')
  }

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    sectionRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setSelectedAddOns([])
    setShowProductModal(true)
  }

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId) ? prev.filter(id => id !== addOnId) : [...prev, addOnId]
    )
  }

  const selectedAddOnsTotal = selectedProduct
    ? (selectedProduct.addOns || [])
        .filter(a => selectedAddOns.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0)
    : 0
  const modalItemTotal = (selectedProduct?.price || 0) + selectedAddOnsTotal

  const availableProducts = products.filter(p => p.available)
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Hero Banner - Mobile Optimized */}
      <div style={{
        position: 'relative',
        height: isMobile ? '160px' : '240px',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #1f2937 100%)',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}></div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.name}
                style={{
                  maxHeight: isMobile ? '110px' : '180px',
                  maxWidth: '80%',
                  objectFit: 'contain',
                  margin: '0 auto',
                  display: 'block'
                }}
              />
            ) : (
              <>
                <h1 style={{
                  fontSize: isMobile ? '28px' : '48px',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '0.05em',
                  margin: 0,
                  lineHeight: 1.1
                }}>
                  {config.name.toUpperCase()}
                </h1>
                <p style={{
                  color: '#fb923c',
                  fontSize: isMobile ? '11px' : '14px',
                  marginTop: '6px',
                  letterSpacing: '0.15em',
                  fontWeight: 500
                }}>
                  {config.subtitle.toUpperCase()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Info Card */}
      <div style={{ 
        maxWidth: '896px', 
        margin: '0 auto', 
        padding: '0 12px',
        marginTop: '-32px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: isMobile ? '16px' : '20px'
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '16px' : '22px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: 0,
            lineHeight: 1.3
          }}>
            {config.name}
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
            {config.subtitle}
          </p>

          {/* Info Pills - Responsive */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            marginTop: '12px',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              ★ 4.8 <span style={{ color: '#6b7280', fontWeight: 400 }}>(2.4k+)</span>
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              🛵 40-50 min
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              📍 2.5 km
            </span>
          </div>

          {/* Delivery Info */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: isMobile ? '8px' : '16px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f3f4f6'
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: '#15803d', 
              fontSize: '13px', 
              fontWeight: 600 
            }}>
              {'🏷️'} Entrega: {fmt(config.deliveryFee)}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: config.isOpen ? '#16a34a' : '#dc2626',
              fontSize: '13px',
              fontWeight: 500
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: config.isOpen ? '#22c55e' : '#ef4444',
                display: 'inline-block'
              }}></span>
              {config.isOpen ? 'Aberto agora' : 'Fechado'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Navigation - Mobile Optimized */}
      <div style={{
        position: 'sticky',
        top: '60px',
        zIndex: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginTop: '16px'
      }}>
        <div style={{ 
          maxWidth: '896px', 
          margin: '0 auto',
          padding: isMobile ? '10px 12px' : '12px 16px'
        }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>
            {sortedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '8px 14px' : '10px 18px',
                  borderRadius: '24px',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: activeCategory === cat.id ? '#ef4444' : '#f3f4f6',
                  color: activeCategory === cat.id ? '#ffffff' : '#374151',
                  boxShadow: activeCategory === cat.id ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: isMobile ? '16px' : '18px' }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div style={{ 
        maxWidth: '896px', 
        margin: '0 auto', 
        padding: isMobile ? '16px 12px 100px' : '24px 16px 100px'
      }}>
        {sortedCategories.map(category => {
          const categoryProducts = availableProducts.filter(p => p.categoryId === category.id)
          if (categoryProducts.length === 0) return null
          return (
            <section
              key={category.id}
              ref={el => { sectionRefs.current[category.id] = el }}
              style={{ marginBottom: isMobile ? '24px' : '32px' }}
            >
              <h3 style={{
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: isMobile ? '12px' : '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: isMobile ? '20px' : '24px' }}>{category.icon}</span>
                {category.name}
                <span style={{ 
                  fontSize: '13px', 
                  color: '#9ca3af', 
                  fontWeight: 400,
                  marginLeft: '4px'
                }}>
                  ({categoryProducts.length})
                </span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '12px' }}>
                {categoryProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={getCartQuantity(product.id)}
                    onAdd={() => {
                      // "Adicionar" entra direto no carrinho sem abrir nova página;
                      // os extras podem ser escolhidos depois pelo link na linha do carrinho
                      addToCart(product, [], true)
                    }}
                    onRemove={() => removeFromCart(product.id)}
                    onClick={() => openProductModal(product)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {/* Delivery Zones Info */}
        {deliveryZones.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: isMobile ? '20px' : '24px' }}>📍</span>
              Áreas de Entrega
            </h3>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {deliveryZones.map(zone => (
                  <div key={zone.id} style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontWeight: 600, color: '#1f2937', fontSize: '13px', margin: 0 }}>{zone.name}</p>
                    <p style={{ color: '#15803d', fontWeight: 'bold', fontSize: '14px', margin: '4px 0 0 0' }}>
                      R$ {zone.price.toFixed(2).replace('.', ',')}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0' }}>{zone.estimatedTime}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Floating Cart Button - Mobile Optimized */}
      {totalItems > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: isMobile ? '12px' : '16px',
          background: 'linear-gradient(to top, rgba(243, 244, 246, 1) 70%, rgba(243, 244, 246, 0))',
          pointerEvents: 'none'
        }}>
          <div style={{ maxWidth: '896px', margin: '0 auto', pointerEvents: 'auto' }}>
            <button
              onClick={() => setShowCart(true)}
              style={{
                width: '100%',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '14px',
                padding: isMobile ? '14px 16px' : '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {totalItems}
                </span>
                <span style={{ fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>
                  Ver carrinho
                </span>
              </div>
              <span style={{ fontWeight: 'bold', fontSize: isMobile ? '16px' : '18px' }}>
                R$ {totalPrice.toFixed(2).replace('.', ',')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal - Mobile Fullscreen */}
      {showCart && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center'
        }}>
          <div 
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowCart(false)}
          ></div>
          <div style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: isMobile ? '20px 20px 0 0' : '20px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: isMobile ? '90vh' : '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
            {/* Handle bar for mobile */}
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: '40px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}></div>
              </div>
            )}
            <div style={{ padding: isMobile ? '12px 16px' : '20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Seu Pedido
                </h3>
                <button 
                  onClick={() => setShowCart(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px' }}>
              {cart.map(item => (
                <div key={item.product.id + '|' + (item.selectedAddOns || []).map(a => a.id).sort().join(',')} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid #f9fafb'
                }}>
                  {item.product.image && (
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontWeight: 500, 
                      color: '#1f2937', 
                      fontSize: '14px',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.product.name}
                    </p>
                    {(item.product.addOns || []).length > 0 && (
                      <div style={{ margin: '6px 0 2px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Adicionais:</p>
                        {item.product.addOns.map(addOn => {
                          const checked = (item.selectedAddOns || []).some(a => a.id === addOn.id)
                          return (
                            <label
                              key={addOn.id}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer', padding: '3px 0' }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCartItemAddOn(item, addOn.id)}
                                style={{ accentColor: '#ef4444', width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                              />
                              <span>{addOn.name}</span>
                              <span style={{ color: '#15803d', fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap' }}>+ {fmt(addOn.price)}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                    <p style={{ 
                      color: '#ef4444', 
                      fontWeight: 600, 
                      fontSize: '13px',
                      margin: '2px 0 0 0'
                    }}>
                      R$ {(getItemUnitPrice(item) * item.quantity).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => removeFromCart(item.product.id, (item.selectedAddOns || []).map(a => a.id))}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        border: '1.5px solid #ef4444',
                        color: '#ef4444',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      −
                    </button>
                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item.product, (item.selectedAddOns || []).map(a => a.id), true)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: isMobile ? '16px' : '20px',
              borderTop: '1px solid #f3f4f6',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>Subtotal</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{fmt(totalPrice)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>Total</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
                  {fmt(totalPrice)}
                </span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 10px 0', textAlign: 'center' }}>
                🛵 Entrega ou retirada e forma de pagamento você escolhe a seguir
              </p>
              <button
                onClick={openCheckout}
                disabled={cart.length === 0}
                style={{
                  width: '100%',
                  backgroundColor: cart.length === 0 ? '#d1d5db' : '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '14px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  border: 'none',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Finalizar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal - aparece após "Finalizar pedido" */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center'
        }}>
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowCheckout(false)}
          ></div>
          <div style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: isMobile ? '20px 20px 0 0' : '20px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '92vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: '40px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}></div>
              </div>
            )}
            <div style={{ padding: isMobile ? '12px 16px' : '20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Finalizar pedido
                </h3>
                <button
                  onClick={() => setShowCheckout(false)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px' }}>
              {/* Nome e telefone */}
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Seu nome *
              </label>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Como podemos te chamar?"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px',
                  border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '14px', outline: 'none'
                }}
              />
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                Telefone / WhatsApp *
              </label>
              <input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px',
                  border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '18px', outline: 'none'
                }}
              />

              {/* Retirada ou entrega */}
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
                Como deseja receber seu pedido? *
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { value: 'pickup' as DeliveryType, icon: '🏪', title: 'Retirar no local', desc: config.address || 'No endereço da loja' },
                  { value: 'delivery' as DeliveryType, icon: '🛵', title: 'Entrega', desc: `${fmt(config.deliveryFee)} taxa` },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDeliveryType(opt.value)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '12px',
                      border: deliveryType === opt.value ? '2px solid #ef4444' : '1px solid #e5e7eb',
                      backgroundColor: deliveryType === opt.value ? '#fef2f2' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>{opt.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937', display: 'block' }}>{opt.title}</span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{opt.desc}</span>
                  </button>
                ))}
              </div>

              {deliveryType === 'pickup' && (
                <p style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f9fafb', padding: '10px 12px', borderRadius: '10px', margin: '0 0 18px 0' }}>
                  📍 Retirada na loja: <strong>{config.address || 'consulte o endereço'}</strong>
                </p>
              )}
              {deliveryType === 'delivery' && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    CEP
                  </label>
                  <input
                    value={cep}
                    onChange={e => handleCepChange(e.target.value)}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={9}
                    placeholder="00000-000"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px',
                      border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '4px', outline: 'none'
                    }}
                  />
                  {cepMessage && (
                    <p style={{
                      fontSize: '12px', margin: '0 0 10px 0',
                      color: cepStatus === 'ok' ? '#15803d' : cepStatus === 'error' ? '#dc2626' : '#6b7280'
                    }}>
                      {cepMessage}
                    </p>
                  )}
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px', marginTop: cepMessage ? 0 : '10px' }}>
                    Endereço de entrega *
                  </label>
                  <input
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Rua, bairro, cidade"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px',
                      border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '10px', outline: 'none'
                    }}
                  />
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Número e complemento *
                  </label>
                  <input
                    value={customerNumber}
                    onChange={e => setCustomerNumber(e.target.value)}
                    placeholder="Ex.: 123, apto 4"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px',
                      border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '8px', outline: 'none'
                    }}
                  />
                  {deliveryZones.length > 0 && (
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                      Bairros atendidos: {deliveryZones.map(z => z.name).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Forma de pagamento */}
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
                Forma de pagamento *
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                {([
                  { value: 'card' as PaymentMethod, icon: '💳', title: 'Cartão' },
                  { value: 'pix' as PaymentMethod, icon: '📱', title: 'PIX' },
                  { value: 'cash' as PaymentMethod, icon: '💵', title: 'Dinheiro' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '12px',
                      border: paymentMethod === opt.value ? '2px solid #ef4444' : '1px solid #e5e7eb',
                      backgroundColor: paymentMethod === opt.value ? '#fef2f2' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>{opt.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1f2937' }}>{opt.title}</span>
                  </button>
                ))}
              </div>
              {paymentMethod === 'card' && (
                <p style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f9fafb', padding: '10px 12px', borderRadius: '10px', margin: '0 0 18px 0' }}>
                  💳 O cartão é passado na entrega{deliveryType === 'pickup' ? ' na retirada' : ''} pela nossa equipe.
                </p>
              )}
              {paymentMethod === 'pix' && (
                <p style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f9fafb', padding: '10px 12px', borderRadius: '10px', margin: '0 0 18px 0' }}>
                  📱 Você receberá a chave PIX pelo WhatsApp ({config.phone || 'telefone da loja'}) após finalizar o pedido.
                </p>
              )}
              {paymentMethod === 'cash' && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Precisa de troco para quanto? (opcional)
                  </label>
                  <input
                    value={changeFor}
                    onChange={e => setChangeFor(e.target.value)}
                    placeholder={`Ex.: ${fmt(Math.ceil(checkoutTotal / 10) * 10)}`}
                    inputMode="decimal"
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '10px',
                      border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none'
                    }}
                  />
                  {changeValue > checkoutTotal && (
                    <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px' }}>
                      Troco de {fmt(changeValue - checkoutTotal)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resumo + confirmar */}
            <div style={{
              padding: isMobile ? '16px' : '20px',
              borderTop: '1px solid #f3f4f6',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>Subtotal</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{fmt(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>
                  {deliveryType === 'delivery' ? 'Taxa de entrega' : 'Retirada no local'}
                </span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#16a34a' }}>
                  {deliveryType === 'delivery' ? fmt(config.deliveryFee) : 'Grátis'}
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', paddingTop: '12px',
                borderTop: '1px solid #e5e7eb', marginBottom: '12px'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>Total</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{fmt(checkoutTotal)}</span>
              </div>
              {!canPlaceOrder && (
                <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '0 0 8px 0' }}>
                  Preencha nome, telefone{deliveryType === 'delivery' ? ', endereço, número' : ''} e forma de pagamento
                </p>
              )}
              <button
                onClick={placeOrder}
                disabled={!canPlaceOrder}
                style={{
                  width: '100%',
                  backgroundColor: canPlaceOrder ? '#16a34a' : '#d1d5db',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '14px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  border: 'none',
                  cursor: canPlaceOrder ? 'pointer' : 'not-allowed',
                  boxShadow: canPlaceOrder ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none'
                }}
              >
                Confirmar pedido • {fmt(checkoutTotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de pedido */}
      {orderPlaced && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
          <div style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            padding: '28px 20px',
            textAlign: 'center',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '30px'
            }}>
              ✅
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 6px' }}>
              Pedido enviado!
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>
              Seu pedido <strong>{orderPlaced.id}</strong> foi recebido com sucesso.
            </p>
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '14px', textAlign: 'left', marginBottom: '18px' }}>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px' }}>
                {orderPlaced.deliveryType === 'delivery' ? '🛵 Entrega' : '🏪 Retirada no local'}
                {orderPlaced.deliveryType === 'delivery' ? `: ${orderPlaced.customerAddress}` : ''}
              </p>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 6px' }}>
                💰 Pagamento: {paymentLabels[orderPlaced.paymentMethod]}
                {orderPlaced.changeFor ? ` (troco para ${fmt(orderPlaced.changeFor)})` : ''}
              </p>
              <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
                🧾 Total: <strong>{fmt(orderPlaced.total + orderPlaced.deliveryFee)}</strong>
              </p>
            </div>
            <button
              onClick={() => setOrderPlaced(null)}
              style={{
                width: '100%', backgroundColor: '#ef4444', color: 'white', borderRadius: '12px',
                padding: '14px', fontWeight: 'bold', fontSize: '15px', border: 'none', cursor: 'pointer'
              }}
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal - Mobile Fullscreen */}
      {showProductModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center'
        }}>
          <div 
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => { setShowProductModal(false); setEditingCartKey(null) }}
          ></div>
          <div style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: isMobile ? '20px 20px 0 0' : '20px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: isMobile ? '92vh' : '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Handle bar for mobile */}
            {isMobile && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '10px 0 0',
                backgroundColor: 'white',
                position: 'relative',
                zIndex: 2
              }}>
                <div style={{ width: '40px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}></div>
              </div>
            )}
            {/* Image */}
            <div style={{ 
              position: 'relative', 
              height: isMobile ? '200px' : '240px', 
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {selectedProduct.image ? (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #fb923c, #ef4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '64px' }}>🍔</span>
                </div>
              )}
              <button 
                onClick={() => { setShowProductModal(false); setEditingCartKey(null) }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <h3 style={{ 
                  fontSize: isMobile ? '18px' : '22px', 
                  fontWeight: 'bold', 
                  color: '#1f2937',
                  margin: 0,
                  flex: 1
                }}>
                  {selectedProduct.name}
                </h3>
                {selectedProduct.popular && (
                  <span style={{
                    backgroundColor: '#fff7ed',
                    color: '#ea580c',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap'
                  }}>
                    🔥 Popular
                  </span>
                )}
              </div>
              <p style={{ 
                color: '#6b7280', 
                marginTop: '10px', 
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: 1.6,
                margin: '10px 0 0 0'
              }}>
                {selectedProduct.description}
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginTop: '20px'
              }}>
                <span style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 'bold', color: '#1f2937' }}>
                  R$ {modalItemTotal.toFixed(2).replace('.', ',')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => removeFromCart(selectedProduct.id, selectedAddOns)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: '2px solid #ef4444',
                      color: '#ef4444',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    −
                  </button>
                  <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                    {getCartQuantity(selectedProduct.id)}
                  </span>
                  <button
                    onClick={() => addToCart(selectedProduct, selectedAddOns, true)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Adicionais */}
              {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    ➕ Adicione extras
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedProduct.addOns.map(addOn => {
                      const checked = selectedAddOns.includes(addOn.id)
                      return (
                        <label
                          key={addOn.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: checked ? '2px solid #ef4444' : '1.5px solid #e5e7eb',
                            backgroundColor: checked ? '#fef2f2' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddOn(addOn.id)}
                            style={{ width: '18px', height: '18px', accentColor: '#ef4444', flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                            {addOn.name}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#15803d', whiteSpace: 'nowrap' }}>
                            + R$ {addOn.price.toFixed(2).replace('.', ',')}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div style={{ 
              padding: isMobile ? '16px' : '20px', 
              borderTop: '1px solid #f3f4f6',
              backgroundColor: 'white'
            }}>
              <button 
                onClick={() => {
                  if (editingCartKey) { updateCartItemAddOns(); return }
                  addToCart(selectedProduct, selectedAddOns)
                  setShowProductModal(false)
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '14px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                {editingCartKey ? 'Salvar alterações' : (
                  <>
                    <span style={{ fontSize: '18px' }}>+</span>
                    Adicionar • R$ {modalItemTotal.toFixed(2).replace('.', ',')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Product Card Component - Mobile Optimized
function ProductCard({ product, quantity, onAdd, onRemove, onClick, isMobile }: {
  product: Product
  quantity: number
  onAdd: () => void
  onRemove: () => void
  onClick: () => void
  isMobile: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        border: '1px solid #f3f4f6'
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Image */}
      <div style={{ 
        width: isMobile ? '110px' : '140px', 
        flexShrink: 0,
        position: 'relative'
      }}>
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '110px' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            minHeight: '110px',
            background: 'linear-gradient(135deg, #fed7aa, #fecaca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '36px' }}>🍔</span>
          </div>
        )}
        {quantity > 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '3px 8px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {quantity}x
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        padding: isMobile ? '10px 12px' : '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minWidth: 0
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap' }}>
            <h4 style={{ 
              fontWeight: 600, 
              color: '#1f2937', 
              fontSize: isMobile ? '13px' : '15px',
              margin: 0,
              lineHeight: 1.3,
              flex: 1
            }}>
              {product.name}
            </h4>
            {product.popular && (
              <span style={{
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                🔥
              </span>
            )}
          </div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: isMobile ? '11px' : '12px',
            marginTop: '4px',
            lineHeight: 1.4,
            margin: '4px 0 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginTop: '8px',
          gap: '8px'
        }}>
          <span style={{ 
            color: '#15803d', 
            fontWeight: 'bold', 
            fontSize: isMobile ? '14px' : '16px',
            whiteSpace: 'nowrap'
          }}>
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          {quantity > 0 ? (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={onRemove}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1.5px solid #ef4444',
                  color: '#ef4444',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                −
              </button>
              <span style={{ 
                width: '20px', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                fontSize: '14px'
              }}>
                {quantity}
              </span>
              <button
                onClick={onAdd}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onAdd() }}
              style={{
                border: '1.5px solid #ef4444',
                color: '#ef4444',
                borderRadius: '8px',
                padding: isMobile ? '6px 12px' : '8px 14px',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: 600,
                backgroundColor: 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuView
