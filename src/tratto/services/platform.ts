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

/** Lê as configurações; `null` quando ainda não existem ou a leitura falha. */
export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  // "select *" evita quebrar enquanto alguma migração de coluna nova ainda não foi aplicada
  const { data, error } = await (supabase as any).from('platform_settings').select('*').eq('id', 'main').maybeSingle()
  if (error) console.error('Erro ao carregar configurações da plataforma:', error)
  return (data as PlatformSettings | null) ?? null
}
