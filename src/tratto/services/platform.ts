import { supabase } from '@/integrations/supabase/client'

/** Configurações globais da plataforma (linha única `platform_settings`, legível por todos). */
export interface PlatformSettings {
  system_name?: string
  logo_url?: string | null
  hero_background_url?: string | null
  plan_name: string
  price_cents: number
  trial_days: number
  contact_whatsapp: string
  pix_key?: string
  pix_holder?: string
  pix_city?: string
}

const first = <T,>(data: unknown): T | null => (Array.isArray(data) ? (data[0] as T) : (data as T)) ?? null

/** Dados públicos (nome, logo, preço, WhatsApp). Sem chave Pix. Disponível para qualquer visitante. */
export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  const { data, error } = await (supabase as any).rpc('get_platform_public')
  if (error) console.error('Erro ao carregar configurações da plataforma:', error)
  return first<PlatformSettings>(data)
}

/** Dados de cobrança (inclui chave Pix): só para quem tem loja ou é super admin. */
export async function fetchPlatformBilling(): Promise<Partial<PlatformSettings> | null> {
  const { data, error } = await (supabase as any).rpc('get_platform_billing')
  if (error) console.error('Erro ao carregar dados de cobrança:', error)
  return first<Partial<PlatformSettings>>(data)
}

/** Leitura completa para o super admin (a tabela só é legível por ele). */
export async function fetchPlatformSettingsAdmin(): Promise<PlatformSettings | null> {
  const { data, error } = await (supabase as any).from('platform_settings').select('*').eq('id', 'main').maybeSingle()
  if (error) console.error('Erro ao carregar configurações da plataforma:', error)
  return (data as PlatformSettings | null) ?? null
}
