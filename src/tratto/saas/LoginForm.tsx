// @ts-nocheck
import { useState } from 'react'
import { errorPt } from '@/lib/errors-pt'
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
    if (err) return setError(err.code === 'email_not_confirmed' || /not confirmed/i.test(err.message || '') ? errorPt(err) : 'E-mail ou senha incorretos.')
    onDone && onDone()
  }
  const reset = async () => {
    if (!email.trim()) return setError('Digite seu e-mail para receber o link de redefinição.')
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/painel' })
    if (err) return setError(errorPt(err, 'Não foi possível enviar o e-mail agora.'))
    setResetSent(true)
  }
  const cls = 'auth-input'
  return (
    <form onSubmit={submit} className="auth-form space-y-3">
      {title && <h1 className="auth-title text-xl font-bold">{title}</h1>}
      {subtitle && <p className="auth-subtitle text-sm -mt-1">{subtitle}</p>}
      <label className="auth-label block text-sm font-medium">E-mail
        <input type="email" required autoComplete="email" className={cls} value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="auth-label block text-sm font-medium">Senha
        <input type="password" required autoComplete="current-password" className={cls} value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      {error && <p className="auth-error text-sm">{error}</p>}
      {resetSent && <p className="auth-success text-sm">Enviamos o link de redefinição para o seu e-mail.</p>}
      <button disabled={loading} className="auth-primary w-full disabled:opacity-60 font-semibold rounded-lg py-2.5 text-sm">
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <button type="button" onClick={reset} className="auth-link w-full text-xs underline">Esqueci minha senha</button>
    </form>
  )
}
