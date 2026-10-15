import { createServerFn } from '@tanstack/react-start'
import { errorPt } from './errors-pt'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// Equipe da loja: dono/admin cria e remove acessos. Usa a chave de serviço só no servidor.
type Input = {
  action: 'list' | 'add' | 'remove' | 'role'
  storeId: string
  email?: string
  password?: string
  name?: string
  userId?: string
  role?: 'admin' | 'staff'
}

function validate(raw: any): Input {
  const d = raw || {}
  if (!['list', 'add', 'remove', 'role'].includes(d.action)) throw new Error('Ação inválida.')
  if (!/^[0-9a-f-]{36}$/i.test(String(d.storeId || ''))) throw new Error('Loja inválida.')
  const out: Input = { action: d.action, storeId: String(d.storeId) }
  if (d.role !== undefined) {
    if (d.role !== 'admin' && d.role !== 'staff') throw new Error('Perfil inválido.')
    out.role = d.role
  }
  if (d.userId) out.userId = String(d.userId)
  if (d.action === 'add') {
    out.email = String(d.email || '').trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(out.email)) throw new Error('E-mail inválido.')
    if (d.password) out.password = String(d.password)
    out.name = String(d.name || '').slice(0, 80)
    if (!out.role) out.role = 'staff'
  }
  if ((d.action === 'remove' || d.action === 'role') && !out.userId) throw new Error('Usuário não informado.')
  if (d.action === 'role' && !out.role) throw new Error('Perfil não informado.')
  return out
}

export const teamAction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const admin: any = supabaseAdmin

    const { data: isSuper } = await sb.rpc('is_super_admin')
    const { data: mine } = await admin.from('store_members').select('role').eq('store_id', data.storeId).eq('user_id', context.userId).maybeSingle()
    const myRole: string | null = isSuper ? 'owner' : mine?.role ?? null
    if (myRole !== 'owner' && myRole !== 'admin') throw new Error('Apenas o dono ou administradores gerenciam a equipe.')

    if (data.action === 'list') {
      const { data: rows, error } = await admin.from('store_members').select('user_id, role').eq('store_id', data.storeId)
      if (error) throw new Error(errorPt(error))
      const out = []
      for (const r of rows || []) {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id)
        out.push({
          userId: r.user_id,
          role: r.role,
          email: u?.user?.email || '',
          name: u?.user?.user_metadata?.name || '',
        })
      }
      out.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : a.email.localeCompare(b.email)))
      return { members: out, me: context.userId }
    }

    if (data.action === 'add') {
      let userId: string | null = null
      let created = false
      // procura usuário existente pelo e-mail
      for (let page = 1; page <= 20 && !userId; page++) {
        const { data: res, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
        if (error) throw new Error(errorPt(error))
        const hit = (res?.users || []).find((u: any) => String(u.email || '').toLowerCase() === data.email)
        if (hit) userId = hit.id
        if (!res?.users || res.users.length < 200) break
      }
      if (!userId) {
        if (!data.password || data.password.length < 6) throw new Error('Defina uma senha de pelo menos 6 caracteres para o novo acesso.')
        const { data: cu, error } = await admin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { name: data.name || '' },
        })
        if (error || !cu?.user) {
          const exists = /already|registered|exists/i.test(error?.message || '')
          throw new Error(exists ? 'Esse e-mail já tem conta. Tente adicionar novamente.' : errorPt(error, 'Não foi possível criar o acesso.'))
        }
        userId = cu.user.id
        created = true
      }
      const { data: other } = await admin.from('store_members').select('store_id').eq('user_id', userId).limit(1)
      if (other && other.length) {
        throw new Error(other[0].store_id === data.storeId ? 'Essa pessoa já tem acesso a esta loja.' : 'Esse e-mail já pertence a outra loja.')
      }
      const { error: ie } = await admin.from('store_members').insert({ store_id: data.storeId, user_id: userId, role: data.role })
      if (ie) throw new Error(errorPt(ie))
      return { ok: true, created }
    }

    // remove / role: nunca mexe no dono
    const { data: target } = await admin.from('store_members').select('role').eq('store_id', data.storeId).eq('user_id', data.userId).maybeSingle()
    if (!target) throw new Error('Pessoa não encontrada nesta loja.')
    if (target.role === 'owner') throw new Error('O dono da loja não pode ser alterado.')
    if (data.userId === context.userId) throw new Error('Você não pode alterar o próprio acesso.')
    if (target.role === 'admin' && myRole === 'admin') throw new Error('Só o dono pode alterar outros administradores.')

    if (data.action === 'remove') {
      const { error } = await admin.from('store_members').delete().eq('store_id', data.storeId).eq('user_id', data.userId)
      if (error) throw new Error(errorPt(error))
      return { ok: true }
    }
    if (data.role === 'admin' && myRole === 'admin') throw new Error('Só o dono pode promover administradores.')
    const { error } = await admin.from('store_members').update({ role: data.role }).eq('store_id', data.storeId).eq('user_id', data.userId)
    if (error) throw new Error(errorPt(error))
    return { ok: true }
  })
