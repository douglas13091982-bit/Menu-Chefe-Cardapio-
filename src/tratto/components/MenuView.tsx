// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { Product, CartItem, ProductAddOn } from '../types'

// preço unitário do item do carrinho (produto + adicionais selecionados)
const getItemUnitPrice = (item: CartItem) =>
  item.product.price + (item.selectedAddOns || []).reduce((sum, a) => sum + a.price, 0)

function MenuView() {
  const { config, products, categories, deliveryZones } = useStore()
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const addToCart = (product: Product, addOnIds: string[] = []) => {
    const chosenAddOns = (product.addOns || []).filter(a => addOnIds.includes(a.id))
    setCart(prev => {
      const keyOf = (item: CartItem) =>
        item.product.id + '|' + [...(item.selectedAddOns || [])].map(a => a.id).sort().join(',')
      const key = product.id + '|' + chosenAddOns.map(a => a.id).sort().join(',')
      const existing = prev.find(item => keyOf(item) === key)
      if (existing) {
        return prev.map(item => keyOf(item) === key ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1, selectedAddOns: chosenAddOns }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      // remove o último item que contenha esse produto (com ou sem adicionais)
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].product.id === productId) {
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

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0)

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
              🏷️ Entrega: R$ {config.deliveryFee.toFixed(2).replace('.', ',')}
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
                    onAdd={() => addToCart(product)}
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
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p style={{ 
                        color: '#6b7280', 
                        fontSize: '11px',
                        margin: '2px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        + {item.selectedAddOns.map(a => a.name).join(', ')}
                      </p>
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
                      onClick={() => removeFromCart(item.product.id)}
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
                      onClick={() => addToCart(item.product)}
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
                <span style={{ fontWeight: 600, fontSize: '13px' }}>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px' }}>Taxa de entrega</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#16a34a' }}>
                  R$ {config.deliveryFee.toFixed(2).replace('.', ',')}
                </span>
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
                  R$ {(totalPrice + config.deliveryFee).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <button style={{
                width: '100%',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '12px',
                padding: '14px',
                fontWeight: 'bold',
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                Finalizar pedido
              </button>
            </div>
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
            onClick={() => setShowProductModal(false)}
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
                onClick={() => setShowProductModal(false)}
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
                    onClick={() => removeFromCart(selectedProduct.id)}
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
                    onClick={() => addToCart(selectedProduct, selectedAddOns)}
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
                onClick={() => { addToCart(selectedProduct, selectedAddOns); setShowProductModal(false) }}
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
                <span style={{ fontSize: '18px' }}>+</span>
                Adicionar • R$ {modalItemTotal.toFixed(2).replace('.', ',')}
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
