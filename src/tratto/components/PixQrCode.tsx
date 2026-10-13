import { useEffect, useState } from 'react'

interface PixQrCodeProps {
  /** Código "copia e cola" completo (BR Code), já com valor. */
  payload: string
  /** Chave Pix para exibir/copiar. */
  pixKey: string
  holder?: string
}

/** QR Code Pix + chave + botões de copiar. Usado na assinatura da plataforma e no pedido do cliente. */
export default function PixQrCode({ payload, pixKey, holder }: PixQrCodeProps) {
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let alive = true
    import('qrcode')
      .then(m => (m.default || m).toDataURL(payload, { margin: 1, width: 320, errorCorrectionLevel: 'M' }))
      .then((url: string) => alive && setQr(url))
      .catch(() => alive && setQr(''))
    return () => { alive = false }
  }, [payload])

  const copy = async (text: string, kind: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(''), 1800)
    } catch {
      /* navegador sem permissão de área de transferência: o texto continua visível */
    }
  }

  return (
    <div className="text-sm text-left">
      {qr && (
        <div className="flex flex-col items-center">
          <img src={qr} alt="QR Code Pix" className="w-48 h-48 rounded-lg border bg-white p-1" />
          <p className="text-xs text-gray-500 mt-1">Aponte a câmera do app do seu banco</p>
        </div>
      )}
      <p className="text-gray-600 mt-3">Chave Pix{holder ? ` (${holder})` : ''}:</p>
      <p className="font-mono break-all bg-white border rounded-lg px-3 py-2 mt-1">{pixKey}</p>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button type="button" onClick={() => copy(pixKey, 'key')} className="rounded-lg border border-gray-300 py-2 font-semibold">
          {copied === 'key' ? 'Copiado!' : 'Copiar chave'}
        </button>
        <button type="button" onClick={() => copy(payload, 'code')} className="rounded-lg bg-[#d9273f] text-white py-2 font-semibold">
          {copied === 'code' ? 'Copiado!' : 'Pix copia e cola'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">O "copia e cola" já leva o valor. Cole na opção Pix do app do seu banco.</p>
    </div>
  )
}
