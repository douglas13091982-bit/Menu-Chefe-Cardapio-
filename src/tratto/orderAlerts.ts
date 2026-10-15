// Aviso de novo pedido no painel (som e impressão automática).
// O aviso pode chegar por duas vias: Realtime do Supabase (instantâneo) ou pela consulta periódica
// (fallback, a cada ~8 s). O anunciador garante que cada pedido seja anunciado UMA vez só.

export interface AnnounceableOrder { id: string; status?: string }

export function createOrderAnnouncer() {
  const known = new Set<string>()
  let seeded = false
  return {
    /** Recomeça do zero (troca de loja ou de login). */
    reset() { known.clear(); seeded = false },
    /** Marca como já conhecido (ex.: pedido lançado manualmente pelo próprio lojista: não deve tocar). */
    markKnown(id: string) { if (id) known.add(id) },
    /** Aviso do Realtime (INSERT). Retorna true se for novo e deve ser anunciado. */
    fromRealtime(order: AnnounceableOrder | null | undefined): boolean {
      if (!order?.id || known.has(order.id)) return false
      known.add(order.id)
      return true
    },
    /**
     * Consulta periódica. A primeira só registra o que já existia (não toca ao abrir o painel);
     * as seguintes devolvem os pedidos pendentes que ainda não foram anunciados.
     */
    fromPoll<T extends AnnounceableOrder>(orders: T[]): T[] {
      if (!seeded) {
        orders.forEach(o => o?.id && known.add(o.id))
        seeded = true
        return []
      }
      const fresh = orders.filter(o => o?.id && o.status === 'pending' && !known.has(o.id))
      fresh.forEach(o => known.add(o.id))
      return fresh
    },
  }
}

/** Toca o MP3 da loja. O navegador pode bloquear até o lojista clicar em algo na página: nesse caso só avisa no console. */
export function playOrderSound(url?: string): void {
  if (!url || typeof window === 'undefined') return
  try {
    const audio = new Audio(url)
    audio.volume = 1
    void audio.play().catch(error => console.warn('Som de novo pedido bloqueado pelo navegador. Clique em qualquer lugar do painel (ou em "Testar e ativar som") para liberar.', error))
  } catch (error) {
    console.warn('Não foi possível reproduzir o som de novo pedido.', error)
  }
}
