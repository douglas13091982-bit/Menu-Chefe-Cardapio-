import { createServerFn } from '@tanstack/react-start'

// Dados mínimos da loja para a prévia do link (WhatsApp, Facebook, Google): nome e endereço do site.
// Roda no servidor, para que a prévia já venha no HTML (esses aplicativos não executam JavaScript).
export const getStoreHead = createServerFn({ method: 'GET' })
  .inputValidator((slug: unknown) => String(slug || '').slice(0, 80))
  .handler(async ({ data }) => {
    const { loadPwaStore } = await import('./pwa-store.server')
    const { getRequestUrl } = await import('@tanstack/react-start/server')
    const store = await loadPwaStore(data)
    let origin = ''
    try { origin = getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin } catch { /* sem origem: prévia sem imagem */ }
    return { name: store?.name || '', origin }
  })
