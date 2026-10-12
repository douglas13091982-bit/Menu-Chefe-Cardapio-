// @ts-nocheck
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export default function LoginForm({ onDone, title, subtitle }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) return setError('E-mail ou senha incorretos.')
    onDone && onDone()
  }
  const reset = async () => {
    if (!email.trim()) return setError('Digite seu e-mail para receber o link de redefinição.')
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/painel' })
    if (err) return setError('Não foi possível enviar o e-mail agora.')
    setResetSent(true)
  }
  const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9273f]/30'
  return (
    <form onSubmit={submit} className="space-y-3">
      {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
      {subtitle && <p className="text-sm text-gray-500 -mt-1">{subtitle}</p>}
      <label className="block text-sm font-medium text-gray-700">E-mail
        <input type="email" required autoComplete="email" className={cls} value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-gray-700">Senha
        <input type="password" required autoComplete="current-password" className={cls} value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {resetSent && <p className="text-sm text-green-700">Enviamos o link de redefinição para o seu e-mail.</p>}
      <button disabled={loading} className="w-full bg-[#d9273f] hover:bg-[#c01f35] disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm">
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <button type="button" onClick={reset} className="w-full text-xs text-gray-500 underline">Esqueci minha senha</button>
    </form>
  )
}
