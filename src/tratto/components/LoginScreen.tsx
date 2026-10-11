// @ts-nocheck -- código original migrado sem alterações de lógica
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { isCurrentUserAdmin } from '../context/StoreContext'

interface LoginScreenProps {
  onLogin: () => void
  onBack: () => void
}

function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        setError('E-mail ou senha incorretos. Tente novamente.')
        setLoading(false)
        return
      }
      const ok = await isCurrentUserAdmin()
      if (!ok) {
        await supabase.auth.signOut()
        setError('Acesso negado: esta conta não é de administrador.')
        setLoading(false)
        return
      }
      onLogin()
    } catch {
      setError('Não foi possível entrar agora. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-red-500/20 mb-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail do Administrador
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="seu@email.com"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔒
                </span>
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <span>⚠️</span> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || !email}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                loading || !password || !email
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
