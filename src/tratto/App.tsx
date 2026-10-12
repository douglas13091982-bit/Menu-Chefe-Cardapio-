// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState, useEffect } from 'react'
import { trackMenuPageView } from './marketing'
import { StoreProvider, isCurrentUserAdmin } from './context/StoreContext'
import { supabase } from '@/integrations/supabase/client'
import MenuView from './components/MenuView'
import AdminPanel from './components/admin/AdminPanel'
import LoginScreen from './components/LoginScreen'

type View = 'menu' | 'login' | 'admin'

function App() {
  const [view, setView] = useState<View>('menu')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Sessão real do Supabase: só conta como logado quem tem o papel 'admin'
  useEffect(() => {
    let active = true
    isCurrentUserAdmin()
      .then(ok => { if (active) setIsAuthenticated(ok) })
      .catch(() => { if (active) setIsAuthenticated(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setView(v => (v === 'admin' ? 'menu' : v))
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  // Meta Pixel: PageView ao abrir o cardápio (só se houver Pixel ID salvo)
  useEffect(() => {
    if (view === 'menu') trackMenuPageView()
  }, [view])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setView('admin')
  }

  const handleLogout = async () => {
    try { await supabase.auth.signOut() } catch {}
    setIsAuthenticated(false)
    setView('menu')
  }

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setView('admin')
    } else {
      setView('login')
    }
  }

  // Login screen (full screen, no navbar)
  if (view === 'login') {
    return (
      <StoreProvider>
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setView('menu')}
        />
      </StoreProvider>
    )
  }

  return (
    <StoreProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Top Navigation Bar - Always Visible */}
        <nav 
          style={{
            position: view === 'menu' ? 'absolute' : 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: view === 'menu' ? 40 : 99999,
            backgroundColor: view === 'menu' ? 'transparent' : '#ffffff',
            borderBottom: view === 'menu' ? 'none' : '3px solid #ef4444',
            boxShadow: view === 'menu' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            height: view === 'menu' ? '52px' : '60px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Logo (no cardápio o banner já mostra a marca) */}
            <div style={{ display: view === 'menu' ? 'none' : 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#ef4444',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                flexShrink: 0
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>T</span>
              </div>
              <div className="hidden sm:block">
                <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '15px', lineHeight: '1.2', margin: 0 }}>Tratto</p>
                <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.2', margin: 0 }}>Hamburgueria</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: view === 'menu' ? 'auto' : 0 }}>
              <button
                onClick={() => setView('menu')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: view === 'menu' ? 'rgba(239,68,68,0.92)' : '#f3f4f6',
                  backdropFilter: view === 'menu' ? 'blur(6px)' : undefined,
                  color: view === 'menu' ? '#ffffff' : '#374151',
                  boxShadow: view === 'menu' ? '0 2px 4px rgba(239, 68, 68, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (view !== 'menu') {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }
                }}
                onMouseOut={(e) => {
                  if (view !== 'menu') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>🍔</span>
                <span className="hidden sm:inline">Cardápio</span>
              </button>
              <button
                onClick={handleAdminClick}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: view === 'admin' ? '#ef4444' : (view === 'menu' ? 'rgba(255,255,255,0.85)' : '#f3f4f6'),
                  backdropFilter: view === 'menu' ? 'blur(6px)' : undefined,
                  color: view === 'admin' ? '#ffffff' : '#374151',
                  boxShadow: view === 'admin' ? '0 2px 4px rgba(239, 68, 68, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (view !== 'admin') {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }
                }}
                onMouseOut={(e) => {
                  if (view !== 'admin') {
                    e.currentTarget.style.backgroundColor = view === 'menu' ? 'rgba(255,255,255,0.85)' : '#f3f4f6'
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span className="hidden sm:inline">Admin</span>
              </button>
              {isAuthenticated && view === 'admin' && (
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2'
                    e.currentTarget.style.color = '#dc2626'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.color = '#374151'
                  }}
                  title="Sair"
                >
                  <span style={{ fontSize: '16px' }}>🚪</span>
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ paddingTop: view === 'menu' ? 0 : '60px' }}>
          {view === 'menu' ? <MenuView /> : <AdminPanel />}
        </main>
      </div>
    </StoreProvider>
  )
}

export default App
