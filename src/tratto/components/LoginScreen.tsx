import { useState } from 'react'

interface LoginScreenProps {
  onLogin: (remember: boolean) => void
  onBack: () => void
}

const ADMIN_PASSWORD_KEY = 'admin_password'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

/** Lê a senha configurada diretamente do storage no momento da validação. */
function readStoredPassword(): string {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD
  } catch {
    return DEFAULT_ADMIN_PASSWORD
  }
}

function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    // Simula delay de autenticação
    setTimeout(() => {
      // A senha é lida no momento do submit: alterações feitas no painel
      // passam a valer imediatamente, sem precisar recarregar a página.
      if (password === readStoredPassword()) {
        onLogin(remember)
      } else {
        setError('Senha incorreta. Tente novamente.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-red-500/20 mb-4" aria-hidden="true">
            <span className="text-white text-3xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Tratto Hamburgueria</h1>
          <p className="text-gray-400 text-sm mt-1">Painel Administrativo</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Bem-vindo de volta!</h2>
            <p className="text-gray-500 text-sm mt-1">Acesse o painel de gerenciamento</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha do Administrador
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">
                  🔒
                </span>
              </div>
              {error && (
                <p role="alert" className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <span aria-hidden="true">⚠️</span> {error}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-600">Manter conectado neste navegador</span>
            </label>

            <button
              type="submit"
              disabled={loading || !password}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                loading || !password
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></span>
                  Entrando...
                </span>
              ) : (
                'Acessar Painel'
              )}
            </button>
          </form>
        </div>

        {/* Back button */}
        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mx-auto transition-colors"
          >
            ← Voltar ao cardápio
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
