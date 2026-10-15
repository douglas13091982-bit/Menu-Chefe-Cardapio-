// PWA por loja: cada cardápio (/slug) pode ser instalado como um app próprio,
// com o nome, o ícone (logo) e as cores da loja. Tudo é gerado no navegador a partir
// dos dados já carregados da loja, sem rota de servidor nem service worker.
import { extractLogoBackground } from './logoColor'

const TAG = 'data-store-pwa'
export const DEFAULT_THEME = '#d9273f'

// ---------- Funções puras (testáveis) ----------

/** Nome curto para o ícone da tela inicial. Nunca corta palavra no meio (o Android abrevia com "…" sozinho). */
export function pwaShortName(name: string): string {
  const n = (name || '').trim() || 'Cardápio'
  if (n.length <= 12) return n
  const first = n.split(/\s+/)[0] || ''
  // várias palavras: usa a primeira se couber; uma palavra só (ou longa demais): mantém o nome inteiro
  return first.length >= 3 && first.length <= 12 ? first : n
}

/** Hash curto e estável de um texto (versiona o ícone na URL para furar o cache quando ele muda). */
export function hashString(value: string): string {
  let h = 5381
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Aceita #rgb ou #rrggbb; qualquer outra coisa vira o padrão. */
export function safeHex(value: string | undefined, fallback = DEFAULT_THEME): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((value || '').trim())
  if (!m) return fallback
  let h = m[1]
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return '#' + h.toLowerCase()
}

/** Cor do texto (branco ou escuro) que fica legível sobre o fundo informado. */
export function readableOn(hex: string): string {
  const n = parseInt(safeHex(hex).slice(1), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#1f2937' : '#ffffff'
}

/** Primeira letra do nome, para a loja sem logo. */
export function storeInitial(name: string): string {
  const m = (name || '').trim().match(/[\p{L}\p{N}]/u)
  return (m ? m[0] : 'C').toUpperCase()
}

export interface ManifestIcon { src: string; sizes: string; type: string; purpose?: string }

export interface ManifestInput {
  slug: string
  name: string
  origin: string
  themeColor?: string | undefined
  backgroundColor?: string | undefined
  icons: ManifestIcon[]
}

/** Manifest do app de UMA loja: abre direto no cardápio dela e é um app distinto de outras lojas. */
export function buildManifest(input: ManifestInput) {
  const slug = encodeURIComponent(input.slug)
  const base = `${input.origin.replace(/\/+$/, '')}/${slug}`
  return {
    id: base,
    name: (input.name || '').trim() || 'Cardápio',
    short_name: pwaShortName(input.name),
    description: `Cardápio digital de ${(input.name || '').trim() || 'nossa loja'}`,
    lang: 'pt-BR',
    start_url: base,
    // sem barra final: cobre /slug e /slug/..., e não invade o app de outra loja
    scope: base,
    display: 'standalone',
    orientation: 'portrait',
    theme_color: safeHex(input.themeColor),
    background_color: safeHex(input.backgroundColor, '#ffffff'),
    icons: input.icons,
  }
}

// ---------- Ícone (canvas) ----------

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function paintIcon(size: number, bg: string, img: HTMLImageElement | null, letter: string, fg: string): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size) // fundo sangrando até a borda (o sistema aplica a máscara redonda)
  if (img && img.naturalWidth > 0) {
    // mantém a proporção da logo e respeita a "zona segura" de ícones adaptáveis (~62%)
    const box = size * 0.62
    const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
  } else {
    ctx.fillStyle = fg
    ctx.font = `700 ${Math.round(size * 0.5)}px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, size / 2, size / 2 + size * 0.03)
  }
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null // canvas "contaminado" por logo de outro domínio sem CORS
  }
}

/** PNG quadrado da loja: logo centralizada sobre a cor de fundo da logo; sem logo, a inicial na cor da loja. */
export async function buildStoreIcon(
  size: number,
  opts: { logoUrl?: string; accent: string; name: string },
): Promise<string> {
  const accent = safeHex(opts.accent)
  const letter = storeInitial(opts.name)
  if (opts.logoUrl) {
    const [img, logoBg] = await Promise.all([loadImage(opts.logoUrl), extractLogoBackground(opts.logoUrl)])
    if (img) {
      const out = paintIcon(size, logoBg || '#ffffff', img, letter, readableOn(accent))
      if (out) return out
    }
  }
  return paintIcon(size, accent, null, letter, readableOn(accent)) || ''
}

// ---------- Aplicação no <head> ----------

function setTag(el: HTMLElement) {
  el.setAttribute(TAG, '')
  document.head.appendChild(el)
}

function meta(name: string, content: string) {
  const el = document.createElement('meta')
  el.name = name
  el.content = content
  setTag(el)
}

export interface StorePwaInput {
  slug: string
  name: string
  themeColor?: string
}

/**
 * Ajusta o <head> do cardápio da loja: cor da barra do celular e nome do app no iPhone.
 * O manifest e o ícone vêm do servidor (/slug/manifest.webmanifest e /slug/pwa-icon.png),
 * porque o Android só instala como app de verdade quando eles têm endereço real.
 * Retorna a função que desfaz tudo (ao sair do cardápio).
 */
export function applyStorePwa(input: StorePwaInput): () => void {
  if (typeof document === 'undefined') return () => {}
  meta('theme-color', safeHex(input.themeColor))
  meta('apple-mobile-web-app-title', pwaShortName(input.name))
  return () => {
    document.head.querySelectorAll(`[${TAG}]`).forEach(el => el.remove())
  }
}

// ---------- Instalação ----------

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// O Chrome dispara 'beforeinstallprompt' logo após carregar a página, possivelmente antes deste módulo existir.
// O <head> da rota guarda o evento em window.__pwaPrompt; aqui pegamos esse e escutamos os próximos.
let deferredPrompt: InstallPromptEvent | null =
  typeof window !== 'undefined' ? ((window as any).__pwaPrompt as InstallPromptEvent | undefined) ?? null : null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(fn => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault() // guardamos para mostrar o botão "Instalar app" quando o cliente quiser
    deferredPrompt = e as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferredPrompt = null
    ;(window as any).__pwaPrompt = null
    notify()
  })
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true
  )
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export interface InstallState {
  /** Android/desktop Chrome: o navegador liberou a instalação com um clique. */
  canPrompt: boolean
  /** iPhone/iPad: não há prompt; mostramos o passo a passo do Compartilhar. */
  showIosHelp: boolean
  /** Já está aberto como app, ou acabou de ser instalado. */
  installed: boolean
}

export function getInstallState(): InstallState {
  const standalone = installed || isStandalone()
  return {
    canPrompt: !standalone && !!deferredPrompt,
    showIosHelp: !standalone && !deferredPrompt && isIOS(),
    installed: standalone,
  }
}

export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  const ev = deferredPrompt
  deferredPrompt = null // o prompt só pode ser usado uma vez
  notify()
  try {
    await ev.prompt()
    const choice = await ev.userChoice
    return choice.outcome === 'accepted'
  } catch {
    return false
  }
}
