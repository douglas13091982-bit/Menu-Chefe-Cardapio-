import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// A chave do GeckoAPI vive só no servidor (variável de ambiente GECKO_API_KEY).
// O navegador nunca a recebe: ele chama esta função, que confere se quem chama é admin.
const ENDPOINT = 'https://api.geckoapi.com.br/v1/extract'

type Input = {
  target: 'ifood.com.br' | 'pede.ai'
  type: 'pdp' | 'plp'
  url?: string
  merchantId?: string
  zipCode?: string
}

function validate(raw: any): Input {
  const d = raw || {}
  if (d.target !== 'ifood.com.br' && d.target !== 'pede.ai') throw new Error('Fonte não permitida.')
  if (d.type !== 'pdp' && d.type !== 'plp') throw new Error('Tipo não permitido.')
  const out: Input = { target: d.target, type: d.type }
  if (d.target === 'ifood.com.br') {
    let u: URL
    try { u = new URL(String(d.url || '')) } catch { throw new Error('Link da loja inválido.') }
    if (u.protocol !== 'https:' || !/(^|\.)ifood\.com\.br$/.test(u.hostname)) {
      throw new Error('O link precisa ser de uma loja do iFood (ifood.com.br).')
    }
    out.url = u.toString()
  } else {
    out.zipCode = String(d.zipCode || '').slice(0, 12)
    if (!out.zipCode) throw new Error('Informe o CEP.')
    if (d.type === 'pdp') {
      out.merchantId = String(d.merchantId || '').slice(0, 40)
      if (!out.merchantId) throw new Error('Informe o ID da loja.')
    }
  }
  return out
}

export const geckoExtract = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (error || !isAdmin) throw new Error('Apenas administradores podem importar catálogo.')

    const key = process.env['GECKO_API_KEY']
    if (!key) throw new Error('A chave do GeckoAPI não está configurada no servidor (GECKO_API_KEY).')

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json: any = await res.json().catch(() => null)
    if (!res.ok) {
      const code = json?.errorCode || res.status
      const msg: Record<string, string> = {
        UNAUTHORIZED: 'Chave do GeckoAPI inválida no servidor.',
        INSUFFICIENT_CREDITS: 'Sem créditos no GeckoAPI.',
        INVALID_PAYLOAD: 'Dados inválidos (confira o link, o ID da loja e o CEP).',
        RATE_LIMIT_EXCEEDED: 'Muitas requisições. Tente de novo em instantes.',
      }
      throw new Error(msg[code] || `Erro do GeckoAPI (${code}).`)
    }
    return json
  })
