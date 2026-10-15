import { createFileRoute } from '@tanstack/react-router'
import { loadPwaStore, decodePngDataUrl } from '@/lib/pwa-store.server'

// Ícone (PNG 512x512) do app da loja. Sem ícone salvo, usa o ícone padrão da plataforma.
export const Route = createFileRoute('/$slug_/pwa-icon.png')({
  server: {
    handlers: {
      GET: async ({ params }: { params: { slug: string } }) => {
        let bytes: Uint8Array | null = null
        try { bytes = decodePngDataUrl((await loadPwaStore(params.slug))?.icon) } catch { bytes = null }
        if (!bytes) {
          return new Response(null, { status: 302, headers: { location: '/pwa-default-icon.png', 'cache-control': 'public, max-age=300' } })
        }
        return new Response(bytes as BodyInit, {
          headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600' },
        })
      },
    },
  },
})
