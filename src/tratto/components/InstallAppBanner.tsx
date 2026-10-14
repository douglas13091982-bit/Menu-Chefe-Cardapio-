import { useEffect, useState } from 'react'
import { getInstallState, promptInstall, subscribeInstall, safeHex, readableOn } from '../pwa'

const dismissKey = (slug: string) => `pwa-banner-dismissed:${slug}`

function wasDismissed(slug: string) {
  try { return localStorage.getItem(dismissKey(slug)) === '1' } catch { return false }
}

/**
 * Faixa discreta no topo do cardápio convidando a instalar o app da loja.
 * Só aparece quando dá para instalar (Android/Chrome) ou no iPhone (com o passo a passo) —
 * nunca dentro do app já instalado, e some se o cliente dispensar.
 */
export default function InstallAppBanner({ slug, storeName, accent }: { slug: string; storeName: string; accent?: string }) {
  const [state, setState] = useState(getInstallState)
  const [dismissed, setDismissed] = useState(() => wasDismissed(slug))
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const refresh = () => setState(getInstallState())
    refresh()
    return subscribeInstall(refresh)
  }, [])

  if (dismissed || state.installed || (!state.canPrompt && !state.showIosHelp)) return null

  const color = safeHex(accent)
  const text = readableOn(color)
  const close = () => {
    setDismissed(true)
    try { localStorage.setItem(dismissKey(slug), '1') } catch { /* sem localStorage: só some nesta visita */ }
  }

  return (
    <div role="region" aria-label="Instalar aplicativo" style={{ background: color, color: text }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span aria-hidden style={{ fontSize: '18px' }}>📲</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
          Instale o app de {storeName || 'nossa loja'} e peça mais rápido
        </span>
        <button
          type="button"
          onClick={() => { if (state.canPrompt) void promptInstall(); else setShowHelp(v => !v) }}
          style={{
            flexShrink: 0, border: 'none', borderRadius: '999px', padding: '6px 14px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 800, background: text, color,
          }}
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Dispensar"
          style={{ flexShrink: 0, border: 'none', background: 'transparent', color: text, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '4px' }}
        >
          ×
        </button>
      </div>
      {showHelp && state.showIosHelp && (
        <p style={{ margin: 0, padding: '0 12px 10px', maxWidth: '896px', marginInline: 'auto', fontSize: '12px', lineHeight: 1.5 }}>
          No iPhone: toque em <strong>Compartilhar</strong> (o ícone de quadrado com seta para cima) e depois em
          {' '}<strong>Adicionar à Tela de Início</strong>.
        </p>
      )}
    </div>
  )
}
