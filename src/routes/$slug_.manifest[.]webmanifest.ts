import { createFileRoute } from '@tanstack/react-router'
import { loadPwaStore } from '@/lib/pwa-store.server'
import { buildManifest, hashString } from '@/tratto/pwa'

// Manifest do app de UMA loja, com endereço real (necessário para o Android instalar como app de verdade).
export const Route = createFileRoute('/$slug_/manifest.webmanifest')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { slug: string } }) => {
        let store = null
        try { store = await loadPwaStore(params.slug) } catch { store = null }
        if (!store) {
          return new Response(JSON.stringify({ error: 'Loja não encontrada' }), {
            status: 404,
            headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
          })
        }
        const slug = encodeURIComponent(params.slug)
        const v = hashString(store.icon || '')
        const iconSrc = `/${slug}/pwa-icon.png?v=${v}`
        const manifest = buildManifest({
          slug: params.slug,
          name: store.name,
          origin: new URL(request.url).origin,
          themeColor: store.themeColor,
          backgroundColor: store.backgroundColor,
          icons: [
            { src: iconSrc, sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: iconSrc, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        })
        return new Response(JSON.stringify(manifest), {
          headers: {
            'content-type': 'application/manifest+json; charset=utf-8',
            'cache-control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
