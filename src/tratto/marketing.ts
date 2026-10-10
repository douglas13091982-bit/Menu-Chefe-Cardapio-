// Configurações de marketing (localStorage, chave store_marketing)
export interface MarketingConfig {
  pixelId: string
  accessToken: string
}

export const MARKETING_KEY = 'store_marketing'

export function loadMarketing(): MarketingConfig {
  try {
    const stored = localStorage.getItem(MARKETING_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { pixelId: String(parsed.pixelId || ''), accessToken: String(parsed.accessToken || '') }
    }
  } catch {}
  return { pixelId: '', accessToken: '' }
}

export function saveMarketing(data: MarketingConfig) {
  localStorage.setItem(MARKETING_KEY, JSON.stringify(data))
}

let loadedPixelId: string | null = null

// Carrega o Meta Pixel (fbq) e dispara PageView. Não faz nada se não houver Pixel ID.
export function trackMenuPageView() {
  const { pixelId } = loadMarketing()
  if (!/^\d+$/.test(pixelId)) return
  const w = window as any
  if (!w.fbq) {
    const n: any = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args)
    }
    w.fbq = n
    if (!w._fbq) w._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
  }
  if (loadedPixelId !== pixelId) {
    w.fbq('init', pixelId)
    loadedPixelId = pixelId
  }
  w.fbq('track', 'PageView')
}
